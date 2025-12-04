import { API_CONFIG } from '@/config/api';
import { ApiService } from '@/api_service/api.ts';

export interface CreateProjectRequest {
  name: string;
  namespace: string;
  description?: string;
  creationMode: 'MANUAL' | 'IMPORT';
  vcsProvider?: 'BITBUCKET_CLOUD' | 'GITHUB';
  vcsConnectionId?: number;
  repositorySlug?: string;
  repositoryUUID?: string;
  importMode?: boolean;
}

export interface CreateProjectTokenRequest {
  name: string;
  lifetime: string;
}

export interface ProjectTokenDTO {
  id: number;
  name: string;
  createdAt: string;
  expiresAt: string;
}

export interface UpdateProjectRequest {
  name?: string;
  namespace?: string;
  description?: string;
}

export interface BindRepositoryRequest {
  provider: string;
  connectionId?: number;
  workspaceId?: string;
  repositorySlug?: string;
  repositoryId?: string;
  defaultBranch?: string;
  name?: string;
}

export interface ProjectDTO {
  id: number | string;
  name: string;
  description?: string;
  vcsConnectionId?: number;
  aiConnectionId?: number;
  projectVcsWorkspace?: string;
  projectRepoSlug?: string;
  namespace?: string;
  active?: boolean;
  createdAt?: string;
  defaultBranchId?: number;
  defaultBranchStats?: {
    branchName: string;
    totalIssues: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
    resolvedCount: number;
  };
  ragConfig?: RagConfigDTO;
  // other fields from ProjectDTO are allowed
  [key: string]: any;
}

export interface BranchDTO {
  id: number;
  branchName: string;
  commitHash: string | null;
  totalIssues: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  resolvedCount: number;
  updatedAt: string;
}

export interface SetDefaultBranchRequest {
  branchId?: number;
  branchName?: string;
}

export interface BranchAnalysisConfig {
  prTargetBranches: string[] | null;
  branchPushPatterns: string[] | null;
}

export interface UpdateBranchAnalysisConfigRequest {
  prTargetBranches: string[];
  branchPushPatterns: string[];
}

// RAG Configuration types
export interface RagConfigDTO {
  enabled: boolean;
  branch: string | null;
  excludePatterns: string[] | null;
}

export interface UpdateRagConfigRequest {
  enabled: boolean;
  branch?: string | null;
  excludePatterns?: string[] | null;
}

export interface RagIndexStatusDTO {
  projectId: number;
  status: 'NOT_INDEXED' | 'INDEXING' | 'INDEXED' | 'UPDATING' | 'FAILED';
  indexedBranch: string | null;
  indexedCommitHash: string | null;
  totalFilesIndexed: number | null;
  lastIndexedAt: string | null;
  errorMessage: string | null;
  collectionName: string | null;
}

export interface RagStatusResponse {
  isIndexed: boolean;
  indexStatus: RagIndexStatusDTO | null;
  canStartIndexing: boolean;
}

class ProjectService extends ApiService {
  async listProjects(workspaceSlug: string): Promise<ProjectDTO[]> {
    return this.request<ProjectDTO[]>(`/${workspaceSlug}/project/project_list`, {}, true);
  }

  async createProject(workspaceSlug: string, data: CreateProjectRequest): Promise<ProjectDTO> {
    return this.request<ProjectDTO>(`/${workspaceSlug}/project/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async updateProject(workspaceSlug: string, namespace: string, data: UpdateProjectRequest): Promise<ProjectDTO> {
    return this.request<ProjectDTO>(`/${workspaceSlug}/project/${namespace}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  }

  async deleteProject(workspaceSlug: string, namespace: string): Promise<void> {
    await this.request<void>(`/${workspaceSlug}/project/${namespace}`, { method: 'DELETE' }, true);
  }

  async bindRepository(workspaceSlug: string, namespace: string, data: BindRepositoryRequest): Promise<ProjectDTO> {
    return this.request<ProjectDTO>(`/${workspaceSlug}/project/${namespace}/repository/bind`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  async unbindRepository(workspaceSlug: string, namespace: string): Promise<ProjectDTO> {
    return this.request<ProjectDTO>(`/${workspaceSlug}/project/${namespace}/repository/unbind`, { method: 'DELETE' }, true);
  }

  async updateRepositorySettings(workspaceSlug: string, namespace: string, data: any): Promise<void> {
    await this.request<void>(`/${workspaceSlug}/project/${namespace}/repository/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, true);
  }

  async createProjectToken(workspaceSlug: string, namespace: string, data: CreateProjectTokenRequest): Promise<{ token: string }> {
    return this.request<{ token: string }>(`/${workspaceSlug}/project/${namespace}/token/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async listProjectTokens(workspaceSlug: string, namespace: string): Promise<ProjectTokenDTO[]> {
    return this.request<ProjectTokenDTO[]>(`/${workspaceSlug}/project/${namespace}/token`, {}, true);
  }

  async deleteProjectToken(workspaceSlug: string, namespace: string, tokenId: number): Promise<void> {
    await this.request<void>(`/${workspaceSlug}/project/${namespace}/token/${tokenId}`, {
      method: 'DELETE',
    }, true);
  }

  // Legacy method - deprecated
  async generateProjectToken(workspaceSlug: string, namespace: string): Promise<{ token: string }> {
    return this.createProjectToken(workspaceSlug, namespace, { name: 'Default Token', lifetime: '30d' });
  }

  async bindAiConnection(workspaceSlug: string, namespace: string, aiConnectionId: number): Promise<any> {
    return this.request<any>(`/${workspaceSlug}/project/${namespace}/ai/bind`, {
      method: 'PUT',
      body: JSON.stringify({ aiConnectionId }),
    }, true);
  }

  // helper that fetches list and returns a single project by namespace (frontend convenience)
  async getProjectByNamespace(workspaceSlug: string, namespace: string): Promise<ProjectDTO | null> {
    const projects = await this.listProjects(workspaceSlug);
    const found = projects.find(p => p.namespace === namespace);
    return found || null;
  }

  // Legacy helper - deprecated, use getProjectByNamespace
  async getProjectById(workspaceSlug: string, projectId: string | number): Promise<ProjectDTO | null> {
    const projects = await this.listProjects(workspaceSlug);
    const found = projects.find(p => String(p.id) === String(projectId));
    return found || null;
  }

  async getProjectBranches(workspaceSlug: string, namespace: string): Promise<BranchDTO[]> {
    return this.request<BranchDTO[]>(`/${workspaceSlug}/project/${namespace}/branches`, {}, true);
  }

  async setDefaultBranch(workspaceSlug: string, namespace: string, request: SetDefaultBranchRequest): Promise<ProjectDTO> {
    return this.request<ProjectDTO>(`/${workspaceSlug}/project/${namespace}/default-branch`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }, true);
  }

  async getBranchAnalysisConfig(workspaceSlug: string, namespace: string): Promise<BranchAnalysisConfig | null> {
    return this.request<BranchAnalysisConfig | null>(`/${workspaceSlug}/project/${namespace}/branch-analysis-config`, {}, true);
  }

  async updateBranchAnalysisConfig(workspaceSlug: string, namespace: string, request: UpdateBranchAnalysisConfigRequest): Promise<ProjectDTO> {
    return this.request<ProjectDTO>(`/${workspaceSlug}/project/${namespace}/branch-analysis-config`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }, true);
  }

  // RAG Configuration methods
  async getRagStatus(workspaceSlug: string, namespace: string): Promise<RagStatusResponse> {
    return this.request<RagStatusResponse>(`/${workspaceSlug}/project/${namespace}/rag/status`, {}, true);
  }

  async updateRagConfig(workspaceSlug: string, namespace: string, request: UpdateRagConfigRequest): Promise<ProjectDTO> {
    return this.request<ProjectDTO>(`/${workspaceSlug}/project/${namespace}/rag/config`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }, true);
  }

  /**
   * Trigger RAG indexing for a project with SSE progress streaming.
   * @param workspaceSlug - Workspace slug
   * @param namespace - Project namespace
   * @param branch - Optional branch to index
   * @param onProgress - Callback for progress events
   * @param onComplete - Callback when indexing completes
   * @param onError - Callback when an error occurs
   * @returns AbortController to cancel the operation
   */
  triggerRagIndexing(
    workspaceSlug: string,
    namespace: string,
    branch: string | null,
    onProgress: (data: RagIndexingProgressEvent) => void,
    onComplete: (data: RagIndexingResult) => void,
    onError: (error: string) => void
  ): AbortController {
    const abortController = new AbortController();
    const token = localStorage.getItem('codecrow_token');
    
    // Build URL without /api prefix since VITE_API_URL already includes it
    let url = `/${workspaceSlug}/project/${namespace}/rag/trigger`;
    if (branch) {
      url += `?branch=${encodeURIComponent(branch)}`;
    }

    // Use native EventSource with workaround for auth header
    // Since EventSource doesn't support headers, we use fetch with SSE parsing
    this.fetchSSE(url, token, abortController.signal, onProgress, onComplete, onError);

    return abortController;
  }

  private async fetchSSE(
    url: string,
    token: string | null,
    signal: AbortSignal,
    onProgress: (data: RagIndexingProgressEvent) => void,
    onComplete: (data: RagIndexingResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      // Get base URL from config (already includes /api)
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';
      const fullUrl = `${baseUrl}${url}`;

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Content-Type': 'application/json',
        },
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        onError(`Failed to start indexing: ${response.status} ${errorText}`);
        return;
      }

      if (!response.body) {
        onError('No response body');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '__EOF__') {
              // Stream complete
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'error' || parsed.status === 'error') {
                onError(parsed.message || 'Unknown error');
              } else if (parsed.status === 'completed' || parsed.status === 'skipped' || parsed.status === 'locked') {
                onComplete(parsed as RagIndexingResult);
              } else {
                onProgress(parsed as RagIndexingProgressEvent);
              }
            } catch (e) {
              console.warn('Failed to parse SSE event:', data, e);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Cancelled by user
        onError('Indexing cancelled');
      } else {
        onError(error.message || 'Connection error');
      }
    }
  }
}

// RAG Indexing event types
export interface RagIndexingProgressEvent {
  type: 'progress';
  stage: string;
  message: string;
  progress?: number;
  total?: number;
}

export interface RagIndexingResult {
  status: 'completed' | 'error' | 'skipped' | 'locked';
  message: string;
  filesIndexed?: number;
  branch?: string;
  commitHash?: string;
}

export const projectService = new ProjectService();
