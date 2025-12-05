import { getApiUrl } from '@/config/api';
import {ApiError} from "@/api_service/api.interface.ts";

export class ApiService {
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isSecured: boolean = false
  ): Promise<T> {
    const url = getApiUrl(endpoint);

    // Extract headers from options to merge properly
    const { headers: optionHeaders, ...restOptions } = options;

    const config: RequestInit = {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('codecrow_token')}`,
        ...(optionHeaders as Record<string, string>),
      },
    };

    const response = await fetch(url, config);
    
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
}