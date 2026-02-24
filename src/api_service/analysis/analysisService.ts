import { ApiService } from "@/api_service/api";

export interface IssueStatusUpdateRequest {
  isResolved: boolean;
  comment?: string;
  resolvedByPr?: number;
  resolvedCommitHash?: string;
}

export interface IssueStatusUpdateResponse {
  success: boolean;
  issueId: number;
  newStatus: string | null;
  analysisId: number | null;
  analysisResult: "PASSED" | "FAILED" | "SKIPPED" | null;
  totalIssues: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  infoSeverityCount: number;
  resolvedCount: number;
  errorMessage?: string | null;
}

export interface BulkStatusUpdateResponse {
  successCount: number;
  failureCount: number;
  failedIds: number[];
  newStatus: string;
}

export interface ProjectAnalysisSummary {
  totalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  lastAnalysisDate?: string;
  branches: string[];
  pullRequests: PullRequestSummary[];
}

export interface PullRequestSummary {
  id: number;
  prNumber: number;
  commitHash: string;
  sourceBranchName: string | null;
  targetBranchName: string;
  title?: string;
  description?: string;
}

export interface PullRequestsByBranchResponse {
  [branchName: string]: PullRequestDTO[];
}

export interface PullRequestDTO {
  id: number;
  prNumber: number;
  commitHash: string;
  sourceBranchName?: string;
  targetBranchName: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  title?: string;
  description?: string;
  analysisResult?: "PASSED" | "FAILED" | "SKIPPED" | null;
  highSeverityCount?: number;
  mediumSeverityCount?: number;
  lowSeverityCount?: number;
  infoSeverityCount?: number;
  totalIssues?: number;
}

export interface AnalysisHistory {
  id: string;
  branch: string;
  commitHash: string;
  analysisDate: string;
  totalIssues: number;
  status: "completed" | "failed" | "in_progress";
}

export interface AnalysesHistoryResponse {
  content: AnalysisHistory[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface PullRequestsResponse {
  content: PullRequestSummary[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ProjectSummaryResponse {
  totalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  infoIssues?: number;
  lastAnalysisDate?: string;
  trend?: "up" | "down" | "stable";
}

export interface DetailedStatsResponse {
  totalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  infoIssues?: number;
  lastAnalysisDate?: string;
  trend?: "up" | "down" | "stable";
  // Individual fields for convenience (mapped from issuesByType)
  securityIssues?: number;
  qualityIssues?: number;
  performanceIssues?: number;
  styleIssues?: number;
  // The actual backend field
  issuesByType?: Record<string, number>;
  issuesBySeverity?: Record<string, number>;
  resolvedIssuesCount: number;
  openIssuesCount: number;
  ignoredIssuesCount: number;
  averageResolutionTime?: number;
  issuesTrendData?: Array<{
    date: string;
    high: number;
    medium: number;
    low: number;
  }>;
  topFiles?: Array<{
    file: string;
    issues: number;
    severity: string;
  }>;
  recentAnalyses?: Array<{
    date: string;
    totalIssues: number;
    targetBranch: string;
    sourceBranch: string | null;
    status: string;
  }>;
}

export interface AnalysisIssueSummary {
  totalIssues: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount?: number;
  securityCount: number;
  qualityCount: number;
  performanceCount: number;
  styleCount: number;
  bugRiskCount: number;
  documentationCount: number;
  bestPracticesCount: number;
  errorHandlingCount: number;
  testingCount: number;
  architectureCount: number;
}

export interface AnalysisIssuesResponse {
  issues: AnalysisIssue[];
  summary: AnalysisIssueSummary;
  maxVersion?: number;
  currentVersion?: number;
  analysisSummary?: string; // The comment/summary from the analysis
  commitHash?: string; // The commit hash for this specific analysis version
}

export interface AnalysisIssue {
  id: string;
  type: string | null;
  severity: "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  suggestedFixDescription?: string;
  suggestedFixDiff?: string;
  file: string;
  line: number;
  column?: number | null;
  rule?: string | null;
  pullRequest?: string;
  pullRequestId?: string;
  branch: string;
  status: "open" | "resolved" | "ignored";
  createdAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  aiProvider?: string | null;
  confidence?: number | null;
  issueCategory?: string;
  // Detection info - where was this issue first found
  analysisId?: number | null;
  prNumber?: number | null;
  commitHash?: string | null;
  detectedAt?: string | null;
  // Resolution info - populated when issue is resolved
  resolvedDescription?: string | null;
  resolvedByPr?: number | null;
  resolvedCommitHash?: string | null;
  resolvedAnalysisId?: number | null;
  // VCS author info - who created the PR that introduced this issue
  vcsAuthorId?: string | null;
  vcsAuthorUsername?: string | null;
}

export interface AnalysisTrendData {
  date: string;
  resolvedCount: number;
  totalIssues: number;
  resolvedRate: number;
}

export interface BranchIssuesTrendPoint {
  date: string;
  totalIssues: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
}

// ── Source Code Viewer types ─────────────────────────────────────────────

export interface AnalysisFilesResponse {
  analysisId: number;
  commitHash: string;
  prVersion: number | null;
  files: AnalysisFileEntry[];
}

export interface AnalysisFileEntry {
  filePath: string;
  lineCount: number;
  sizeBytes: number;
  issueCount: number;
  highCount: number;
  mediumCount: number;
}

export interface FileViewResponse {
  filePath: string;
  content: string;
  lineCount: number;
  commitHash: string;
  analysisId: number;
  prVersion: number | null;
  issues: InlineIssue[];
}

export interface InlineIssue {
  issueId: number;
  lineNumber: number;
  severity: string;
  title: string;
  reason: string;
  category: string;
  resolved: boolean;
  suggestedFixDescription: string | null;
  suggestedFixDiff: string | null;
  trackedFromIssueId: number | null;
  trackingConfidence: string | null;
}

export interface FileSnippetResponse {
  filePath: string;
  analysisId: number;
  startLine: number;
  endLine: number;
  totalLineCount: number;
  lines: SnippetLine[];
  issues: InlineIssue[];
}

export interface SnippetLine {
  lineNumber: number;
  content: string;
}

export interface SourceAvailabilityResponse {
  branches: string[];
  prNumbers: number[];
}

class AnalysisService extends ApiService {
  async updateIssueStatus(
    workspaceSlug: string,
    namespace: string,
    issueId: string | number,
    isResolved: boolean,
    comment?: string,
    resolvedByPr?: number,
    resolvedCommitHash?: string,
  ): Promise<IssueStatusUpdateResponse> {
    const body: IssueStatusUpdateRequest = { isResolved };
    if (comment) body.comment = comment;
    if (resolvedByPr) body.resolvedByPr = resolvedByPr;
    if (resolvedCommitHash) body.resolvedCommitHash = resolvedCommitHash;

    return this.request<IssueStatusUpdateResponse>(
      `/${workspaceSlug}/projects/${namespace}/analysis/issues/${issueId}/status`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      },
      true,
    );
  }

  async bulkUpdateIssueStatus(
    workspaceSlug: string,
    namespace: string,
    issueIds: (string | number)[],
    isResolved: boolean,
    comment?: string,
  ): Promise<BulkStatusUpdateResponse> {
    return this.request<BulkStatusUpdateResponse>(
      `/${workspaceSlug}/projects/${namespace}/analysis/issues/bulk-status`,
      {
        method: "PUT",
        body: JSON.stringify({
          issueIds: issueIds.map((id) => Number(id)),
          isResolved,
          comment,
        }),
      },
      true,
    );
  }

  async getProjectSummary(
    workspaceSlug: string,
    namespace: string,
  ): Promise<ProjectAnalysisSummary> {
    return this.request<ProjectAnalysisSummary>(
      `/${workspaceSlug}/project/${namespace}/analysis/summary`,
      {},
      true,
    );
  }

  async getAnalysisHistory(
    workspaceSlug: string,
    namespace: string,
    page: number = 1,
    pageSize: number = 20,
    branch?: string,
  ): Promise<AnalysesHistoryResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (branch) {
      params.append("branch", branch);
    }

    return this.request<AnalysesHistoryResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/history?${params.toString()}`,
      {},
      true,
    );
  }

  async getPullRequests(
    workspaceSlug: string,
    namespace: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PullRequestsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    return this.request<PullRequestsResponse>(
      `/${workspaceSlug}/project/${namespace}/pull-requests?${params.toString()}`,
      {},
      true,
    );
  }

  async getAnalysisDataByPR(
    workspaceSlug: string,
    namespace: string,
    pullRequestId: string,
  ): Promise<AnalysisIssue[]> {
    return this.request<AnalysisIssue[]>(
      `/${workspaceSlug}/project/${namespace}/analysis/pull-requests/${pullRequestId}/issues`,
      {},
      true,
    );
  }

  async getProjectAnalysisSummary(
    workspaceSlug: string,
    namespace: string,
    branch?: string,
  ): Promise<ProjectSummaryResponse> {
    const params = branch ? `?branch=${encodeURIComponent(branch)}` : "";
    return this.request<ProjectSummaryResponse>(
      `/${workspaceSlug}/projects/${namespace}/analysis/summary${params}`,
      {},
      true,
    );
  }

  async getProjectDetailedStats(
    workspaceSlug: string,
    namespace: string,
    branch?: string,
    timeframeDays?: number,
  ): Promise<DetailedStatsResponse> {
    const params = new URLSearchParams();
    if (branch) {
      params.append("branch", branch);
    }
    if (timeframeDays !== undefined) {
      params.append("timeframeDays", timeframeDays.toString());
    }
    const queryString = params.toString();
    return this.request<DetailedStatsResponse>(
      `/${workspaceSlug}/projects/${namespace}/analysis/detailed-stats${queryString ? `?${queryString}` : ""}`,
      {},
      true,
    );
  }

  async getIssueById(
    workspaceSlug: string,
    namespace: string,
    issueId: string | number,
  ): Promise<AnalysisIssue> {
    return this.request<AnalysisIssue>(
      `/${workspaceSlug}/project/${namespace}/analysis/issues/${issueId}`,
      {},
      true,
    );
  }

  async getAnalysisIssues(
    workspaceSlug: string,
    namespace: string,
    pullRequestId: string,
    prVersion?: number,
  ): Promise<AnalysisIssuesResponse> {
    const params = new URLSearchParams({
      pullRequestId: pullRequestId,
    });

    if (prVersion !== undefined) {
      params.append("prVersion", prVersion.toString());
    }

    const url = `/${workspaceSlug}/project/${namespace}/analysis/issues?${params.toString()}`;

    const response = await this.request<AnalysisIssuesResponse>(url, {}, true);
    console.log("Raw API response for analysis issues:", response);

    return response;
  }

  async getAnalysisTrends(
    workspaceSlug: string,
    namespace: string,
    timeframeDays?: number,
  ): Promise<AnalysisTrendData[]> {
    const params = new URLSearchParams();
    if (timeframeDays !== undefined) {
      params.append("timeframeDays", timeframeDays.toString());
    }
    const queryString = params.toString();
    return this.request<AnalysisTrendData[]>(
      `/${workspaceSlug}/projects/${namespace}/analysis/trends/resolved${queryString ? `?${queryString}` : ""}`,
      {},
      true,
    );
  }

  async getBranchIssuesTrend(
    workspaceSlug: string,
    namespace: string,
    branch: string,
    limit?: number,
    timeframeDays?: number,
  ): Promise<BranchIssuesTrendPoint[]> {
    const params = new URLSearchParams();
    params.append("branch", branch);
    if (limit !== undefined) {
      params.append("limit", limit.toString());
    }
    if (timeframeDays !== undefined) {
      params.append("timeframeDays", timeframeDays.toString());
    }
    return this.request<BranchIssuesTrendPoint[]>(
      `/${workspaceSlug}/projects/${namespace}/analysis/trends/issues?${params.toString()}`,
      {},
      true,
    );
  }

  async getPullRequestsByBranch(
    workspaceSlug: string,
    namespace: string,
  ): Promise<PullRequestsByBranchResponse> {
    return this.request<PullRequestsByBranchResponse>(
      `/${workspaceSlug}/project/${namespace}/pull-requests/by-branch`,
      {},
      true,
    );
  }

  async getBranchIssues(
    workspaceSlug: string,
    namespace: string,
    branchName: string,
    status: string = "open",
    page: number = 1,
    pageSize: number = 50,
    excludeDiff: boolean = true,
    filters?: {
      severity?: string;
      category?: string;
      filePath?: string;
      dateFrom?: Date;
      dateTo?: Date;
      author?: string;
    },
  ): Promise<{
    issues: AnalysisIssue[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const params = new URLSearchParams({
      status,
      page: page.toString(),
      pageSize: pageSize.toString(),
      excludeDiff: excludeDiff.toString(),
    });

    // Add optional filter params
    if (filters?.severity && filters.severity !== "ALL") {
      params.append("severity", filters.severity);
    }
    if (filters?.category && filters.category !== "ALL") {
      params.append("category", filters.category);
    }
    if (filters?.filePath) {
      params.append("filePath", filters.filePath);
    }
    if (filters?.dateFrom) {
      params.append("dateFrom", filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      params.append("dateTo", filters.dateTo.toISOString());
    }
    if (filters?.author && filters.author !== "ALL") {
      params.append("author", filters.author);
    }

    // Branch name goes as query param to avoid Cloudflare blocking encoded slashes in path
    params.append("branchName", branchName);

    const response = await this.request<
      | AnalysisIssue[]
      | {
          issues: AnalysisIssue[];
          total: number;
          page: number;
          pageSize: number;
        }
    >(
      `/${workspaceSlug}/project/${namespace}/pull-requests/branches/issues?${params.toString()}`,
      {},
      true,
    );

    // Handle backward compatibility - if API returns array, wrap it in paginated response
    if (Array.isArray(response)) {
      return {
        issues: response,
        total: response.length,
        page: 1,
        pageSize: response.length,
      };
    }

    return response;
  }
  // ── Source Code Viewer API ─────────────────────────────────────────────

  async getLatestBranchAnalysis(
    workspaceSlug: string,
    namespace: string,
    branchName: string,
  ): Promise<{
    analysisId: number;
    branchName: string;
    commitHash: string;
    createdAt: string | null;
  }> {
    const params = new URLSearchParams({ branch: branchName });
    return this.request<{
      analysisId: number;
      branchName: string;
      commitHash: string;
      createdAt: string | null;
    }>(
      `/${workspaceSlug}/project/${namespace}/analysis/branch-latest?${params.toString()}`,
      {},
      true,
    );
  }

  async getAnalysisFiles(
    workspaceSlug: string,
    namespace: string,
    analysisId: number | string,
  ): Promise<AnalysisFilesResponse> {
    return this.request<AnalysisFilesResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/${analysisId}/files`,
      {},
      true,
    );
  }

  async getFileView(
    workspaceSlug: string,
    namespace: string,
    analysisId: number | string,
    filePath: string,
  ): Promise<FileViewResponse> {
    const params = new URLSearchParams({ path: filePath });
    return this.request<FileViewResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/${analysisId}/file-view?${params.toString()}`,
      {},
      true,
    );
  }

  async getFileSnippet(
    workspaceSlug: string,
    namespace: string,
    analysisId: number | string,
    filePath: string,
    line: number,
    context: number = 10,
  ): Promise<FileSnippetResponse> {
    const params = new URLSearchParams({
      path: filePath,
      line: String(line),
      context: String(context),
    });
    return this.request<FileSnippetResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/${analysisId}/file-snippet?${params.toString()}`,
      {},
      true,
    );
  }

  async getFileSnippetByRange(
    workspaceSlug: string,
    namespace: string,
    analysisId: number | string,
    filePath: string,
    startLine: number,
    endLine: number,
  ): Promise<FileSnippetResponse> {
    const params = new URLSearchParams({
      path: filePath,
      startLine: String(startLine),
      endLine: String(endLine),
    });
    return this.request<FileSnippetResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/${analysisId}/file-snippet?${params.toString()}`,
      {},
      true,
    );
  }

  // ── PR-level Source Code Viewer API ────────────────────────────────────

  async getPrFiles(
    workspaceSlug: string,
    namespace: string,
    prNumber: number | string,
  ): Promise<AnalysisFilesResponse> {
    return this.request<AnalysisFilesResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/pr/${prNumber}/files`,
      {},
      true,
    );
  }

  async getPrFileView(
    workspaceSlug: string,
    namespace: string,
    prNumber: number | string,
    filePath: string,
  ): Promise<FileViewResponse> {
    const params = new URLSearchParams({ path: filePath });
    return this.request<FileViewResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/pr/${prNumber}/file-view?${params.toString()}`,
      {},
      true,
    );
  }

  async getPrFileSnippet(
    workspaceSlug: string,
    namespace: string,
    prNumber: number | string,
    filePath: string,
    line: number,
    context: number = 10,
  ): Promise<FileSnippetResponse> {
    const params = new URLSearchParams({
      path: filePath,
      line: String(line),
      context: String(context),
    });
    return this.request<FileSnippetResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/pr/${prNumber}/file-snippet?${params.toString()}`,
      {},
      true,
    );
  }

  async getPrFileSnippetByRange(
    workspaceSlug: string,
    namespace: string,
    prNumber: number | string,
    filePath: string,
    startLine: number,
    endLine: number,
  ): Promise<FileSnippetResponse> {
    const params = new URLSearchParams({
      path: filePath,
      startLine: String(startLine),
      endLine: String(endLine),
    });
    return this.request<FileSnippetResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/pr/${prNumber}/file-snippet?${params.toString()}`,
      {},
      true,
    );
  }

  // ── Branch-level Source Code Viewer API ─────────────────────────────

  async getBranchFiles(
    workspaceSlug: string,
    namespace: string,
    branchName: string,
  ): Promise<AnalysisFilesResponse> {
    return this.request<AnalysisFilesResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/branch/${encodeURIComponent(branchName)}/files`,
      {},
      true,
    );
  }

  async getBranchFileView(
    workspaceSlug: string,
    namespace: string,
    branchName: string,
    filePath: string,
  ): Promise<FileViewResponse> {
    const params = new URLSearchParams({ path: filePath });
    return this.request<FileViewResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/branch/${encodeURIComponent(branchName)}/file-view?${params.toString()}`,
      {},
      true,
    );
  }

  async getBranchFileSnippet(
    workspaceSlug: string,
    namespace: string,
    branchName: string,
    filePath: string,
    line: number,
    context: number = 10,
  ): Promise<FileSnippetResponse> {
    const params = new URLSearchParams({
      path: filePath,
      line: String(line),
      context: String(context),
    });
    return this.request<FileSnippetResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/branch/${encodeURIComponent(branchName)}/file-snippet?${params.toString()}`,
      {},
      true,
    );
  }

  async getBranchFileSnippetByRange(
    workspaceSlug: string,
    namespace: string,
    branchName: string,
    filePath: string,
    startLine: number,
    endLine: number,
  ): Promise<FileSnippetResponse> {
    const params = new URLSearchParams({
      path: filePath,
      startLine: String(startLine),
      endLine: String(endLine),
    });
    return this.request<FileSnippetResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/branch/${encodeURIComponent(branchName)}/file-snippet?${params.toString()}`,
      {},
      true,
    );
  }

  // ── Source Availability API ────────────────────────────────────────

  async getSourceAvailability(
    workspaceSlug: string,
    namespace: string,
  ): Promise<SourceAvailabilityResponse> {
    return this.request<SourceAvailabilityResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/source-availability`,
      {},
      true,
    );
  }
}

export const analysisService = new AnalysisService();
