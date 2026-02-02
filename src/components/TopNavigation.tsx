import { NavLink, useNavigate } from "react-router-dom";
import { Code, Brain, GitBranch, BookOpen, Settings, LogOut, User, Users, Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePermissions } from "@/hooks/usePermissions";
import { authUtils } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { CodeCrowLogo } from "@/components/CodeCrowLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { useState } from "react";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";

interface TopNavigationProps {
  showSearch?: boolean;
  onSearchClick?: () => void;
}

export function TopNavigation({ showSearch, onSearchClick }: TopNavigationProps) {
  const navigate = useNavigate();
  const { canManageWorkspace } = usePermissions();
  const user = authUtils.getUser();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const routes = useWorkspaceRoutes();

  const handleLogout = () => {
    authUtils.logout();
    navigate("/");
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of CodeCrow.",
    });
  };

  const getUserInitials = (username?: string) => {
    if (!username) return "U";
    return username.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (username?: string) => {
    if (!username) return "User";
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors hover:text-foreground ${isActive ? "text-orange-500 font-bold" : "font-medium text-muted-foreground"
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
    }`;

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 lg:px-6 h-full relative z-10">
        {/* Left side - Logo, Mobile Menu and Navigation */}
        <div className="flex items-center gap-4 lg:gap-8">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-left">
                  <CodeCrowLogo size="sm" />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-4 gap-1">
                <NavLink
                  to={routes.projects()}
                  className={mobileNavLinkClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Code className="h-4 w-4" />
                  Projects
                </NavLink>
                {canManageWorkspace() && (
                  <>
                    <NavLink
                      to={routes.aiSettings()}
                      className={mobileNavLinkClass}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Brain className="h-4 w-4" />
                      AI Connections
                    </NavLink>
                    <NavLink
                      to={routes.hostingSettings()}
                      className={mobileNavLinkClass}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <GitBranch className="h-4 w-4" />
                      VCS Connections
                    </NavLink>
                    <NavLink
                      to={routes.qualityGates()}
                      className={mobileNavLinkClass}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Quality Gates
                    </NavLink>
                    <NavLink
                      to={routes.workspaceSettings()}
                      className={mobileNavLinkClass}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Users className="h-4 w-4" />
                      Workspace Settings
                    </NavLink>
                  </>
                )}
                <NavLink
                  to="/docs"
                  className={mobileNavLinkClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BookOpen className="h-4 w-4" />
                  Documentation
                </NavLink>
                <div className="border-t my-2" />
                <NavLink
                  to={routes.userSettings()}
                  className={mobileNavLinkClass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  User Settings
                </NavLink>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </nav>
            </SheetContent>
          </Sheet>

          <button
            onClick={() => navigate("/")}
            className="flex items-center hover:opacity-80 transition-opacity gap-2"
          >
            <CodeCrowLogo size="sm" />
          </button>

          <nav className="hidden md:flex items-center gap-6">
            <NavLink to={routes.projects()} className={navLinkClass}>
              Projects
            </NavLink>
            {canManageWorkspace() && (
              <>
                <NavLink to={routes.aiSettings()} className={navLinkClass}>
                  AI Connections
                </NavLink>
                <NavLink to={routes.hostingSettings()} className={navLinkClass}>
                  VCS Connections
                </NavLink>
                <NavLink to={routes.qualityGates()} className={navLinkClass}>
                  Quality Gates
                </NavLink>
              </>
            )}
            <NavLink to="/docs" className={navLinkClass}>
              Documentation
            </NavLink>
          </nav>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          <WorkspaceSwitcher />
          <ThemeToggle />

          {/* Settings Dropdown (Workspace for admins) */}
          {canManageWorkspace() && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(routes.workspaceSettings())}>
                  <Users className="mr-2 h-4 w-4" />
                  Workspace Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.avatarUrl} alt={user?.username} referrerPolicy="no-referrer" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getUserInitials(user?.username)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:block text-sm font-medium">{getDisplayName(user?.username)}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{getDisplayName(user?.username)}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(routes.userSettings())}>
                <User className="mr-2 h-4 w-4" />
                User Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
