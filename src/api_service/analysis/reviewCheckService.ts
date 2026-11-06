import { ApiService } from "../api";

export interface ReviewCheckFinding {
  id: number;
  severity: "HIGH" | "MEDIUM" | "LOW" | "INFO";
  file: string;
  line: number | null;
  title: string;
  description: string;
  suggestedFix: string | null;
  codeSnippet: string | null;
  resolved: boolean;
  resolution: string | null;
}

export interface ReviewCheckResult {
  id: string;
  complete: boolean;
  diagnostics: string[];
  findings: ReviewCheckFinding[];
}

export interface ReviewChecksResponse {
  analysisId: number;
  version: number;
  checks: ReviewCheckResult[];
}

class ReviewCheckService extends ApiService {
  private base(workspace: string, project: string) {
    return `/${encodeURIComponent(workspace)}/project/${encodeURIComponent(project)}/analysis/review-checks`;
  }

  list(workspace: string, project: string, prNumber: number, version: number) {
    const query = new URLSearchParams({ pullRequestId: String(prNumber), prVersion: String(version) });
    return this.request<ReviewChecksResponse>(`${this.base(workspace, project)}?${query}`, {}, true);
  }

  updateStatus(workspace: string, project: string, finding: ReviewCheckFinding) {
    return this.request<void>(`${this.base(workspace, project)}/findings/${finding.id}/status`, {
      method: "PUT",
      body: JSON.stringify({ resolved: !finding.resolved,
        reason: finding.resolved ? "Reopened by reviewer" : "Marked resolved by reviewer" }),
    }, true);
  }
}

export const reviewCheckService = new ReviewCheckService();
