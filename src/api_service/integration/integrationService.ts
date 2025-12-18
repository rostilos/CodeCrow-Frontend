import { ApiService } from '@/api_service/api';
import {
  VcsProvider,
  VcsConnection,
  VcsConnectionType,
  VcsRepositoryList,
  VcsRepository,
  InstallUrlResponse,
  RepoOnboardRequest,
  RepoOnboardResponse,
} from './integration.interface';

/**
 * Service for VCS provider integrations.
 * Provides methods for app installation, connection management, and repository onboarding.
 */
class IntegrationService extends ApiService {
  
  /**
   * Get the installation URL for a VCS provider app.
   */
  async getInstallUrl(workspaceSlug: string, provider: VcsProvider): Promise<InstallUrlResponse> {
    return this.request<InstallUrlResponse>(
      `/${workspaceSlug}/integrations/${provider}/app/install-url`,
      { method: 'GET' }
    );
  }
  
  /**
   * Get VCS connections for a workspace and provider, optionally filtered by connection type.
   */
  async getConnections(
    workspaceSlug: string, 
    provider: VcsProvider, 
    connectionType?: VcsConnectionType
  ): Promise<VcsConnection[]> {
    let url = `/${workspaceSlug}/integrations/${provider}/connections`;
    if (connectionType) {
      url += `?connectionType=${connectionType}`;
    }
    return this.request<VcsConnection[]>(url, { method: 'GET' });
  }
  
  /**
   * Get only APP-based connections for a workspace and provider.
   */
  async getAppConnections(workspaceSlug: string, provider: VcsProvider): Promise<VcsConnection[]> {
    return this.getConnections(workspaceSlug, provider, 'APP');
  }
  
  /**
   * Get all VCS connections for a workspace (all providers).
   */
  async getAllConnections(workspaceSlug: string): Promise<VcsConnection[]> {
    // Get connections for all supported providers
    const providers: VcsProvider[] = ['bitbucket-cloud', 'github'];
    const connectionPromises = providers.map(p => 
      this.getConnections(workspaceSlug, p).catch(() => [])
    );
    const results = await Promise.all(connectionPromises);
    return results.flat();
  }
  
  /**
   * Get a specific VCS connection.
   */
  async getConnection(workspaceSlug: string, provider: VcsProvider, connectionId: number): Promise<VcsConnection> {
    return this.request<VcsConnection>(
      `/${workspaceSlug}/integrations/${provider}/connections/${connectionId}`,
      { method: 'GET' }
    );
  }
  
  /**
   * Delete a VCS connection.
   */
  async deleteConnection(workspaceSlug: string, provider: VcsProvider, connectionId: number): Promise<void> {
    await this.request<void>(
      `/${workspaceSlug}/integrations/${provider}/connections/${connectionId}`,
      { method: 'DELETE' }
    );
  }
  
  /**
   * Sync a VCS connection (refresh status and repo count).
   */
  async syncConnection(workspaceSlug: string, provider: VcsProvider, connectionId: number): Promise<VcsConnection> {
    return this.request<VcsConnection>(
      `/${workspaceSlug}/integrations/${provider}/connections/${connectionId}/sync`,
      { method: 'POST' }
    );
  }
  
  /**
   * List repositories from a VCS connection.
   */
  async listRepositories(
    workspaceSlug: string,
    provider: VcsProvider,
    connectionId: number,
    page: number = 1,
    query?: string
  ): Promise<VcsRepositoryList> {
    let url = `/${workspaceSlug}/integrations/${provider}/repos?vcsConnectionId=${connectionId}&page=${page}`;
    if (query && query.trim()) {
      url += `&q=${encodeURIComponent(query.trim())}`;
    }
    return this.request<VcsRepositoryList>(url, { method: 'GET' });
  }
  
  /**
   * Get a specific repository from a VCS connection.
   */
  async getRepository(
    workspaceSlug: string,
    provider: VcsProvider,
    connectionId: number,
    externalRepoId: string
  ): Promise<VcsRepository> {
    return this.request<VcsRepository>(
      `/${workspaceSlug}/integrations/${provider}/repos/${encodeURIComponent(externalRepoId)}?vcsConnectionId=${connectionId}`,
      { method: 'GET' }
    );
  }
  
  /**
   * Onboard a repository (create project + binding + webhooks).
   */
  async onboardRepository(
    workspaceSlug: string,
    provider: VcsProvider,
    externalRepoId: string,
    request: RepoOnboardRequest
  ): Promise<RepoOnboardResponse> {
    return this.request<RepoOnboardResponse>(
      `/${workspaceSlug}/integrations/${provider}/repos/${encodeURIComponent(externalRepoId)}/onboard`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }
  
  /**
   * Batch onboard multiple repositories.
   */
  async onboardRepositories(
    workspaceSlug: string,
    provider: VcsProvider,
    repositories: { externalRepoId: string; request: RepoOnboardRequest }[]
  ): Promise<RepoOnboardResponse[]> {
    const results: RepoOnboardResponse[] = [];
    
    for (const { externalRepoId, request } of repositories) {
      try {
        const result = await this.onboardRepository(workspaceSlug, provider, externalRepoId, request);
        results.push(result);
      } catch (error) {
        console.error(`Failed to onboard repository ${externalRepoId}:`, error);
        // Continue with other repositories
      }
    }
    
    return results;
  }
  
  /**
   * Start the app installation flow.
   * Opens the VCS provider's OAuth authorization page.
   */
  async startAppInstall(workspaceSlug: string, provider: VcsProvider): Promise<void> {
    const { installUrl } = await this.getInstallUrl(workspaceSlug, provider);
    window.location.href = installUrl;
  }
}

export const integrationService = new IntegrationService();
