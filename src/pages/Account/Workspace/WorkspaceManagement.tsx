import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import WorkspaceMembers from "@/components/WorkspaceManagement";
import WorkspaceConfiguration from "@/components/WorkspaceConfiguration";
import WorkspaceDangerZone from "@/components/WorkspaceDangerZone";
import BillingSettings from "../Billing/BillingSettings";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Users, Settings, AlertTriangle, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/config/features";

const navItems = [
  { id: "members", label: "Members", icon: Users },
  // Billing tab only shown when feature is enabled
  ...(FEATURES.BILLING ? [{ id: "billing", label: "Billing", icon: CreditCard }] : []),
  { id: "configuration", label: "Configuration", icon: Settings },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle, danger: true },
];

export default function WorkspaceManagementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canManageWorkspace, loading, isWorkspaceOwner } = usePermissions();
  const { toast } = useToast();
  const routes = useWorkspaceRoutes();
  const { currentWorkspace } = useWorkspace();

  const activeTab = searchParams.get("tab") || "members";

  const handleNavClick = (tabId: string) => {
    navigate(`?tab=${tabId}`);
  };

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!loading && !canManageWorkspace()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage workspace settings",
        variant: "destructive",
      });
      navigate(routes.projects());
    }
  }, [loading, canManageWorkspace, navigate]);

  // Don't render if no permission
  if (loading || !canManageWorkspace()) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "members":
        return <WorkspaceMembers />;
      case "billing":
        return <BillingSettings />;
      case "configuration":
        return <WorkspaceConfiguration />;
      case "danger":
        return <WorkspaceDangerZone />;
      default:
        return <WorkspaceMembers />;
    }
  };

  return (
    <div className="container p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{currentWorkspace?.name || 'Workspace'} Settings</h1>
        <p className="text-muted-foreground">Manage workspace members, configuration, and settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side Navigation */}
        <nav className="lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-6 space-y-1 bg-card rounded-lg border p-2">
            {navItems.filter(item => item.id !== 'billing' || (FEATURES.BILLING && isWorkspaceOwner())).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left",
                    isActive
                      ? item.danger
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                      : item.danger
                        ? "text-destructive/70 hover:bg-destructive/5 hover:text-destructive"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}