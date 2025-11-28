import {API_CONFIG} from '@/config/api';
import {ApiService} from "@/api_service/api.ts";
import {ChangePasswordRequest, ChangePasswordResponse} from "@/api_service/user/passwordService.interface.ts";

class PasswordService extends ApiService {
    async changePassword(passwordData: ChangePasswordRequest): Promise<ChangePasswordResponse> {
        return this.request<ChangePasswordResponse>(API_CONFIG.ENDPOINTS.CHANGE_PASSWORD, {
            method: 'PUT',
            body: JSON.stringify(passwordData)
        }, true);
    }
}

export const passwordService = new PasswordService();
