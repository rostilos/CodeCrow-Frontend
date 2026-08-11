import { getApiUrl } from "@/config/api";
import type { QaDocTestCase } from "@/components/QaDocTestCases";
import { authUtils } from "@/lib/auth";

export interface PublicQaDocPreview {
  title: string;
  projectName?: string | null;
  taskKey?: string | null;
  taskSummary?: string | null;
  overviewMarkdown?: string | null;
  testCases: QaDocTestCase[];
  environmentMarkdown?: string | null;
}

export interface PublicSharePreviewResponse<TContent> {
  resourceType: string;
  content: TContent;
  authorizedPath?: string | null;
}

export async function getPublicSharePreview(
  token: string,
  signal?: AbortSignal,
): Promise<PublicSharePreviewResponse<PublicQaDocPreview>> {
  const response = await fetch(getApiUrl("/public/shares/resolve"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...authUtils.getAuthHeaders(),
    },
    body: JSON.stringify({ token }),
    cache: "no-store",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    signal,
  });

  if (!response.ok) {
    throw new Error("This public preview is unavailable or the link is no longer valid.");
  }
  return response.json() as Promise<PublicSharePreviewResponse<PublicQaDocPreview>>;
}
