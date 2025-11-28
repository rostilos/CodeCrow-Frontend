import { API_CONFIG } from '@/config/api';
import {ApiService} from "@/api_service/api.ts";
import {
    BitbucketConnection,
    BitbucketConnectionCreateRequest,
    BitbucketConnections
} from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.interface.ts";


class BitbucketCloudService extends ApiService{
    async getUserConnections(workspaceSlug: string): Promise<BitbucketConnections> {
        return this.request<BitbucketConnections>(`/${workspaceSlug}/vcs/bitbucket_cloud/list`, {});
    }

    async createUserConnection(workspaceSlug: string, connectionData: BitbucketConnectionCreateRequest): Promise<BitbucketConnection> {
        return this.request<BitbucketConnection>(`/${workspaceSlug}/vcs/bitbucket_cloud/create`, {
            method: 'POST',
            body: JSON.stringify(connectionData),
        });
    }

    async getConnection(workspaceSlug: string, connectionId: number): Promise<BitbucketConnection> {
        return this.request<BitbucketConnection>(`/${workspaceSlug}/vcs/bitbucket_cloud/connections/${connectionId}`, {});
    }

    async updateConnection(workspaceSlug: string, connectionId: number, data: Partial<BitbucketConnectionCreateRequest>): Promise<BitbucketConnection> {
        return this.request<BitbucketConnection>(`/${workspaceSlug}/vcs/bitbucket_cloud/connections/${connectionId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteConnection(workspaceSlug: string, connectionId: number): Promise<void> {
        await this.request<void>(`/${workspaceSlug}/vcs/bitbucket_cloud/connections/${connectionId}`, { method: 'DELETE' });
    }

    async getRepositories(workspaceSlug: string, connectionId: number, page: number = 1, search?: string): Promise<{ items: any[]; hasNext: boolean }> {
        let fullUrl = `/${workspaceSlug}/vcs/bitbucket_cloud/${connectionId}/repositories?page=${page}`;
        if (search && search.trim()) {
            fullUrl += `&q=${encodeURIComponent(search.trim())}`;
        }
        const res = await this.request<any>(fullUrl, {});
        // Normalize different possible shapes from the backend
        if (Array.isArray(res)) {
            return { items: res, hasNext: false };
        }
        return {
            items: res.items || res.repositories || res.repos || [],
            hasNext: !!res.hasNext
        };
    }
}

export const bitbucketCloudService = new BitbucketCloudService();
