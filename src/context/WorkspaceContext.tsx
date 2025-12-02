import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WorkspaceDTO, workspaceService } from '@/api_service/workspace/workspaceService';
import { useToast } from '@/hooks/use-toast';

interface WorkspaceContextType {
  currentWorkspace: WorkspaceDTO | null;
  workspaces: WorkspaceDTO[];
  setCurrentWorkspace: (workspace: WorkspaceDTO | null) => void;
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

  const refreshWorkspaces = async () => {
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
      
      // If no current workspace is set and there are workspaces, set the first one
      if (!currentWorkspace && workspacesWithMembers.length > 0) {
        setCurrentWorkspace(workspacesWithMembers[0]);
        localStorage.setItem('currentWorkspaceSlug', workspacesWithMembers[0].slug);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load workspaces",
        description: error.message || "Could not retrieve workspaces",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load saved workspace from localStorage
    const savedWorkspaceSlug = localStorage.getItem('currentWorkspaceSlug');
    if (savedWorkspaceSlug) {
      refreshWorkspaces().then(() => {
        const saved = workspaces.find(w => w.slug === savedWorkspaceSlug);
        if (saved) {
          setCurrentWorkspace(saved);
        }
      });
    } else {
      refreshWorkspaces();
    }
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