import { useMemo } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { createWorkspaceRoutes, ROUTES } from '@/lib/routes';

/**
 * Hook that provides workspace-aware route functions.
 * Automatically uses the current workspace from context.
 * 
 * @example
 * const routes = useWorkspaceRoutes();
 * navigate(routes.projects()); // navigates to /dashboard/{workspaceSlug}/projects
 */
export function useWorkspaceRoutes() {
  const { currentWorkspace } = useWorkspace();
  
  const routes = useMemo(() => {
    const slug = currentWorkspace?.slug || '';
    return createWorkspaceRoutes(slug);
  }, [currentWorkspace?.slug]);
  
  return routes;
}

/**
 * Hook that returns the current workspace slug for URL building.
 * Falls back to empty string if no workspace is selected.
 */
export function useWorkspaceSlug(): string {
  const { currentWorkspace } = useWorkspace();
  return currentWorkspace?.slug || '';
}

// Re-export ROUTES for cases where workspace slug is known
export { ROUTES };
