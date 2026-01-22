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
 * Normalize provider string from backend format (BITBUCKET_CLOUD) to frontend format (bitbucket-cloud)
 */
function normalizeProvider(provider: string): VcsProvider {
  const mapping: Record<string, VcsProvider> = {
    'BITBUCKET_CLOUD': 'bitbucket-cloud',
    'BITBUCKET_SERVER': 'bitbucket-server',
    'GITHUB': 'github',
    'GITLAB': 'gitlab',
    // Also handle already-normalized values
    'bitbucket-cloud': 'bitbucket-cloud',
    'bitbucket-server': 'bitbucket-server',
    'github': 'github',
    'gitlab': 'gitlab',
  };
  return mapping[provider] || (provider.toLowerCase().replace('_', '-') as VcsProvider);
}

/**
 * Normalize a VcsConnection object from backend format
 */
function normalizeConnection(conn: any): VcsConnection {
  return {
    ...conn,
    provider: normalizeProvider(conn.provider),
  };
}

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
    const connections = await this.request<VcsConnection[]>(url, { method: 'GET' });
    // Normalize provider format from backend (BITBUCKET_CLOUD) to frontend (bitbucket-cloud)
    return connections.map(normalizeConnection);
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
    const providers: VcsProvider[] = ['bitbucket-cloud', 'github', 'gitlab'];
    const connectionPromises = providers.map(p => 
      this.getConnections(workspaceSlug, p).catch((err) => {
        console.warn(`Failed to load ${p} connections:`, err);
        return [];
      })
    );
    const results = await Promise.all(connectionPromises);
    return results.flat();
  }
  
  /**
   * Get a specific VCS connection.
   */
  async getConnection(workspaceSlug: string, provider: VcsProvider, connectionId: number): Promise<VcsConnection> {
    const connection = await this.request<VcsConnection>(
      `/${workspaceSlug}/integrations/${provider}/connections/${connectionId}`,
      { method: 'GET' }
    );
    return normalizeConnection(connection);
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
    const connection = await this.request<VcsConnection>(
      `/${workspaceSlug}/integrations/${provider}/connections/${connectionId}/sync`,
      { method: 'POST' }
    );
    return normalizeConnection(connection);
  }
  
  /**
   * Get the reconnect URL for an existing VCS connection.
   * Used to re-authorize connections with expired or invalid tokens.
   */
  async getReconnectUrl(workspaceSlug: string, provider: VcsProvider, connectionId: number): Promise<InstallUrlResponse> {
    return this.request<InstallUrlResponse>(
      `/${workspaceSlug}/integrations/${provider}/connections/${connectionId}/reconnect-url`,
      { method: 'GET' }
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
   * List branches in a repository.
   * @param search Optional search query to filter branch names
   * @param limit Optional maximum number of results (default: 100)
   */
  async listBranches(
    workspaceSlug: string,
    provider: VcsProvider,
    connectionId: number,
    externalRepoId: string,
    search?: string,
    limit?: number
  ): Promise<string[]> {
    const params = new URLSearchParams();
    params.set('vcsConnectionId', String(connectionId));
    if (search) {
      params.set('search', search);
    }
    if (limit !== undefined) {
      params.set('limit', String(limit));
    }
    return this.request<string[]>(
      `/${workspaceSlug}/integrations/${provider}/repos/${encodeURIComponent(externalRepoId)}/branches?${params.toString()}`,
      { method: 'GET' }
    );
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
  
  // ==================== Bitbucket Connect App Methods ====================
  
  /**
   * Start Connect App installation flow.
   * Returns the Bitbucket authorization URL to redirect the user to.
   */
  async startConnectAppInstall(workspaceId: number, workspaceSlug?: string): Promise<ConnectInstallStartResponse> {
    const params = new URLSearchParams({ workspaceId: workspaceId.toString() });
    if (workspaceSlug) {
      params.append('workspaceSlug', workspaceSlug);
    }
    return this.request<ConnectInstallStartResponse>(
      `/bitbucket/connect/install/start?${params.toString()}`,
      { method: 'POST' }
    );
  }

  /**
   * Get Bitbucket Connect App status.
   */
  async getBitbucketConnectStatus(): Promise<{ configured: boolean }> {
    return this.request<{ configured: boolean }>(
      '/bitbucket/connect/status',
      { method: 'GET' }
    );
  }
  
  /**
   * Get unlinked Bitbucket Connect App installations.
   */
  async getUnlinkedConnectInstallations(): Promise<BitbucketConnectInstallation[]> {
    return this.request<BitbucketConnectInstallation[]>(
      '/bitbucket/connect/installations/unlinked',
      { method: 'GET' }
    );
  }
  
  /**
   * Get Bitbucket Connect App installations for a workspace.
   */
  async getConnectInstallationsForWorkspace(workspaceId: number): Promise<BitbucketConnectInstallation[]> {
    return this.request<BitbucketConnectInstallation[]>(
      `/bitbucket/connect/installations/workspace/${workspaceId}`,
      { method: 'GET' }
    );
  }
  
  /**
   * Link a Bitbucket Connect App installation to a CodeCrow workspace.
   */
  async linkConnectInstallation(installationId: number, workspaceId: number): Promise<VcsConnection> {
    return this.request<VcsConnection>(
      `/bitbucket/connect/installations/${installationId}/link?workspaceId=${workspaceId}`,
      { method: 'POST' }
    );
  }
  
  /**
   * Check the status of a pending Connect App installation.
   * @deprecated - No longer needed with Forge app flow
   */
  async checkConnectInstallStatus(state: string): Promise<ConnectInstallStatusResponse> {
    return this.request<ConnectInstallStatusResponse>(
      `/bitbucket/connect/install/status?state=${encodeURIComponent(state)}`,
      { method: 'GET' }
    );
  }
  
  /**
   * Start and track the full 1-click Bitbucket Connect App installation.
   * Opens a popup for Bitbucket authorization.
   * Uses the Connect App endpoint that generates the Bitbucket addon authorization URL.
   */
  async startBitbucketConnectInstallWithTracking(
    workspaceId: number,
    workspaceSlug: string,
    onStatusChange?: (status: string) => void
  ): Promise<ConnectInstallStatusResponse> {
    // Start the Connect App install flow
    const { installUrl, state } = await this.startConnectAppInstall(workspaceId, workspaceSlug);
    
    // Open popup
    const popup = window.open(installUrl, 'bitbucket_connect_install', 'width=800,height=700');
    
    onStatusChange?.('waiting');
    
    // Wait for popup to close or check status
    return new Promise((resolve) => {
      const checkPopupClosed = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(checkPopupClosed);
          onStatusChange?.('checking');
          
          // Give Bitbucket a moment to call our /installed endpoint
          await new Promise(r => setTimeout(r, 2000));
          
          // Check install status using state
          try {
            const statusResult = await this.checkConnectInstallStatus(state);
            if (statusResult.status === 'completed') {
              onStatusChange?.('completed');
              resolve(statusResult);
              return;
            }
          } catch {
            // Ignore status check errors
          }
          
          // Check for unlinked installations as fallback
          try {
            const unlinked = await this.getUnlinkedConnectInstallations();
            if (unlinked.length > 0) {
              onStatusChange?.('installed');
              resolve({
                status: 'installed_pending_link',
                installationId: unlinked[0].id,
                workspaceSlug: unlinked[0].bitbucketWorkspaceSlug
              });
            } else {
              onStatusChange?.('no_installation');
              resolve({ status: 'no_installation' });
            }
          } catch {
            onStatusChange?.('completed');
            resolve({ status: 'popup_closed' });
          }
        }
      }, 500);
      
      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkPopupClosed);
        popup?.close();
        onStatusChange?.('timeout');
        resolve({ status: 'timeout' });
      }, 300000);
    });
  }
}

/**
 * Response from starting Connect App installation.
 */
export interface ConnectInstallStartResponse {
  installUrl: string;
  state: string;
}

/**
 * Response from checking Connect App installation status.
 */
export interface ConnectInstallStatusResponse {
  status: 'pending' | 'completed' | 'expired' | 'not_found' | 'installed_pending_link' | 'no_installation' | 'popup_closed' | 'timeout';
  installationId?: number;
  connectionId?: number;
  workspaceSlug?: string;
}

/**
 * Bitbucket Connect App installation details.
 */
export interface BitbucketConnectInstallation {
  id: number;
  clientKey: string;
  bitbucketWorkspaceUuid: string;
  bitbucketWorkspaceSlug: string;
  bitbucketWorkspaceName: string;
  installedByUsername: string | null;
  installedAt: string;
  enabled: boolean;
  linkedWorkspaceId: number | null;
  hasVcsConnection: boolean;
}

export const integrationService = new IntegrationService();
