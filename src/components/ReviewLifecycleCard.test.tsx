import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { analysisService } from "@/api_service/analysis/analysisService";
import type {
  ReviewLifecycleAnalysisState,
  ReviewLifecycleV1Response,
} from "@/api_service/analysis/analysisService";
import ReviewLifecycleCard from "@/components/ReviewLifecycleCard";

vi.mock("@/api_service/analysis/analysisService", () => ({
  analysisService: {
    getReviewLifecycle: vi.fn(),
  },
}));

const getReviewLifecycle = vi.mocked(analysisService.getReviewLifecycle);

function lifecycle(
  analysisState: ReviewLifecycleAnalysisState = "COMPLETE",
): ReviewLifecycleV1Response {
  return {
    schemaVersion: "review-lifecycle-v1",
    execution: {
      executionId: "exec-secret",
      repositoryId: "repository-secret",
      pullRequestId: 41,
      headSha: "head-secret",
      createdAt: "2026-07-16T08:00:00Z",
    },
    analysis: {
      state: analysisState,
      revision: 4,
      coverage: {
        total: 9,
        analyzed: 2,
        pending: 1,
        ownerPending: 1,
        incomplete: 1,
        unsupported: 1,
        failed: 1,
        policyExcluded: 1,
        deletedRecorded: 1,
      },
      reasonCounts: { incomplete_context: 1 },
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
      total: 3,
      supported: 1,
      refuted: 0,
      insufficientEvidence: 1,
      toolFailed: 0,
      intakeRejected: 0,
      unresolved: 1,
      producerRejected: 0,
    },
    previousIssues: [
      {
        predecessorExecutionId: "previous-execution-secret",
        predecessorFindingId: "previous-finding-secret",
        state: "UNSUPPORTED",
        currentPath: "src/safe.ts",
        currentStartLine: 17,
        reasonCode: "renamed_or_modified",
      },
    ],
    gaps: [
      { component: "verification", code: "artifact_payload_unavailable" },
    ],
    events: [
      {
        schemaVersion: "review-lifecycle-event-v1",
        component: "analysis",
        revision: 4,
        state: "COMPLETE",
        occurredAt: "2026-07-16T08:01:00Z",
      },
    ],
    rawEvidence: "must-never-render",
  } as ReviewLifecycleV1Response & { rawEvidence: string };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

describe("ReviewLifecycleCard", () => {
  beforeEach(() => {
    getReviewLifecycle.mockReset();
  });

  it("renders safe lifecycle facts without treating delivery as analysis truth", async () => {
    getReviewLifecycle.mockResolvedValue(lifecycle());

    render(
      <ReviewLifecycleCard
        workspaceSlug="workspace"
        projectNamespace="project"
        prNumber={41}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("COMPLETE")).not.toBeNull();
    });

    expect(screen.queryByText("RETRYABLE FAILED")).not.toBeNull();
    expect(screen.queryByText("Attempts: 2")).not.toBeNull();
    expect(screen.queryByText("Failure: vcs_delivery_failed")).not.toBeNull();
    expect(screen.queryByText("Total: 9")).not.toBeNull();
    expect(screen.queryByText("Analyzed: 2")).not.toBeNull();
    expect(screen.queryByText("Pending: 1")).not.toBeNull();
    expect(screen.queryByText("Owner pending: 1")).not.toBeNull();
    expect(screen.queryByText("Incomplete: 1")).not.toBeNull();
    expect(screen.queryByText("Unsupported: 1")).not.toBeNull();
    expect(screen.queryByText("Failed: 1")).not.toBeNull();
    expect(screen.queryByText("Policy excluded: 1")).not.toBeNull();
    expect(screen.queryByText("Deleted recorded: 1")).not.toBeNull();
    expect(screen.queryByText("Verification")).not.toBeNull();
    expect(screen.queryByText("Total: 3")).not.toBeNull();
    expect(screen.queryByText("Supported: 1")).not.toBeNull();
    expect(screen.queryByText("Insufficient evidence: 1")).not.toBeNull();
    expect(screen.queryByText("Unresolved: 1")).not.toBeNull();
    expect(
      screen.queryByText("verification: artifact_payload_unavailable"),
    ).not.toBeNull();
    expect(screen.queryByText("UNSUPPORTED")).not.toBeNull();
    expect(screen.queryByText("src/safe.ts:17")).not.toBeNull();
    expect(screen.queryByText("renamed_or_modified")).not.toBeNull();

    expect(screen.queryByText("exec-secret")).toBeNull();
    expect(screen.queryByText("repository-secret")).toBeNull();
    expect(screen.queryByText("previous-execution-secret")).toBeNull();
    expect(screen.queryByText("previous-finding-secret")).toBeNull();
    expect(screen.queryByText("review-lifecycle-event-v1")).toBeNull();
    expect(screen.queryByText("must-never-render")).toBeNull();
  });

  it("ignores a stale response after the selected pull request changes", async () => {
    const oldRequest = deferred<ReviewLifecycleV1Response>();
    const currentRequest = deferred<ReviewLifecycleV1Response>();
    getReviewLifecycle
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(currentRequest.promise);

    const { rerender } = render(
      <ReviewLifecycleCard
        workspaceSlug="workspace"
        projectNamespace="project"
        prNumber={41}
      />,
    );

    rerender(
      <ReviewLifecycleCard
        workspaceSlug="workspace"
        projectNamespace="project"
        prNumber={42}
      />,
    );

    await act(async () => {
      currentRequest.resolve(lifecycle("PARTIAL"));
      await currentRequest.promise;
    });
    expect(screen.queryByText("PARTIAL")).not.toBeNull();

    await act(async () => {
      oldRequest.resolve(lifecycle("COMPLETE"));
      await oldRequest.promise;
    });
    expect(screen.queryByText("PARTIAL")).not.toBeNull();
    expect(screen.queryByText("COMPLETE")).toBeNull();
  });

  it("reports unavailable when lifecycle facts cannot be loaded", async () => {
    getReviewLifecycle.mockRejectedValue(new Error("provider details"));

    render(
      <ReviewLifecycleCard
        workspaceSlug="workspace"
        projectNamespace="project"
        prNumber={41}
      />,
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Lifecycle information unavailable."),
      ).not.toBeNull();
    });
    expect(screen.queryByText(/all clear/i)).toBeNull();
    expect(screen.queryByText("provider details")).toBeNull();
  });
});
