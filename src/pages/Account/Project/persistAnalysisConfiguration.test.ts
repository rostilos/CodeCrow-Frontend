import { describe, expect, it, vi } from "vitest";

import { persistAnalysisConfiguration } from "./persistAnalysisConfiguration";

describe("persistAnalysisConfiguration", () => {
  it("serializes whole-config writes and saves review approach last", async () => {
    const calls: string[] = [];
    const writer = {
      updateAnalysisLimits: vi.fn(async () => {
        calls.push("limits");
      }),
      updateAnalysisScope: vi.fn(async () => {
        calls.push("scope");
      }),
      updateAnalysisSettings: vi.fn(async () => {
        calls.push("settings");
      }),
    };

    await persistAnalysisConfiguration(
      writer,
      "workspace",
      "project",
      { reviewApproach: "AGENTIC" },
      {
        maxFiles: null,
        maxFileSizeBytes: null,
        maxTotalDiffSizeBytes: null,
        maxTotalTokens: null,
      },
      { includePatterns: [], excludePatterns: [] },
    );

    expect(calls).toEqual(["limits", "scope", "settings"]);
    expect(writer.updateAnalysisSettings).toHaveBeenCalledWith(
      "workspace",
      "project",
      { reviewApproach: "AGENTIC" },
    );
  });

  it("propagates a failed prerequisite without writing stale settings", async () => {
    const failure = new Error("scope update failed");
    const writer = {
      updateAnalysisLimits: vi.fn().mockResolvedValue(undefined),
      updateAnalysisScope: vi.fn().mockRejectedValue(failure),
      updateAnalysisSettings: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      persistAnalysisConfiguration(
        writer,
        "workspace",
        "project",
        { reviewApproach: "AGENTIC" },
        {
          maxFiles: null,
          maxFileSizeBytes: null,
          maxTotalDiffSizeBytes: null,
          maxTotalTokens: null,
        },
        { includePatterns: [], excludePatterns: [] },
      ),
    ).rejects.toBe(failure);

    expect(writer.updateAnalysisSettings).not.toHaveBeenCalled();
  });
});
