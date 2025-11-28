export enum EGitSetupStatus {
    CONNECTED = "CONNECTED",
    PENDING = "PENDING",
    ERROR = "ERROR" ,
    DISABLED = "DISABLED"
}

export type BitbucketConnections = BitbucketConnection[];

export interface BitbucketConnection {
    id: number;
    connectionName: string;
    workspaceId: string;
    repoCount?: number;
    setupStatus?: EGitSetupStatus;
    hasAuthKey?: boolean;
    hasAuthSecret?: boolean;
    updatedAt?: string;
}

export interface BitbucketConnectionCreateRequest {
    connectionName: string;
    workspaceId: string;
    oAuthKey: string;
    oAuthSecret: string;
}