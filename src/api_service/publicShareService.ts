import { getApiUrl } from "@/config/api";
import type { QaDocTestCase } from "@/components/QaDocTestCases";

export interface PublicTestCasesPreview {
  title: string;
  projectName?: string | null;
  taskKey?: string | null;
  taskSummary?: string | null;
  testCases: QaDocTestCase[];
}

export async function getPublicSharePreview(
  token: string,
  signal?: AbortSignal,
): Promise<PublicTestCasesPreview> {
  const response = await fetch(getApiUrl("/public/shares/resolve"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
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
  return response.json() as Promise<PublicTestCasesPreview>;
}
