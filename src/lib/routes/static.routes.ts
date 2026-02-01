/**
 * Static/Public routes - homepage, auth pages, etc.
 * These routes don't require authentication.
 */

export const STATIC_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  WORKSPACE_SELECTION: '/workspace',
} as const;
