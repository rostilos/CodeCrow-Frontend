import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Code,
  User,
  Brain,
  GitBranch,
  Users,
  FileCode,
  Rocket,
  Settings as SettingsIcon,
  Shield,
  CreditCard,
} from "lucide-react";
import { authUtils } from "@/lib/auth";
import { usePermissions } from "@/hooks/usePermissions";
import { TopNavigation } from "@/components/TopNavigation";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";
import { FEATURES } from "@/config/features";
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
  const { canManageWorkspace } = usePermissions();
  const [searchOpen, setSearchOpen] = useState(false);
  const routes = useWorkspaceRoutes();

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      navigate("/login");
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
    {
      title: "Projects",
      url: routes.projects(),
      icon: Code,
      group: "Navigation",
    },
    {
      title: "User Settings",
      url: routes.userSettings(),
      icon: User,
      group: "Navigation",
    },
    ...(canManageWorkspace()
      ? [
          {
            title: "AI Connections",
            url: routes.aiSettings(),
            icon: Brain,
            group: "Navigation",
          },
          {
            title: "VCS Connections",
            url: routes.hostingSettings(),
            icon: GitBranch,
            group: "Navigation",
          },
          {
            title: "Quality Gates",
            url: routes.qualityGates(),
            icon: Shield,
            group: "Navigation",
          },
          // Only show billing in search if feature is enabled
          ...(FEATURES.BILLING
            ? [
                {
                  title: "Billing",
                  url: routes.billingSettings(),
                  icon: CreditCard,
                  group: "Navigation",
                },
              ]
            : []),
          {
            title: "Workspace Settings",
            url: routes.workspaceSettings(),
            icon: Users,
            group: "Navigation",
          },
        ]
      : []),
    {
      title: "Getting Started",
      url: "/docs",
      icon: Rocket,
      group: "Documentation",
    },
    {
      title: "Create Workspace",
      url: "/docs/workspace",
      icon: Users,
      group: "Documentation",
    },
    {
      title: "Create VCS Connection",
      url: "/docs/vcs-connection",
      icon: GitBranch,
      group: "Documentation",
    },
    {
      title: "Create AI Connection",
      url: "/docs/ai-connection",
      icon: Brain,
      group: "Documentation",
    },
    {
      title: "Create First Project",
      url: "/docs/first-project",
      icon: Code,
      group: "Documentation",
    },
    {
      title: "Generate Project Token",
      url: "/docs/project-token",
      icon: FileCode,
      group: "Documentation",
    },
    {
      title: "Setup Bitbucket Pipelines",
      url: "/docs/bitbucket-pipelines",
      icon: SettingsIcon,
      group: "Documentation",
    },
  ];

  const handleSearchSelect = (url: string) => {
    navigate(url);
    setSearchOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-background dashboard-theme">
      <TopNavigation showSearch onSearchClick={() => setSearchOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto container">
        <Outlet />
      </main>

      {/* Command Palette */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search for pages, settings, and documentation..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Object.entries(
            searchItems.reduce(
              (acc, item) => {
                if (!acc[item.group]) acc[item.group] = [];
                acc[item.group].push(item);
                return acc;
              },
              {} as Record<string, typeof searchItems>,
            ),
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
    </div>
  );
}
