/**
 * VCS Integration types
 */

export type VcsProvider = 'bitbucket-cloud' | 'bitbucket-server' | 'github' | 'gitlab';

export type VcsConnectionType = 'OAUTH_MANUAL' | 'APP' | 'CONNECT_APP' | 'GITHUB_APP' | 'OAUTH_APP' | 'PERSONAL_TOKEN' | 'APPLICATION' | 'ACCESS_TOKEN' | 'WORKSPACE_TOKEN' | 'REPOSITORY_TOKEN';

export type VcsSetupStatus = 'PENDING' | 'CONNECTED' | 'ERROR' | 'DISABLED';

export interface VcsConnection {
  id: number;
  provider: VcsProvider;
  connectionType: VcsConnectionType;
  connectionName: string;
  status: VcsSetupStatus;
  externalWorkspaceId: string | null;
  externalWorkspaceSlug: string | null;
  repoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VcsRepository {
  id: string;
  slug: string;
  name: string;
  fullName: string;
  description: string | null;
  isPrivate: boolean;
  defaultBranch: string | null;
  cloneUrl: string | null;
  htmlUrl: string | null;
  namespace: string;
  avatarUrl: string | null;
  isOnboarded: boolean;
}

export interface VcsRepositoryList {
  items: VcsRepository[];
  page: number;
  pageSize: number;
  itemCount: number;
  totalCount: number | null;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface VcsRepoBinding {
  id: number;
  projectId: number;
  projectName: string;
  vcsConnectionId: number;
  provider: VcsProvider;
  externalRepoId: string;
  externalRepoSlug: string;
  externalNamespace: string;
  displayName: string;
  fullName: string;
  defaultBranch: string | null;
  webhooksConfigured: boolean;
  createdAt: string;
}

export interface InstallUrlResponse {
  installUrl: string;
  provider: VcsProvider;
  state: string;
}

export interface RepoOnboardRequest {
  vcsConnectionId: number;
  projectId?: number;
  projectName?: string;
  projectNamespace?: string;
  projectDescription?: string;
  aiConnectionId?: number;
  // Main branch - primary branch for RAG and analysis baseline
  mainBranch?: string;
  /** @deprecated Use mainBranch instead */
  defaultBranch?: string;
  prAnalysisEnabled?: boolean;
  branchAnalysisEnabled?: boolean;
  setupWebhooks?: boolean;
}

export interface RepoOnboardResponse {
  projectId: number;
  projectName: string;
  projectNamespace: string;
  binding: VcsRepoBinding;
  webhooksConfigured: boolean;
  message: string;
}

export interface ProviderInfo {
  id: VcsProvider;
  name: string;
  description: string;
  icon: string;
  isSupported: boolean;
  supportedConnectionTypes: VcsConnectionType[];
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'bitbucket-cloud',
    name: 'Bitbucket Cloud',
    description: 'Connect to repositories on bitbucket.org',
    icon: 'bitbucket',
    isSupported: true,
    supportedConnectionTypes: ['APP', 'OAUTH_MANUAL'],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Connect to repositories on github.com',
    icon: 'github',
    isSupported: false,
    supportedConnectionTypes: ['GITHUB_APP', 'OAUTH_APP'],
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Connect to repositories on gitlab.com or self-hosted GitLab',
    icon: 'gitlab',
    isSupported: false,
    supportedConnectionTypes: ['APPLICATION', 'PERSONAL_TOKEN'],
  },
  {
    id: 'bitbucket-server',
    name: 'Bitbucket Server / Data Center',
    description: 'Connect to self-hosted Bitbucket Server or Data Center',
    icon: 'bitbucket',
    isSupported: false,
    supportedConnectionTypes: ['ACCESS_TOKEN'],
  },
];
