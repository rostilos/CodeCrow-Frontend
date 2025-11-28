import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, Search, Code, User, Brain, GitBranch, Users, BookOpen, FileCode, Rocket, Settings as SettingsIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { authUtils } from "@/lib/auth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const user = authUtils.getUser();
  const { canManageWorkspace } = usePermissions();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const searchItems = [
    // Main navigation
    { title: "Projects", url: "/dashboard/projects", icon: Code, group: "Navigation" },
    { title: "User Settings", url: "/dashboard/user", icon: User, group: "Navigation" },
    ...(canManageWorkspace() ? [
      { title: "AI Connections", url: "/dashboard/ai", icon: Brain, group: "Navigation" },
      { title: "Code Hosting", url: "/dashboard/hosting", icon: GitBranch, group: "Navigation" },
      { title: "Workspace", url: "/dashboard/workspace", icon: Users, group: "Navigation" },
    ] : []),
    
    // Documentation
    { title: "Getting Started", url: "/docs", icon: Rocket, group: "Documentation" },
    { title: "Create Workspace", url: "/docs/workspace", icon: Users, group: "Documentation" },
    { title: "Create VCS Connection", url: "/docs/vcs-connection", icon: GitBranch, group: "Documentation" },
    { title: "Create AI Connection", url: "/docs/ai-connection", icon: Brain, group: "Documentation" },
    { title: "Create First Project", url: "/docs/first-project", icon: Code, group: "Documentation" },
    { title: "Generate Project Token", url: "/docs/project-token", icon: FileCode, group: "Documentation" },
    { title: "Setup Bitbucket Pipelines", url: "/docs/bitbucket-pipelines", icon: SettingsIcon, group: "Documentation" },
  ];

  const handleSearchSelect = (url: string) => {
    navigate(url);
    setSearchOpen(false);
  };

  const getUserInitials = (username?: string) => {
    if (!username) return "U";
    return username.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (username?: string) => {
    if (!username) return "User";
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/20 min-h-[65px]">
            <div className="flex items-center justify-between px-6 h-full">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground" />
                <WorkspaceSwitcher />
                <div 
                  className="relative cursor-pointer"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search settings..." 
                    className="text-ellipsis text-xs md:text-sm overflow-hidden pl-10 w-24 lg:w-80 bg-background/50 border-border cursor-pointer"
                    readOnly
                  />
                  <kbd className="hidden lg:block absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-xs md:text-sm font-medium text-primary-foreground">
                      {getUserInitials(user?.username)}
                    </span>
                  </div>
                  <div className="text-xs md:text-sm">
                    <p className="font-medium">{getDisplayName(user?.username)}</p>
                    <p className="text-muted-foreground">{user?.email || 'User'}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Command Palette */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search for pages, settings, and documentation..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Object.entries(
            searchItems.reduce((acc, item) => {
              if (!acc[item.group]) acc[item.group] = [];
              acc[item.group].push(item);
              return acc;
            }, {} as Record<string, typeof searchItems>)
          ).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.url}
                    onSelect={() => handleSearchSelect(item.url)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </SidebarProvider>
  );
}