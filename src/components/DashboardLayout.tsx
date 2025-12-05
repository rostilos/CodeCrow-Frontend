import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Search, Code, User, Brain, GitBranch, Users, BookOpen, FileCode, Rocket, Settings as SettingsIcon, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { authUtils } from "@/lib/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    { title: "Projects", url: "/dashboard/projects", icon: Code, group: "Navigation" },
    { title: "User Settings", url: "/dashboard/user", icon: User, group: "Navigation" },
    ...(canManageWorkspace() ? [
      { title: "AI Connections", url: "/dashboard/ai", icon: Brain, group: "Navigation" },
      { title: "Code Hosting", url: "/dashboard/hosting", icon: GitBranch, group: "Navigation" },
      { title: "Workspace", url: "/dashboard/workspace", icon: Users, group: "Navigation" },
    ] : []),
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
      <div className="min-h-screen flex w-full bg-background dashboard-theme">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="sticky top-0 z-40 h-16 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between px-4 lg:px-6 h-full gap-4">
              <div className="flex items-center gap-3 flex-1">
                <SidebarTrigger className="hover:bg-accent/50 hover:text-accent-foreground h-9 w-9 rounded-lg" />
                <WorkspaceSwitcher />
                <div 
                  className="relative cursor-pointer hidden sm:block"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search..." 
                    className="text-sm pl-9 w-48 lg:w-64 bg-muted/50 border-transparent focus:border-border cursor-pointer h-9 rounded-lg"
                    readOnly
                  />
                  <kbd className="hidden lg:flex absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none h-5 select-none items-center gap-0.5 rounded-md border border-border/50 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="sm:hidden"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="flex items-center gap-3 pl-3 border-l border-border/40">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatarUrl} alt={user?.username} referrerPolicy="no-referrer" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {getUserInitials(user?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-sm">
                    <p className="font-medium text-foreground leading-tight">{getDisplayName(user?.username)}</p>
                    <p className="text-muted-foreground text-xs leading-tight">{user?.email || 'User'}</p>
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