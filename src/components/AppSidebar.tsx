import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  User, 
  GitBranch, 
  Zap, 
  CreditCard, 
  Code, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Brain,
  Users,
  BookOpen
} from "lucide-react";
import { authUtils } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canManageWorkspace } = usePermissions();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const settingsItems = [
    { title: "Projects", url: "/dashboard/projects", icon: Code },
    { title: "User Settings", url: "/dashboard/user", icon: User },
    // { title: "Task Management", url: "/dashboard/tasks", icon: Zap },
    // { title: "Plan & Billing", url: "/dashboard/billing", icon: CreditCard },
  ];

  // Add workspace management for admin/owner users
  const workspaceItem = { title: "Workspace", url: "/dashboard/workspace", icon: Users };
  const aiConnectionItem = { title: "AI Connections", url: "/dashboard/ai", icon: Brain };
  const vcsConnectionItem =   { title: "Code Hosting", url: "/dashboard/hosting", icon: GitBranch };
  const navigationItems = canManageWorkspace() 
    ? [...settingsItems, aiConnectionItem, vcsConnectionItem, workspaceItem]
    : settingsItems;

  const handleLogout = () => {
    authUtils.logout();
    navigate("/");
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of CodeCrow.",
    });
  };

  const isActive = (path: string) => currentPath === path;
  const isExpanded = navigationItems.some((item) => isActive(item.url));

  const getNavClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-primary text-primary-foreground shadow-primary"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} transition-all duration-300 ease-in-out`}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar border-r border-sidebar-border">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <button 
                onClick={() => navigate("/")}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <Code className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  CodeCrow
                </h1>
              </button>
            )}
            {collapsed && (
              <button 
                onClick={() => navigate("/")}
                className="hover:opacity-80 transition-opacity"
              >
                <Code className="h-8 w-8 text-primary mx-auto" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs uppercase tracking-wider font-semibold mb-3">
            {!collapsed && "Configuration"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) => getNavClasses({ isActive })}
                    >
                      <item.icon className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="bg-sidebar-border" />

        <SidebarGroup className="px-3 py-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/docs"
                    className={({ isActive }) => getNavClasses({ isActive })}
                  >
                    <BookOpen className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                    {!collapsed && <span>Documentation</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            size={collapsed ? "icon" : "default"}
            onClick={handleLogout}
          >
            <LogOut className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}