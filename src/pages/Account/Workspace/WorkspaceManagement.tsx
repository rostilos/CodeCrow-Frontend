import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceManagement from "@/components/WorkspaceManagement";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";

export default function WorkspaceManagementPage() {
  const navigate = useNavigate();
  const { canManageWorkspace, loading } = usePermissions();
  const { toast } = useToast();

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!loading && !canManageWorkspace()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage workspace settings",
        variant: "destructive",
      });
      navigate('/dashboard/projects');
    }
  }, [loading, canManageWorkspace, navigate]);

  // Don't render if no permission
  if (loading || !canManageWorkspace()) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workspace Management</h1>
        <p className="text-muted-foreground">Manage workspace members, invitations, and permissions</p>
      </div>
      
      <WorkspaceManagement />
    </div>
  );
}