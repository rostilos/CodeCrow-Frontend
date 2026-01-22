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
  avatarUrl?: string;
  role: string;
  joinedAt: string;
}

export interface InviteRequest {
  username: string;
  role: string;
}

export interface UserRole {
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'REVIEWER';
}

export interface ChangeRoleRequest {
  username: string;
  newRole: 'ADMIN' | 'MEMBER' | 'REVIEWER';
}

export interface RemoveMemberRequest {
  username: string;
}

export interface InitiateOwnershipTransferRequest {
  targetUserId: number;
  twoFactorCode: string;
}

export interface CancelOwnershipTransferRequest {
  reason?: string;
}

export interface DeleteWorkspaceRequest {
  confirmationSlug: string;
  twoFactorCode: string;
}

export interface DeletionStatusDTO {
  isScheduledForDeletion: boolean;
  scheduledDeletionAt: string | null;
  deletionRequestedAt: string | null;
  deletionRequestedBy: number | null;
}

export interface OwnershipTransferDTO {
  id: string;
  workspaceId: number;
  workspaceSlug: string;
  workspaceName: string;
  fromUserId: number;
  fromUsername: string;
  toUserId: number;
  toUsername: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  initiatedAt: string;
  expiresAt: string;
  completedAt?: string;
  canBeCancelled: boolean;
  canBeCompleted: boolean;
  isExpired: boolean;
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

  // Ownership Transfer APIs

  async initiateOwnershipTransfer(
    workspaceSlug: string, 
    data: InitiateOwnershipTransferRequest
  ): Promise<OwnershipTransferDTO> {
    return this.request<OwnershipTransferDTO>(`/workspace/${workspaceSlug}/ownership/transfer`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async cancelOwnershipTransfer(
    workspaceSlug: string, 
    transferId: string, 
    data?: CancelOwnershipTransferRequest
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/workspace/${workspaceSlug}/ownership/transfer/${transferId}`, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    }, true);
  }

  async completeOwnershipTransfer(
    workspaceSlug: string, 
    transferId: string
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/workspace/${workspaceSlug}/ownership/transfer/${transferId}/complete`, {
      method: 'POST',
    }, true);
  }

  async getPendingOwnershipTransfer(workspaceSlug: string): Promise<OwnershipTransferDTO | null> {
    try {
      const result = await this.request<OwnershipTransferDTO>(`/workspace/${workspaceSlug}/ownership/transfer/pending`, {}, true);
      // Handle 204 No Content - returns empty object {}
      if (!result || !result.id) {
        return null;
      }
      return result;
    } catch {
      return null;
    }
  }

  async getOwnershipTransferHistory(workspaceSlug: string): Promise<OwnershipTransferDTO[]> {
    return this.request<OwnershipTransferDTO[]>(`/workspace/${workspaceSlug}/ownership/transfer/history`, {}, true);
  }

  async scheduleWorkspaceDeletion(workspaceSlug: string, data: DeleteWorkspaceRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/workspace/${workspaceSlug}`, {
      method: 'DELETE',
      body: JSON.stringify(data),
    }, true);
  }

  async cancelWorkspaceDeletion(workspaceSlug: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/workspace/${workspaceSlug}/cancel-deletion`, {
      method: 'POST',
    }, true);
  }

  async getDeletionStatus(workspaceSlug: string): Promise<DeletionStatusDTO> {
    return this.request<DeletionStatusDTO>(`/workspace/${workspaceSlug}/deletion-status`, {}, true);
  }
}

export const workspaceService = new WorkspaceService();