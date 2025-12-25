import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { WorkspaceDTO, workspaceService } from '@/api_service/workspace/workspaceService';
import { useToast } from '@/hooks/use-toast';
import { extractWorkspaceFromPath } from '@/lib/routes';

interface WorkspaceContextType {
  currentWorkspace: WorkspaceDTO | null;
  workspaces: WorkspaceDTO[];
  setCurrentWorkspace: (workspace: WorkspaceDTO | null) => void;
  setCurrentWorkspaceBySlug: (slug: string) => Promise<boolean>;
  refreshWorkspaces: () => Promise<void>;
  loading: boolean;
  workspaceVersion: number; // Version number that changes when workspace is switched
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceDTO | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const { toast } = useToast();

  const refreshWorkspaces = async (): Promise<WorkspaceDTO[]> => {
    try {
      setLoading(true);
      const userWorkspaces = await workspaceService.getUserWorkspaces();
      
      // Fetch member counts for each workspace in parallel
      const workspacesWithMembers = await Promise.all(
        userWorkspaces.map(async (ws) => {
          try {
            const members = await workspaceService.getWorkspaceMembers(ws.slug);
            return { ...ws, membersCount: members.length, members };
          } catch {
            // If fetching members fails, return workspace with default count
            return { ...ws, membersCount: ws.membersCount ?? 1 };
          }
        })
      );
      
      setWorkspaces(workspacesWithMembers);
      return workspacesWithMembers;
    } catch (error: any) {
      toast({
        title: "Failed to load workspaces",
        description: error.message || "Could not retrieve workspaces",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Set workspace by slug - useful when navigating via URL
  const setCurrentWorkspaceBySlug = useCallback(async (slug: string): Promise<boolean> => {
    // First check in existing workspaces
    let workspace = workspaces.find(w => w.slug === slug);
    
    if (!workspace) {
      // If not found, refresh workspaces and try again
      const refreshed = await refreshWorkspaces();
      workspace = refreshed.find(w => w.slug === slug);
    }
    
    if (workspace) {
      setCurrentWorkspace(workspace);
      setWorkspaceVersion(prev => prev + 1);
      localStorage.setItem('currentWorkspaceSlug', workspace.slug);
      return true;
    }
    
    return false;
  }, [workspaces]);

  useEffect(() => {
    const initWorkspace = async () => {
      const loadedWorkspaces = await refreshWorkspaces();
      
      // First, try to get workspace from URL
      const urlWorkspaceSlug = extractWorkspaceFromPath(window.location.pathname);
      
      if (urlWorkspaceSlug) {
        const urlWorkspace = loadedWorkspaces.find(w => w.slug === urlWorkspaceSlug);
        if (urlWorkspace) {
          setCurrentWorkspace(urlWorkspace);
          localStorage.setItem('currentWorkspaceSlug', urlWorkspace.slug);
          return;
        }
      }
      
      // Fall back to saved workspace from localStorage
      const savedWorkspaceSlug = localStorage.getItem('currentWorkspaceSlug');
      if (savedWorkspaceSlug) {
        const saved = loadedWorkspaces.find(w => w.slug === savedWorkspaceSlug);
        if (saved) {
          setCurrentWorkspace(saved);
          return;
        }
      }
      
      // If no workspace set and there are workspaces, set the first one
      if (loadedWorkspaces.length > 0) {
        setCurrentWorkspace(loadedWorkspaces[0]);
        localStorage.setItem('currentWorkspaceSlug', loadedWorkspaces[0].slug);
      }
    };
    
    initWorkspace();
  }, []);

  const handleSetCurrentWorkspace = (workspace: WorkspaceDTO | null) => {
    setCurrentWorkspace(workspace);
    setWorkspaceVersion(prev => prev + 1); // Increment version to trigger re-renders
    if (workspace) {
      localStorage.setItem('currentWorkspaceSlug', workspace.slug);
    } else {
      localStorage.removeItem('currentWorkspaceSlug');
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        setCurrentWorkspace: handleSetCurrentWorkspace,
        setCurrentWorkspaceBySlug,
        refreshWorkspaces,
        loading,
        workspaceVersion,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};