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
}

export const projectService = new ProjectService();
