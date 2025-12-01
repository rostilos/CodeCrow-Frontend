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
  BookOpen,
} from "lucide-react";
import { authUtils } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { CodeCrowLogo, CodeCrowIcon } from "@/components/CodeCrowLogo";

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

  const mainNavItems = [
    { title: "Projects", url: "/dashboard/projects", icon: Code },
  ];

  const workspaceItem = { title: "Workspace", url: "/dashboard/workspace", icon: Users };
  const aiConnectionItem = { title: "AI Connections", url: "/dashboard/ai", icon: Brain };
  const vcsConnectionItem = { title: "Code Hosting", url: "/dashboard/hosting", icon: GitBranch };
  const userSettingsItem = { title: "User Settings", url: "/dashboard/user", icon: User };
  
  const navigationItems = canManageWorkspace() 
    ? [...mainNavItems, aiConnectionItem, vcsConnectionItem, workspaceItem]
    : mainNavItems;

  const handleLogout = () => {
    authUtils.logout();
    navigate("/");
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of CodeCrow.",
    });
  };

  const isActive = (path: string) => currentPath === path;

  const getNavClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
      isActive
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300 ease-in-out border-r-0`}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar flex flex-col overflow-x-hidden">
        {/* Logo Header */}
        <div className={`border-b border-sidebar-border/50 p-3 max-h-[63px]`}>
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            {collapsed ? (
              <CodeCrowIcon size="sm" />
            ) : (
              <CodeCrowLogo size="md" />
            )}
          </button>
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="px-3 py-4 flex-1">
          {!collapsed && (
            <SidebarGroupLabel className="text-muted-foreground/60 text-[11px] uppercase tracking-wider font-semibold mb-3 px-3">
              Navigation
            </SidebarGroupLabel>
          )}

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) => getNavClasses({ isActive })}
                    >
                      <item.icon className={`h-[18px] w-[18px] shrink-0 ${collapsed ? "mx-auto" : "mr-3"} transition-colors`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="bg-sidebar-border/50 mx-3" />

        {/* Resources */}
        <SidebarGroup className="px-3 py-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-muted-foreground/60 text-[11px] uppercase tracking-wider font-semibold mb-3 px-3">
              Resources
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/docs"
                    className={({ isActive }) => getNavClasses({ isActive })}
                  >
                    <BookOpen className={`h-[18px] w-[18px] shrink-0 ${collapsed ? "mx-auto" : "mr-3"}`} />
                    {!collapsed && <span>Documentation</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="mt-auto p-3 border-t border-sidebar-border/50 space-y-1">
          <NavLink
            to={userSettingsItem.url}
            className={({ isActive }) => getNavClasses({ isActive })}
          >
            <userSettingsItem.icon className={`h-[18px] w-[18px] shrink-0 ${collapsed ? "mx-auto" : "mr-3"}`} />
            {!collapsed && <span>{userSettingsItem.title}</span>}
          </NavLink>
          <button
            className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-muted-foreground hover:bg-destructive/10 hover:text-destructive ${collapsed ? "justify-center" : ""}`}
            onClick={handleLogout}
          >
            <LogOut className={`h-[18px] w-[18px] shrink-0 ${collapsed ? "" : "mr-3"}`} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}