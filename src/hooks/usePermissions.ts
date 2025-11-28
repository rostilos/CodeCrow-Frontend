import { useState, useEffect } from 'react';
import { workspaceService, UserRole } from '@/api_service/workspace/workspaceService';
import { useWorkspace } from '@/context/WorkspaceContext';

export function usePermissions() {
  const { currentWorkspace } = useWorkspace();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentWorkspace) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const role = await workspaceService.getUserRole(currentWorkspace.slug);
        setUserRole(role);
      } catch (error) {
        console.error('Failed to fetch user role:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [currentWorkspace]);

  const hasPermission = (requiredRoles: Array<'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'>): boolean => {
    if (!userRole) return false;
    return requiredRoles.includes(userRole.role);
  };

  const canManageWorkspace = (): boolean => {
    return hasPermission(['OWNER', 'ADMIN']);
  };

  const canGenerateTokens = (): boolean => {
    return hasPermission(['OWNER', 'ADMIN']);
  };

  return {
    userRole: userRole?.role || null,
    loading,
    hasPermission,
    canManageWorkspace,
    canGenerateTokens,
  };
}