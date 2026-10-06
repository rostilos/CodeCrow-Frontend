import { ApiService } from "../api";

export type FeedbackVerdict = "VALID" | "FALSE_POSITIVE";
export interface LearnedReviewRule {
  id: string;
  title: string;
  filePath: string;
  issueCategory: string | null;
  description: string;
  ruleType: "ENFORCE" | "SUPPRESS";
  state: "CANDIDATE" | "ACTIVE" | "CONTESTED" | "DISABLED";
  effective: boolean;
  validVotes: number;
  falsePositiveVotes: number;
  distinctIssues: number;
  promotedBy: number | null;
  promotedAt: string | null;
  evidence: Array<{
    id: number;
    issueId: number;
    analysisId: number;
    commitHash: string | null;
    userId: number;
    verdict: FeedbackVerdict;
    explanation: string;
    createdAt: string;
  }>;
}

class ReviewFeedbackService extends ApiService {
  private base(workspace: string, project: string) {
    return `/${encodeURIComponent(workspace)}/project/${encodeURIComponent(project)}/review-feedback`;
  }

  record(workspace: string, project: string, issueId: string, verdict: FeedbackVerdict, explanation: string) {
    return this.request<LearnedReviewRule>(`${this.base(workspace, project)}/issues/${encodeURIComponent(issueId)}`,
      { method: "PUT", body: JSON.stringify({ verdict, explanation }) }, true);
  }

  list(workspace: string, project: string) {
    return this.request<LearnedReviewRule[]>(`${this.base(workspace, project)}/rules`, {}, true);
  }

  promote(workspace: string, project: string, id: string, description: string) {
    return this.request<LearnedReviewRule>(`${this.base(workspace, project)}/rules/${encodeURIComponent(id)}/promote`,
      { method: "POST", body: JSON.stringify({ description }) }, true);
  }

  disable(workspace: string, project: string, id: string) {
    return this.request<LearnedReviewRule>(`${this.base(workspace, project)}/rules/${encodeURIComponent(id)}/disable`,
      { method: "POST" }, true);
  }
}

export const reviewFeedbackService = new ReviewFeedbackService();
