export enum EGitSetupStatus {
    CONNECTED = "CONNECTED",
    PENDING = "PENDING",
    ERROR = "ERROR",
    DISABLED = "DISABLED"
}

export type GitHubConnections = GitHubConnection[];

export interface GitHubConnection {
    id: number;
    connectionName: string;
    organizationId: string;
    repoCount?: number;
    setupStatus?: EGitSetupStatus;
    hasAccessToken?: boolean;
    updatedAt?: string;
}

export interface GitHubConnectionCreateRequest {
    connectionName: string;
    organizationId?: string;
    accessToken: string;
}
