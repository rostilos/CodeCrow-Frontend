import {API_CONFIG} from '@/config/api';
import {ApiService} from "@/api_service/api.ts";
import {SaveUserDataRequest, SaveUserDataResponse} from "@/api_service/user/userDataService.interface.ts";

class UserDataService extends ApiService {
    async getCurrentUserData(): Promise<SaveUserDataResponse> {
        return this.request<SaveUserDataResponse>(API_CONFIG.ENDPOINTS.GET_USER_DATA, {}, true);
    }
    async saveUserData(userData: SaveUserDataRequest): Promise<SaveUserDataResponse> {
        return this.request<SaveUserDataResponse>(API_CONFIG.ENDPOINTS.SAVE_USER_DATA, {
            method: 'PUT',
            body: JSON.stringify(userData)
        }, true);
    }
}

export const userDataService = new UserDataService();