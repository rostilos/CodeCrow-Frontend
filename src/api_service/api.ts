import { getApiUrl, API_CONFIG } from '@/config/api';
import {ApiError} from "@/api_service/api.interface.ts";
import { authUtils } from '@/lib/auth';

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export class ApiService {
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isSecured: boolean = false
  ): Promise<T> {
    const isLoginRequest = [
      API_CONFIG.ENDPOINTS.LOGIN, API_CONFIG.ENDPOINTS.LOGIN_2FA,
      API_CONFIG.ENDPOINTS.LOGIN_2FA_RESEND, API_CONFIG.ENDPOINTS.GOOGLE_AUTH,
      API_CONFIG.ENDPOINTS.REGISTER, API_CONFIG.ENDPOINTS.FORGOT_PASSWORD,
      API_CONFIG.ENDPOINTS.VALIDATE_RESET_TOKEN, API_CONFIG.ENDPOINTS.RESET_PASSWORD,
      API_CONFIG.ENDPOINTS.REFRESH_TOKEN,
    ].some(path => path === endpoint);
    // Check if token needs refresh before making request
    if (!isLoginRequest && authUtils.shouldRefreshToken()) {
      await this.refreshTokenIfNeeded();
    }

    const url = getApiUrl(endpoint);

    // Extract headers from options to merge properly
    const { headers: optionHeaders, ...restOptions } = options;

    const config: RequestInit = {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(!isLoginRequest ? authUtils.getAuthHeaders() : {}),
        ...(optionHeaders as Record<string, string>),
      },
    };

    let response = await fetch(url, config);
    
    // If unauthorized and we have a refresh token, try to refresh
    if (response.status === 401 && !isLoginRequest) {
      const refreshed = await this.refreshTokenIfNeeded();
      if (refreshed) {
        // Retry the original request with new token
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${localStorage.getItem('codecrow_token')}`,
        };
        response = await fetch(url, config);
      }
    }
    
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'Network error occurred',
        status: response.status,
      }));
      throw error;
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }

    // Check if response has content before parsing JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    const result = await response.json();

    if (result.accessToken) {
      localStorage.setItem('codecrow_token', result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem('codecrow_refresh_token', result.refreshToken);
      }
      localStorage.setItem('codecrow_user', JSON.stringify({
        id: result.id,
        username: result.username,
        email: result.email,
        avatarUrl: result.avatarUrl,
        roles: result.roles ? result.roles.join(',') : '',
      }));
    }

    return result;
  }

  private async refreshTokenIfNeeded(): Promise<boolean> {
    const refreshToken = authUtils.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    // If already refreshing, wait for existing refresh to complete
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = this.performTokenRefresh(refreshToken);
    
    try {
      const result = await refreshPromise;
      return result;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<boolean> {
    try {
      const url = getApiUrl(API_CONFIG.ENDPOINTS.REFRESH_TOKEN);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      // A login or logout may have replaced this session while refresh was in flight.
      if (authUtils.getRefreshToken() !== refreshToken) {
        return authUtils.isAuthenticated();
      }
      if (!response.ok) {
        // Refresh failed - clear auth and redirect to login
        authUtils.logout();
        window.location.href = '/login';
        return false;
      }

      const data = await response.json();
      if (data.accessToken) {
        localStorage.setItem('codecrow_token', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('codecrow_refresh_token', data.refreshToken);
        }
        return true;
      }
      return false;
    } catch {
      if (authUtils.getRefreshToken() === refreshToken) authUtils.logout();
      return false;
    }
  }
}
