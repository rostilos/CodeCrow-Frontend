import { ApiService } from '@/api_service/api';
import {
    GitLabConnection,
    GitLabConnectionCreateRequest,
    GitLabConnections,
    GitLabRepositoryTokenRequest
} from '@/api_service/codeHosting/gitlab/gitlabService.interface';


class GitLabService extends ApiService {
    async getUserConnections(workspaceSlug: string): Promise<GitLabConnections> {
        return this.request<GitLabConnections>(`/${workspaceSlug}/vcs/gitlab/list`, {});
    }

    async createUserConnection(workspaceSlug: string, connectionData: GitLabConnectionCreateRequest): Promise<GitLabConnection> {
        return this.request<GitLabConnection>(`/${workspaceSlug}/vcs/gitlab/create`, {
            method: 'POST',
            body: JSON.stringify(connectionData),
        });
    }

    async getConnection(workspaceSlug: string, connectionId: number): Promise<GitLabConnection> {
        return this.request<GitLabConnection>(`/${workspaceSlug}/vcs/gitlab/connections/${connectionId}`, {});
    }

    async updateConnection(workspaceSlug: string, connectionId: number, data: Partial<GitLabConnectionCreateRequest>): Promise<GitLabConnection> {
        return this.request<GitLabConnection>(`/${workspaceSlug}/vcs/gitlab/connections/${connectionId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteConnection(workspaceSlug: string, connectionId: number): Promise<void> {
        await this.request<void>(`/${workspaceSlug}/vcs/gitlab/connections/${connectionId}`, { method: 'DELETE' });
    }

    /**
     * Sync a GitLab connection (refresh status and repo count).
     * Uses the unified integration endpoint.
     */
    async syncConnection(workspaceSlug: string, connectionId: number): Promise<GitLabConnection> {
        return this.request<GitLabConnection>(`/${workspaceSlug}/integrations/gitlab/connections/${connectionId}/sync`, {
            method: 'POST',
        });
    }

    async getRepositories(workspaceSlug: string, connectionId: number, page: number = 1, search?: string): Promise<{ items: any[]; hasNext: boolean }> {
        let fullUrl = `/${workspaceSlug}/vcs/gitlab/${connectionId}/repositories?page=${page}`;
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

    /**
     * Get the GitLab OAuth install URL to initiate the OAuth flow.
     * This redirects to GitLab to authorize the application.
     * Supports both GitLab.com and self-hosted GitLab instances.
     */
    async getInstallUrl(workspaceSlug: string): Promise<{ installUrl: string }> {
        return this.request<{ installUrl: string }>(`/${workspaceSlug}/integrations/gitlab/app/install-url`, {});
    }

    /**
     * Start the GitLab OAuth flow by redirecting to GitLab.
     * After authorization, the user will be redirected back to the callback URL.
     */
    async startOAuthFlow(workspaceSlug: string): Promise<void> {
        const { installUrl } = await this.getInstallUrl(workspaceSlug);
        window.location.href = installUrl;
    }

    /**
     * Create a GitLab connection using a Project Access Token.
     * Project Access Tokens provide access to a single repository only.
     * 
     * @param workspaceSlug - The workspace slug
     * @param request - Repository token request with accessToken and repositoryPath
     * @returns The created GitLab connection
     */
    async createRepositoryTokenConnection(
        workspaceSlug: string, 
        request: GitLabRepositoryTokenRequest
    ): Promise<GitLabConnection> {
        return this.request<GitLabConnection>(`/${workspaceSlug}/vcs/gitlab/create-repository-token`, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }
}

export const gitlabService = new GitLabService();
