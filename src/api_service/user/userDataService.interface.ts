export interface SaveUserDataRequest {
    username?: string;
    email?: string;
    company?: string;
}

export interface SaveUserDataResponse {
    token?: string;
    username?: string;
    email?: string;
    company?: string;
    avatarUrl?: string;
}