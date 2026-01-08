import { ApiService } from '@/api_service/api';

export interface IssueStatusUpdateRequest {
  isResolved: boolean;
  comment?: string;
  resolvedByPr?: number;
  resolvedCommitHash?: string;
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
}

export interface AnalysisHistory {
  id: string;
  branch: string;
  commitHash: string;
  analysisDate: string;
  totalIssues: number;
  status: 'completed' | 'failed' | 'in_progress';
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
  lastAnalysisDate?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface DetailedStatsResponse {
  totalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  lastAnalysisDate?: string;
  trend?: 'up' | 'down' | 'stable';
  // Individual fields for convenience (mapped from issuesByType)
  securityIssues?: number;
  qualityIssues?: number;
  performanceIssues?: number;
  styleIssues?: number;
  // The actual backend field
  issuesByType?: Record<string, number>;
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
  severity: 'high' | 'medium' | 'low';
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
  status: 'open' | 'resolved' | 'ignored';
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

class AnalysisService extends ApiService {
  async updateIssueStatus(
    workspaceSlug: string,
    namespace: string, 
    issueId: string | number, 
    isResolved: boolean,
    comment?: string,
    resolvedByPr?: number,
    resolvedCommitHash?: string
  ): Promise<any> {
    const body: IssueStatusUpdateRequest = { isResolved };
    if (comment) body.comment = comment;
    if (resolvedByPr) body.resolvedByPr = resolvedByPr;
    if (resolvedCommitHash) body.resolvedCommitHash = resolvedCommitHash;
    
    return this.request<any>(`/${workspaceSlug}/projects/${namespace}/analysis/issues/${issueId}/status`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, true);
  }

  async bulkUpdateIssueStatus(
    workspaceSlug: string,
    namespace: string,
    issueIds: (string | number)[],
    isResolved: boolean,
    comment?: string
  ): Promise<BulkStatusUpdateResponse> {
    return this.request<BulkStatusUpdateResponse>(`/${workspaceSlug}/projects/${namespace}/analysis/issues/bulk-status`, {
      method: 'PUT',
      body: JSON.stringify({ issueIds: issueIds.map(id => Number(id)), isResolved, comment }),
    }, true);
  }

  async getProjectSummary(workspaceSlug: string, namespace: string): Promise<ProjectAnalysisSummary> {
    return this.request<ProjectAnalysisSummary>(`/${workspaceSlug}/project/${namespace}/analysis/summary`, {}, true);
  }

  async getAnalysisHistory(
    workspaceSlug: string,
    namespace: string, 
    page: number = 1, 
    pageSize: number = 20, 
    branch?: string
  ): Promise<AnalysesHistoryResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (branch) {
      params.append('branch', branch);
    }

    return this.request<AnalysesHistoryResponse>(
      `/${workspaceSlug}/project/${namespace}/analysis/history?${params.toString()}`,
      {}, 
      true
    );
  }

  async getPullRequests(
    workspaceSlug: string,
    namespace: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<PullRequestSummary[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    return this.request<PullRequestSummary[]>(
      `/${workspaceSlug}/project/${namespace}/pull-requests?${params.toString()}`,
      {}, 
      true
    );
  }

  async getAnalysisDataByPR(
    workspaceSlug: string,
    namespace: string, 
    pullRequestId: string
  ): Promise<AnalysisIssue[]> {
    return this.request<AnalysisIssue[]>(
      `/${workspaceSlug}/project/${namespace}/analysis/pull-requests/${pullRequestId}/issues`,
      {}, 
      true
    );
  }

  async getProjectAnalysisSummary(workspaceSlug: string, namespace: string, branch?: string): Promise<ProjectSummaryResponse> {
    const params = branch ? `?branch=${encodeURIComponent(branch)}` : '';
    return this.request<ProjectSummaryResponse>(`/${workspaceSlug}/projects/${namespace}/analysis/summary${params}`, {}, true);
  }

  async getProjectDetailedStats(workspaceSlug: string, namespace: string, branch?: string, timeframeDays?: number): Promise<DetailedStatsResponse> {
    const params = new URLSearchParams();
    if (branch) {
      params.append('branch', branch);
    }
    if (timeframeDays !== undefined) {
      params.append('timeframeDays', timeframeDays.toString());
    }
    const queryString = params.toString();
    return this.request<DetailedStatsResponse>(`/${workspaceSlug}/projects/${namespace}/analysis/detailed-stats${queryString ? `?${queryString}` : ''}`, {}, true);
  }

  async getIssueById(
    workspaceSlug: string,
    namespace: string, 
    issueId: string | number
  ): Promise<AnalysisIssue> {
    return this.request<AnalysisIssue>(
      `/${workspaceSlug}/project/${namespace}/analysis/issues/${issueId}`,
      {}, 
      true
    );
  }

  async getAnalysisIssues(
    workspaceSlug: string,
    namespace: string,
    pullRequestId: string,
    prVersion?: number
  ): Promise<AnalysisIssuesResponse> {
    const params = new URLSearchParams({
      pullRequestId: pullRequestId,
    });
    
    if (prVersion !== undefined) {
      params.append('prVersion', prVersion.toString());
    }
    
    const url = `/${workspaceSlug}/project/${namespace}/analysis/issues?${params.toString()}`;
    
    const response = await this.request<AnalysisIssuesResponse>(url, {}, true);
    console.log('Raw API response for analysis issues:', response);
    
    return response;
  }

  async getAnalysisTrends(
    workspaceSlug: string,
    namespace: string,
    timeframeDays?: number
  ): Promise<AnalysisTrendData[]> {
    const params = new URLSearchParams();
    if (timeframeDays !== undefined) {
      params.append('timeframeDays', timeframeDays.toString());
    }
    const queryString = params.toString();
    return this.request<AnalysisTrendData[]>(
      `/${workspaceSlug}/projects/${namespace}/analysis/trends/resolved${queryString ? `?${queryString}` : ''}`,
      {}, 
      true
    );
  }

  async getBranchIssuesTrend(
    workspaceSlug: string,
    namespace: string,
    branch: string,
    limit?: number,
    timeframeDays?: number
  ): Promise<BranchIssuesTrendPoint[]> {
    const params = new URLSearchParams();
    params.append('branch', branch);
    if (limit !== undefined) {
      params.append('limit', limit.toString());
    }
    if (timeframeDays !== undefined) {
      params.append('timeframeDays', timeframeDays.toString());
    }
    return this.request<BranchIssuesTrendPoint[]>(
      `/${workspaceSlug}/projects/${namespace}/analysis/trends/issues?${params.toString()}`,
      {}, 
      true
    );
  }

  async getPullRequestsByBranch(workspaceSlug: string, namespace: string): Promise<PullRequestsByBranchResponse> {
    return this.request<PullRequestsByBranchResponse>(`/${workspaceSlug}/project/${namespace}/pull-requests/by-branch`, {}, true);
  }

  async getBranchIssues(
    workspaceSlug: string, 
    namespace: string, 
    branchName: string, 
    status: string = 'open',
    page: number = 1,
    pageSize: number = 50,
    excludeDiff: boolean = true,
    filters?: {
      severity?: string;
      category?: string;
      filePath?: string;
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<{ issues: AnalysisIssue[]; total: number; page: number; pageSize: number }> {
    const params = new URLSearchParams({ 
      status,
      page: page.toString(),
      pageSize: pageSize.toString(),
      excludeDiff: excludeDiff.toString()
    });
    
    // Add optional filter params
    if (filters?.severity && filters.severity !== 'ALL') {
      params.append('severity', filters.severity);
    }
    if (filters?.category && filters.category !== 'ALL') {
      params.append('category', filters.category);
    }
    if (filters?.filePath) {
      params.append('filePath', filters.filePath);
    }
    if (filters?.dateFrom) {
      params.append('dateFrom', filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      params.append('dateTo', filters.dateTo.toISOString());
    }
    
    const response = await this.request<AnalysisIssue[] | { issues: AnalysisIssue[]; total: number; page: number; pageSize: number }>(
      `/${workspaceSlug}/project/${namespace}/pull-requests/branches/${encodeURIComponent(branchName)}/issues?${params.toString()}`, 
      {}, 
      true
    );
    
    // Handle backward compatibility - if API returns array, wrap it in paginated response
    if (Array.isArray(response)) {
      return {
        issues: response,
        total: response.length,
        page: 1,
        pageSize: response.length
      };
    }
    
    return response;
  }
}

export const analysisService = new AnalysisService();
