import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '@/context/WorkspaceContext';

interface WorkspaceGuardProps {
  children: React.ReactNode;
}

export default function WorkspaceGuard({ children }: WorkspaceGuardProps) {
  const { currentWorkspace, loading } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !currentWorkspace) {
      navigate('/workspace');
    }
  }, [currentWorkspace, loading, navigate]);

  if (loading) {
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