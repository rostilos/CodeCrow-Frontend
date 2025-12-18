// Auth utility functions for JWT token handling

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  [key: string]: any;
}

// Token refresh threshold - refresh when token expires in less than 5 minutes
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

export const authUtils = {
  // Get token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem('codecrow_token');
  },

  // Get refresh token from localStorage
  getRefreshToken: (): string | null => {
    return localStorage.getItem('codecrow_refresh_token');
  },

  // Store tokens
  setTokens: (accessToken: string, refreshToken?: string): void => {
    localStorage.setItem('codecrow_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('codecrow_refresh_token', refreshToken);
    }
  },

  // Get user data from localStorage
  getUser: (): User | null => {
    const userStr = localStorage.getItem('codecrow_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = authUtils.getToken();
    if (!token) return false;

    try {
      // Basic JWT expiration check (decode payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch {
      // If token is malformed, consider as not authenticated
      authUtils.logout();
      return false;
    }
  },

  // Check if token needs refresh (expires within threshold)
  shouldRefreshToken: (): boolean => {
    const token = authUtils.getToken();
    const refreshToken = authUtils.getRefreshToken();
    
    if (!token || !refreshToken) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now();
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      
      // Refresh if token expires within threshold
      return (expirationTime - currentTime) < REFRESH_THRESHOLD_MS;
    } catch {
      return false;
    }
  },

  // Logout user (clear localStorage)
  logout: (): void => {
    localStorage.removeItem('codecrow_token');
    localStorage.removeItem('codecrow_refresh_token');
    localStorage.removeItem('codecrow_user');
  },

  // Get authorization headers for API calls
  getAuthHeaders: (): Record<string, string> => {
    const token = authUtils.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // Make authenticated API request
  fetchWithAuth: async (url: string, options: RequestInit = {}): Promise<Response> => {
    const authHeaders = authUtils.getAuthHeaders();
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });
  },
};