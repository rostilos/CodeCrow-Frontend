// Auth utility functions for JWT token handling

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  [key: string]: any;
}

export const authUtils = {
  // Get token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem('codecrow_token');
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

  // Logout user (clear localStorage)
  logout: (): void => {
    localStorage.removeItem('codecrow_token');
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