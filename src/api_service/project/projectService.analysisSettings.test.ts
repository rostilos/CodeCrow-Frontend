import { beforeEach, describe, expect, it, vi } from "vitest";

import { projectService } from "@/api_service/project/projectService";

describe("projectService.updateAnalysisSettings", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("codecrow_token", "access-token");
    vi.restoreAllMocks();
  });

  it("serializes the selected review approach on the analysis settings endpoint", async () => {
    const response = {
      id: 1,
      name: "CodeCrow",
      reviewApproach: "AGENTIC",
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      projectService.updateAnalysisSettings("workspace", "project", {
        prAnalysisEnabled: true,
        reviewApproach: "AGENTIC",
      }),
    ).resolves.toEqual(response);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/workspace/project/project/analysis-settings`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          prAnalysisEnabled: true,
          reviewApproach: "AGENTIC",
        }),
      }),
    );
  });
});
