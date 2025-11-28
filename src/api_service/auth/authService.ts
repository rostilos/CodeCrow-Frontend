import {API_CONFIG} from '@/config/api';
import {ApiService} from "@/api_service/api.ts";
import {AuthResponse, LoginRequest, RegisterRequest} from "@/api_service/auth/authService.interface.ts";


class AuthService extends ApiService {
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        return this.request<AuthResponse>(API_CONFIG.ENDPOINTS.LOGIN, {
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
}

export const authService = new AuthService();