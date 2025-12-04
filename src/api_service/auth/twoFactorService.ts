import { API_CONFIG } from '@/config/api';
import { ApiService } from "@/api_service/api.ts";
import {
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
  TwoFactorEnableResponse,
  TwoFactorSetupRequest,
  TwoFactorVerifyRequest,
  TwoFactorLoginRequest,
} from "@/api_service/auth/twoFactorService.interface.ts";
import { AuthResponse } from "@/api_service/auth/authService.interface.ts";

class TwoFactorService extends ApiService {

  async getStatus(): Promise<TwoFactorStatusResponse> {
    return this.request<TwoFactorStatusResponse>('/auth/2fa/status', {
      method: 'GET',
    });
  }

  async initializeSetup(data: TwoFactorSetupRequest): Promise<TwoFactorSetupResponse> {
    return this.request<TwoFactorSetupResponse>('/auth/2fa/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyAndEnable(data: TwoFactorVerifyRequest): Promise<TwoFactorEnableResponse> {
    return this.request<TwoFactorEnableResponse>('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async disable(data: TwoFactorVerifyRequest): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async regenerateBackupCodes(data: TwoFactorVerifyRequest): Promise<TwoFactorEnableResponse> {
    return this.request<TwoFactorEnableResponse>('/auth/2fa/backup-codes/regenerate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendEmailCode(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/2fa/resend-code', {
      method: 'POST',
    });
  }

  async verifyLogin(data: TwoFactorLoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login/2fa', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendLoginCode(tempToken: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/login/2fa/resend', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code: '' }),
    });
  }
}

export const twoFactorService = new TwoFactorService();
