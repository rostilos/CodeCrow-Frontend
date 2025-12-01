export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    username?: string;
    company?: string;
}

export interface GoogleAuthRequest {
    credential: string;
}

export interface AuthResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        username?: string;
        avatarUrl?: string;
    };
}