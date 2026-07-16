import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  analysisService,
  type ReviewLifecycleV1Response,
} from "@/api_service/analysis/analysisService";

const lifecycle: ReviewLifecycleV1Response = {
  schemaVersion: "review-lifecycle-v1",
  execution: {
    executionId: "exec-41",
    repositoryId: "github:codecrow/codecrow",
    pullRequestId: 41,
    headSha: "a".repeat(40),
    createdAt: "2026-07-16T08:00:00Z",
  },
  analysis: {
    state: "COMPLETE",
    revision: 4,
    coverage: {
      total: 3,
      analyzed: 2,
      pending: 0,
      ownerPending: 0,
      incomplete: 0,
      unsupported: 0,
      failed: 0,
      policyExcluded: 0,
      deletedRecorded: 1,
    },
    reasonCounts: {},
    updatedAt: "2026-07-16T08:01:00Z",
  },
  delivery: {
    state: "RETRYABLE_FAILED",
    attempts: 2,
    failureCode: "vcs_delivery_failed",
    updatedAt: "2026-07-16T08:02:00Z",
  },
  verification: {
    available: true,
    total: 2,
    supported: 1,
    refuted: 0,
    insufficientEvidence: 0,
    toolFailed: 0,
    intakeRejected: 0,
    unresolved: 0,
    producerRejected: 1,
  },
  previousIssues: [
    {
      predecessorExecutionId: "exec-40",
      predecessorFindingId: "b".repeat(64),
      state: "UNSUPPORTED",
      currentPath: null,
      currentStartLine: null,
      reasonCode: "renamed_or_modified",
    },
  ],
  gaps: [],
  events: [
    {
      schemaVersion: "review-lifecycle-event-v1",
      component: "analysis",
      revision: 4,
      state: "COMPLETE",
      occurredAt: "2026-07-16T08:01:00Z",
    },
  ],
};

describe("analysisService.getReviewLifecycle", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("codecrow_token", "access-token");
    vi.restoreAllMocks();
  });

  it("requests and returns the independently versioned lifecycle contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(lifecycle), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      analysisService.getReviewLifecycle("workspace", "project", 41),
    ).resolves.toEqual(lifecycle);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/v1/workspaces/workspace/projects/project/pull-requests/41/lifecycle`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
  });

  it("selects an execution without changing the stable resource path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(lifecycle), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await analysisService.getReviewLifecycle(
      "workspace",
      "project",
      41,
      "execution/a+b",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/v1/workspaces/workspace/projects/project/pull-requests/41/lifecycle?executionId=execution%2Fa%2Bb`,
      expect.any(Object),
    );
  });
});
