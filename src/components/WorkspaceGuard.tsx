import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useWorkspace } from '@/context/WorkspaceContext';
import { ROUTES } from '@/lib/routes';

interface WorkspaceGuardProps {
  children: React.ReactNode;
}

export default function WorkspaceGuard({ children }: WorkspaceGuardProps) {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { currentWorkspace, workspaces, loading, setCurrentWorkspaceBySlug } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateAndSetWorkspace = async () => {
      // If still loading workspaces, wait
      if (loading) return;
      
      // If no workspaces at all, redirect to workspace selection
      if (workspaces.length === 0) {
        navigate(ROUTES.WORKSPACE_SELECTION);
        return;
      }

      // If we have a workspace slug in URL
      if (workspaceSlug) {
        // Check if the slug matches an available workspace
        const workspaceExists = workspaces.some(w => w.slug === workspaceSlug);
        
        if (workspaceExists) {
          // If workspace exists but doesn't match current, switch to it
          if (!currentWorkspace || currentWorkspace.slug !== workspaceSlug) {
            await setCurrentWorkspaceBySlug(workspaceSlug);
          }
          setIsValidating(false);
        } else {
          // Workspace doesn't exist or user doesn't have access - redirect to workspace selection
          navigate(ROUTES.WORKSPACE_SELECTION);
        }
      } else {
        // No workspace in URL - redirect to workspace selection to choose one
        navigate(ROUTES.WORKSPACE_SELECTION);
      }
    };

    validateAndSetWorkspace();
  }, [workspaceSlug, currentWorkspace, workspaces, loading, navigate, setCurrentWorkspaceBySlug]);

  // Show loading while validating workspace
  if (loading || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return null; // Will redirect to workspace selection
  }

  return <>{children}</>;
}