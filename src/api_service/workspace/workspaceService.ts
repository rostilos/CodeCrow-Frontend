import { API_CONFIG } from '@/config/api';
import { ApiService } from '@/api_service/api.ts';

export interface CreateWorkspaceRequest {
  slug: string;
  name: string;
  description?: string;
}

export interface WorkspaceDTO {
  id: number;
  slug: string;
  name: string;
  description?: string;
  createdAt?: string;
  membersCount?: number;
  members?: WorkspaceMemberDTO[];
}

export interface WorkspaceMemberDTO {
  id: number;
  username: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface InviteRequest {
  username: string;
  role: string;
}

export interface UserRole {
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export interface ChangeRoleRequest {
  username: string;
  newRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export interface RemoveMemberRequest {
  username: string;
}

class WorkspaceService extends ApiService {
  async createWorkspace(data: CreateWorkspaceRequest): Promise<WorkspaceDTO> {
    return this.request<WorkspaceDTO>('/workspace/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async getUserWorkspaces(): Promise<WorkspaceDTO[]> {
    return this.request<WorkspaceDTO[]>('/workspace/list', {}, true);
  }

  async getWorkspaceMembers(workspaceSlug: string): Promise<WorkspaceMemberDTO[]> {
    return this.request<WorkspaceMemberDTO[]>(`/workspace/${workspaceSlug}/members`, {}, true);
  }

  async inviteToWorkspace(workspaceSlug: string, data: InviteRequest): Promise<void> {
    await this.request<void>(`/workspace/${workspaceSlug}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async acceptInvite(workspaceSlug: string): Promise<void> {
    await this.request<void>(`/workspace/${workspaceSlug}/invite/accept`, {
      method: 'POST',
    }, true);
  }

  async getUserRole(workspaceSlug: string): Promise<UserRole> {
    return this.request<UserRole>(`/workspace/${workspaceSlug}/role`, {}, true);
  }

  async changeRole(workspaceSlug: string, data: ChangeRoleRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/workspace/${workspaceSlug}/changeRole`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  async removeMember(workspaceSlug: string, data: RemoveMemberRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/workspace/${workspaceSlug}/member/remove`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    }, true);
  }
}

export const workspaceService = new WorkspaceService();