/**
 * Route utility functions
 */

/**
 * Extract workspace slug from current URL path
 */
export function extractWorkspaceFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Check if a path is a dashboard path that requires workspace
 */
export function isDashboardPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard");
}
