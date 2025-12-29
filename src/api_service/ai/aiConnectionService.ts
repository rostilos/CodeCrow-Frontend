import { API_CONFIG } from '@/config/api';
import { ApiService } from '@/api_service/api.ts';

export type AIProviderKey = 'OPENAI' | 'OPENROUTER' | 'ANTHROPIC' | 'GOOGLE';

export interface CreateAIConnectionRequest {
  name?: string;
  providerKey: AIProviderKey;
  aiModel: string;
  apiKey: string;
  tokenLimitation: string;
}

export interface UpdateAiConnectionRequest {
  name?: string;
  providerKey?: AIProviderKey;
  aiModel?: string;
  apiKey?: string;
  tokenLimitation?: string;
}

export interface AIConnectionDTO {
  id: number;
  name: string | null;
  providerKey: AIProviderKey;
  aiModel: string;
  createdAt: string;
  updatedAt: string;
  tokenLimitation: number;
}

export interface BindAiConnectionRequest {
  aiConnectionId: number;
}

class AIConnectionService extends ApiService {
  async createConnection(workspaceSlug: string, data: CreateAIConnectionRequest): Promise<AIConnectionDTO> {
    return this.request<AIConnectionDTO>(`/${workspaceSlug}/ai/create`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listWorkspaceConnections(workspaceSlug: string): Promise<AIConnectionDTO[]> {
    return this.request<AIConnectionDTO[]>(`/${workspaceSlug}/ai/list`, {});
  }

  async updateConnection(workspaceSlug: string, connectionId: number, data: UpdateAiConnectionRequest): Promise<AIConnectionDTO> {
    return this.request<AIConnectionDTO>(`/${workspaceSlug}/ai/${connectionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteConnection(workspaceSlug: string, connectionId: number): Promise<void> {
    await this.request<void>(`/${workspaceSlug}/ai/connections/${connectionId}`, {
      method: 'DELETE',
    });
  }
}

export const aiConnectionService = new AIConnectionService();