// Job API service for managing background jobs and logs

import { ApiService } from '../api';

export interface Job {
  id: string;
  projectId: number;
  projectName: string;
  projectNamespace: string;
  workspaceId: number;
  workspaceName: string;
  triggeredByUserId?: number;
  triggeredByUsername?: string;
  jobType: JobType;
  status: JobStatus;
  triggerSource: JobTriggerSource;
  title: string;
  branchName?: string;
  prNumber?: number;
  commitHash?: string;
  codeAnalysisId?: number;
  errorMessage?: string;
  progress?: number;
  currentStep?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  logCount?: number;
}

export type JobType = 
  | 'PR_ANALYSIS'
  | 'BRANCH_ANALYSIS'
  | 'BRANCH_RECONCILIATION'
  | 'RAG_INITIAL_INDEX'
  | 'RAG_INCREMENTAL_INDEX'
  | 'MANUAL_ANALYSIS'
  | 'REPO_SYNC';

export type JobStatus = 
  | 'PENDING'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'WAITING';

export type JobTriggerSource = 
  | 'WEBHOOK'
  | 'PIPELINE'
  | 'API'
  | 'UI'
  | 'SCHEDULED'
  | 'CHAINED';

export type JobLogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface JobLog {
  id: string;
  sequenceNumber: number;
  level: JobLogLevel;
  step?: string;
  message: string;
  metadata?: string;
  durationMs?: number;
  timestamp: string;
}

export interface JobListResponse {
  jobs: Job[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface JobLogsResponse {
  jobId: string;
  logs: JobLog[];
  latestSequence: number;
  isComplete: boolean;
}

export interface JobFilters {
  status?: JobStatus;
  type?: JobType;
  page?: number;
  size?: number;
}

class JobApiService extends ApiService {

  /**
   * List jobs for a workspace.
   */
  async listWorkspaceJobs(workspaceSlug: string, filters: JobFilters = {}): Promise<JobListResponse> {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.type) params.set('type', filters.type);
    if (filters.page !== undefined) params.set('page', filters.page.toString());
    if (filters.size !== undefined) params.set('size', filters.size.toString());
    
    const queryString = params.toString();
    const url = `/${workspaceSlug}/jobs${queryString ? `?${queryString}` : ''}`;
    return this.request<JobListResponse>(url, {}, true);
  }

  /**
   * List jobs for a project.
   */
  async listProjectJobs(
    workspaceSlug: string, 
    projectNamespace: string, 
    filters: JobFilters = {}
  ): Promise<JobListResponse> {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.type) params.set('type', filters.type);
    if (filters.page !== undefined) params.set('page', filters.page.toString());
    if (filters.size !== undefined) params.set('size', filters.size.toString());
    
    const queryString = params.toString();
    const url = `/${workspaceSlug}/projects/${projectNamespace}/jobs${queryString ? `?${queryString}` : ''}`;
    return this.request<JobListResponse>(url, {}, true);
  }

  /**
   * Get active jobs for a project.
   */
  async getActiveJobs(workspaceSlug: string, projectNamespace: string): Promise<Job[]> {
    return this.request<Job[]>(`/${workspaceSlug}/projects/${projectNamespace}/jobs/active`, {}, true);
  }

  /**
   * Get job details.
   */
  async getJob(workspaceSlug: string, projectNamespace: string, jobId: string): Promise<Job> {
    return this.request<Job>(`/${workspaceSlug}/projects/${projectNamespace}/jobs/${jobId}`, {}, true);
  }

  /**
   * Get job logs.
   */
  async getJobLogs(
    workspaceSlug: string, 
    projectNamespace: string, 
    jobId: string,
    afterSequence?: number
  ): Promise<JobLogsResponse> {
    const params = afterSequence ? `?afterSequence=${afterSequence}` : '';
    return this.request<JobLogsResponse>(
      `/${workspaceSlug}/projects/${projectNamespace}/jobs/${jobId}/logs${params}`,
      {},
      true
    );
  }

  /**
   * Cancel a running job.
   */
  async cancelJob(workspaceSlug: string, projectNamespace: string, jobId: string): Promise<Job> {
    return this.request<Job>(
      `/${workspaceSlug}/projects/${projectNamespace}/jobs/${jobId}/cancel`,
      { method: 'POST' },
      true
    );
  }

  /**
   * Get job by external ID (public endpoint).
   */
  async getJobByExternalId(jobId: string): Promise<Job> {
    return this.request<Job>(`/jobs/${jobId}`, {}, true);
  }

  /**
   * Stream job logs via SSE.
   * Returns an EventSource that emits log events.
   */
  streamJobLogs(
    workspaceSlug: string, 
    projectNamespace: string, 
    jobId: string,
    afterSequence: number = 0,
    onLog: (log: JobLog) => void,
    onComplete: (status: string, message: string) => void,
    onError: (error: Event) => void
  ): EventSource {
    const token = localStorage.getItem('codecrow_token');
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const url = `${baseUrl}/api/${workspaceSlug}/projects/${projectNamespace}/jobs/${jobId}/logs/stream?afterSequence=${afterSequence}`;
    
    const eventSource = new EventSource(url, { 
      // Note: EventSource doesn't support custom headers natively
      // For auth, you might need to use a different approach or pass token in URL
    });

    eventSource.addEventListener('log', (event) => {
      try {
        const log = JSON.parse(event.data) as JobLog;
        onLog(log);
      } catch (e) {
        console.error('Failed to parse log event:', e);
      }
    });

    eventSource.addEventListener('complete', (event) => {
      try {
        const data = JSON.parse(event.data);
        onComplete(data.status, data.message);
        eventSource.close();
      } catch (e) {
        console.error('Failed to parse complete event:', e);
      }
    });

    eventSource.onerror = (error) => {
      onError(error);
      eventSource.close();
    };

    return eventSource;
  }

  /**
   * Stream job logs by external ID (public endpoint).
   */
  streamJobLogsByExternalId(
    jobId: string,
    afterSequence: number = 0,
    onLog: (log: JobLog) => void,
    onComplete: (status: string, message: string) => void,
    onError: (error: Event) => void
  ): EventSource {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const url = `${baseUrl}/api/jobs/${jobId}/logs/stream?afterSequence=${afterSequence}`;
    
    const eventSource = new EventSource(url);

    eventSource.addEventListener('log', (event) => {
      try {
        const log = JSON.parse(event.data) as JobLog;
        onLog(log);
      } catch (e) {
        console.error('Failed to parse log event:', e);
      }
    });

    eventSource.addEventListener('complete', (event) => {
      try {
        const data = JSON.parse(event.data);
        onComplete(data.status, data.message);
        eventSource.close();
      } catch (e) {
        console.error('Failed to parse complete event:', e);
      }
    });

    eventSource.onerror = (error) => {
      onError(error);
      eventSource.close();
    };

    return eventSource;
  }
}

export const jobApi = new JobApiService();
