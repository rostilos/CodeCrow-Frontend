export enum EGitSetupStatus {
    CONNECTED = "CONNECTED",
    PENDING = "PENDING",
    ERROR = "ERROR",
    DISABLED = "DISABLED"
}

export type GitLabConnections = GitLabConnection[];

export interface GitLabConnection {
    id: number;
    connectionName: string;
    groupId: string;
    repoCount?: number;
    setupStatus?: EGitSetupStatus;
    hasAccessToken?: boolean;
    updatedAt?: string;
    connectionType?: 'PERSONAL_TOKEN' | 'REPOSITORY_TOKEN';
    repositoryPath?: string;
}

export interface GitLabConnectionCreateRequest {
    connectionName: string;
    groupId?: string;
    accessToken: string;
}

/**
 * Request to create a GitLab connection using a Project Access Token.
 * Project Access Tokens are scoped to a single repository.
 */
export interface GitLabRepositoryTokenRequest {
    /** The Project Access Token (starts with glpat-) */
    accessToken: string;
    /** Full repository path, e.g., "namespace/project-name" */
    repositoryPath: string;
    /** Optional custom name for the connection */
    connectionName?: string;
    /** GitLab instance URL for self-hosted (default: https://gitlab.com) */
    baseUrl?: string;
}
