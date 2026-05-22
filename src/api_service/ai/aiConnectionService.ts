import { API_CONFIG } from "@/config/api";
import { ApiService } from "@/api_service/api.ts";

export type AIProviderKey =
  | "OPENAI"
  | "OPENROUTER"
  | "ANTHROPIC"
  | "GOOGLE"
  | "OPENAI_COMPATIBLE";

export interface CreateAIConnectionRequest {
  name?: string;
  providerKey: AIProviderKey;
  aiModel: string;
  apiKey: string;
  baseUrl?: string;
}

export interface UpdateAiConnectionRequest {
  name?: string;
  providerKey?: AIProviderKey;
  aiModel?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface AIConnectionDTO {
  id: number;
  name: string | null;
  providerKey: AIProviderKey;
  aiModel: string;
  baseUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIConnectionTestResponse {
  success: boolean;
  message: string;
  statusCode: number;
  latencyMs: number;
}

export interface BindAiConnectionRequest {
  aiConnectionId: number;
}

class AIConnectionService extends ApiService {
  async createConnection(
    workspaceSlug: string,
    data: CreateAIConnectionRequest,
  ): Promise<AIConnectionDTO> {
    return this.request<AIConnectionDTO>(`/${workspaceSlug}/ai/create`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listWorkspaceConnections(
    workspaceSlug: string,
  ): Promise<AIConnectionDTO[]> {
    return this.request<AIConnectionDTO[]>(`/${workspaceSlug}/ai/list`, {});
  }

  async updateConnection(
    workspaceSlug: string,
    connectionId: number,
    data: UpdateAiConnectionRequest,
  ): Promise<AIConnectionDTO> {
    return this.request<AIConnectionDTO>(
      `/${workspaceSlug}/ai/${connectionId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  }

  async deleteConnection(
    workspaceSlug: string,
    connectionId: number,
  ): Promise<void> {
    await this.request<void>(
      `/${workspaceSlug}/ai/connections/${connectionId}`,
      {
        method: "DELETE",
      },
    );
  }

  async testConnection(
    workspaceSlug: string,
    connectionId: number,
  ): Promise<AIConnectionTestResponse> {
    return this.request<AIConnectionTestResponse>(
      `/${workspaceSlug}/ai/connections/${connectionId}/test`,
      {
        method: "POST",
      },
    );
  }
}

export const aiConnectionService = new AIConnectionService();
