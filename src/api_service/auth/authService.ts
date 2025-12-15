import {API_CONFIG} from '@/config/api';
import {ApiService} from "@/api_service/api.ts";
import {
    AuthResponse,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    GoogleAuthRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ValidateResetTokenRequest,
    ValidateResetTokenResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    RefreshTokenRequest,
    RefreshTokenResponse
} from "@/api_service/auth/authService.interface.ts";


class AuthService extends ApiService {
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        return this.request<LoginResponse>(API_CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    async register(userData: RegisterRequest): Promise<AuthResponse> {
        return this.request<AuthResponse>(API_CONFIG.ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async googleAuth(data: GoogleAuthRequest): Promise<AuthResponse> {
        return this.request<AuthResponse>(API_CONFIG.ENDPOINTS.GOOGLE_AUTH, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
        return this.request<ForgotPasswordResponse>(API_CONFIG.ENDPOINTS.FORGOT_PASSWORD, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async validateResetToken(data: ValidateResetTokenRequest): Promise<ValidateResetTokenResponse> {
        return this.request<ValidateResetTokenResponse>(API_CONFIG.ENDPOINTS.VALIDATE_RESET_TOKEN, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
        return this.request<ResetPasswordResponse>(API_CONFIG.ENDPOINTS.RESET_PASSWORD, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
        return this.request<RefreshTokenResponse>(API_CONFIG.ENDPOINTS.REFRESH_TOKEN, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async logout(refreshToken: string): Promise<void> {
        try {
            await this.request<{ message: string }>(API_CONFIG.ENDPOINTS.LOGOUT, {
                method: 'POST',
                body: JSON.stringify({ refreshToken }),
            });
        } catch {
            // Ignore errors on logout - we'll clear local storage anyway
        }
    }
}

export const authService = new AuthService();