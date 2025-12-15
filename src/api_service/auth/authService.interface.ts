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
    refreshToken?: string;
    id: string;
    email: string;
    username?: string;
    avatarUrl?: string;
    roles?: string[];
}

export interface LoginResponse {
    accessToken?: string;
    refreshToken?: string;
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

export interface ForgotPasswordRequest {
    email: string;
}

export interface ForgotPasswordResponse {
    message: string;
}

export interface ValidateResetTokenRequest {
    token: string;
}

export interface ValidateResetTokenResponse {
    valid: boolean;
    twoFactorRequired: boolean;
    twoFactorType?: 'TOTP' | 'EMAIL';
    maskedEmail?: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
    twoFactorCode?: string;
}

export interface ResetPasswordResponse {
    message: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    roles?: string[];
}