import { ApiService } from '@/api_service/api.ts';
import { AIProviderKey } from './aiConnectionService';

export interface LlmModelDTO {
  id: number;
  providerKey: AIProviderKey;
  modelId: string;
  displayName: string;
  contextWindow: number | null;
  supportsTools: boolean;
  inputPricePerMillion: string | null;
  outputPricePerMillion: string | null;
  lastSyncedAt: string;
}

export interface LlmModelListResponse {
  models: LlmModelDTO[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface LlmModelStatusResponse {
  hasModels: boolean;
  providers: Record<AIProviderKey, boolean>;
  minContextWindow: number;
}

class LlmModelService extends ApiService {
  /**
   * Search LLM models with optional provider filter and search query.
   */
  async searchModels(params: {
    provider?: AIProviderKey;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<LlmModelListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.provider) {
      searchParams.append('provider', params.provider);
    }
    if (params.search) {
      searchParams.append('search', params.search);
    }
    if (params.page !== undefined) {
      searchParams.append('page', String(params.page));
    }
    if (params.size !== undefined) {
      searchParams.append('size', String(params.size));
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/llm-models?${queryString}` : '/llm-models';

    return this.request<LlmModelListResponse>(url, {});
  }

  /**
   * Get status of model availability for each provider.
   */
  async getStatus(): Promise<LlmModelStatusResponse> {
    return this.request<LlmModelStatusResponse>('/llm-models/status', {});
  }
}

export const llmModelService = new LlmModelService();
