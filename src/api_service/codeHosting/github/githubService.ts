import { ApiService } from '@/api_service/api';
import {
    GitHubConnection,
    GitHubConnectionCreateRequest,
    GitHubConnections
} from '@/api_service/codeHosting/github/githubService.interface';


class GitHubService extends ApiService {
    async getUserConnections(workspaceSlug: string): Promise<GitHubConnections> {
        return this.request<GitHubConnections>(`/${workspaceSlug}/vcs/github/list`, {});
    }

    async createUserConnection(workspaceSlug: string, connectionData: GitHubConnectionCreateRequest): Promise<GitHubConnection> {
        return this.request<GitHubConnection>(`/${workspaceSlug}/vcs/github/create`, {
            method: 'POST',
            body: JSON.stringify(connectionData),
        });
    }

    async getConnection(workspaceSlug: string, connectionId: number): Promise<GitHubConnection> {
        return this.request<GitHubConnection>(`/${workspaceSlug}/vcs/github/connections/${connectionId}`, {});
    }

    async updateConnection(workspaceSlug: string, connectionId: number, data: Partial<GitHubConnectionCreateRequest>): Promise<GitHubConnection> {
        return this.request<GitHubConnection>(`/${workspaceSlug}/vcs/github/connections/${connectionId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteConnection(workspaceSlug: string, connectionId: number): Promise<void> {
        await this.request<void>(`/${workspaceSlug}/vcs/github/connections/${connectionId}`, { method: 'DELETE' });
    }

    /**
     * Sync a GitHub connection (refresh status and repo count).
     * Uses the unified integration endpoint.
     */
    async syncConnection(workspaceSlug: string, connectionId: number): Promise<GitHubConnection> {
        return this.request<GitHubConnection>(`/${workspaceSlug}/integrations/github/connections/${connectionId}/sync`, {
            method: 'POST',
        });
    }

    async getRepositories(workspaceSlug: string, connectionId: number, page: number = 1, search?: string): Promise<{ items: any[]; hasNext: boolean }> {
        let fullUrl = `/${workspaceSlug}/vcs/github/${connectionId}/repositories?page=${page}`;
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
     * Get the GitHub App install URL to initiate the installation flow.
     * This installs the GitHub App on the user's account or organization.
     */
    async getInstallUrl(workspaceSlug: string): Promise<{ installUrl: string }> {
        return this.request<{ installUrl: string }>(`/${workspaceSlug}/integrations/github/app/install-url`, {});
    }

    /**
     * Start the GitHub App installation flow by redirecting to GitHub.
     */
    async startOAuthFlow(workspaceSlug: string): Promise<void> {
        const { installUrl } = await this.getInstallUrl(workspaceSlug);
        window.location.href = installUrl;
    }
}

export const githubService = new GitHubService();
