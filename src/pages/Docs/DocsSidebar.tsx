import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { CodeCrowLogo, CodeCrowIcon } from "@/components/CodeCrowLogo";
import { useState } from "react";

import {
    BookOpen,
    Briefcase,
    GitBranch,
    FolderGit2,
    Key,
    Workflow,
    GitPullRequest,
    HelpCircle,
    Cpu,
    Code2,
    Layers,
    Settings,
    Database,
    Terminal,
    Server,
    Wrench,
    FileCode,
    Download,
    Mail,
} from "lucide-react";

// Getting Started navigation items
const gettingStartedItems = [
  { title: "Overview", url: "/docs", icon: BookOpen },
  { title: "Create Workspace", url: "/docs/workspace", icon: Briefcase },
  { title: "VCS Connection", url: "/docs/vcs-connection", icon: GitBranch },
  { title: "AI Connection", url: "/docs/ai-connection", icon: Cpu },
  { title: "First Project", url: "/docs/first-project", icon: FolderGit2 },
  { title: "Project Token", url: "/docs/project-token", icon: Key },
  { title: "Bitbucket Pipelines", url: "/docs/bitbucket-pipelines", icon: Workflow },
  { title: "Create Pull Request", url: "/docs/pull-request", icon: GitPullRequest },
  { title: "Bitbucket App Install", url: "/docs/bitbucket-app-install", icon: Download },
];

// Developer Documentation items
const developerDocsItems = [
  { title: "Architecture", url: "/docs/dev/architecture", icon: Layers },
  { title: "Configuration", url: "/docs/dev/configuration", icon: Settings },
  { title: "SMTP Setup", url: "/docs/dev/smtp", icon: Mail },
  { title: "API Reference", url: "/docs/dev/api", icon: Terminal },
  { title: "Database Schema", url: "/docs/dev/database", icon: Database },
  { title: "Modules", url: "/docs/dev/modules", icon: Code2 },
  { title: "Deployment", url: "/docs/dev/deployment", icon: Server },
  { title: "Development Guide", url: "/docs/dev/development", icon: Wrench },
  { title: "Troubleshooting", url: "/docs/dev/troubleshooting", icon: FileCode },
];

const faqItem = { title: "FAQ", url: "/docs/faq", icon: HelpCircle };

interface NavSectionProps {
  title: string;
  icon: React.ElementType;
  items: typeof gettingStartedItems;
  collapsed: boolean;
  defaultOpen?: boolean;
}

function NavSection({ title, icon: Icon, items, collapsed, defaultOpen = false }: NavSectionProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const isActive = items.some(item => location.pathname === item.url);

  if (collapsed) {
    return (
      <div className="py-1">
        <div className="flex items-center justify-center p-2 text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted/50 transition-colors group">
        <Icon className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="flex-1 text-left text-foreground/80">{title}</span>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1">
        <div className="ml-3 pl-3 border-l border-border/50 space-y-0.5">
          {items.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`
              }
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DocsSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} transition-all duration-300 ease-in-out`}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar border-r border-border/40">
        {/* Header */}
        <div className="p-3 border-b border-border/40">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center w-full hover:opacity-80 transition-opacity"
          >
            <CodeCrowLogo size="md" />
          </button>
        </div>

        {/* Navigation */}
        <SidebarGroup className="px-2 py-3 flex-1">
          <SidebarGroupContent>
            <div className="space-y-4">
              {/* Getting Started Section */}
              <NavSection
                title="Getting Started"
                icon={BookOpen}
                items={gettingStartedItems}
                collapsed={collapsed}
                defaultOpen={true}
              />

              {/* Developer Docs Section */}
              <NavSection
                title="Developer Docs"
                icon={Code2}
                items={developerDocsItems}
                collapsed={collapsed}
                defaultOpen={false}
              />

              {/* FAQ - Single item */}
              {!collapsed ? (
                <NavLink
                  to={faqItem.url}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/80 hover:bg-muted/50"
                    }`
                  }
                >
                  <faqItem.icon className="h-4 w-4" />
                  <span>{faqItem.title}</span>
                </NavLink>
              ) : (
                <div className="flex items-center justify-center p-2">
                  <NavLink to={faqItem.url}>
                    <faqItem.icon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  </NavLink>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground text-center">
              CodeCrow Documentation
            </p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
