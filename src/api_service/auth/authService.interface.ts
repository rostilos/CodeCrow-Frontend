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
    id: string;
    email: string;
    username?: string;
    avatarUrl?: string;
    roles?: string[];
}

export interface LoginResponse {
    accessToken?: string;
    id?: string;
    username?: string;
    email?: string;
    avatarUrl?: string;
    roles?: string[];
    requiresTwoFactor?: boolean;
    tempToken?: string;
    twoFactorType?: 'TOTP' | 'EMAIL';
    message?: string;
}