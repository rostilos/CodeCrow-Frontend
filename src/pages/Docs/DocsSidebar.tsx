import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { CodeCrowLogo } from "@/components/CodeCrowLogo";
import { useState, useEffect } from "react";

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
  Mail,
  UserPlus,
  LayoutDashboard,
  DatabaseZap,
  Brain,
  AlertTriangle,
  Globe,
  Filter,
  Hammer,
  MessageSquare,
  History as HistoryIcon,
  Info,
  Github,
  CheckCircle2
} from "lucide-react";

// Bitbucket logo SVG component
function BitbucketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
    </svg>
  );
}

// GitLab logo SVG component
function GitLabIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
    </svg>
  );
}

// Getting Started navigation structure
const gettingStartedItems = [
  { title: "Overview", url: "/docs", icon: BookOpen },
  { title: "Create Workspace", url: "/docs/workspace", icon: Briefcase },
  {
    title: "VCS Connection",
    icon: GitBranch,
    isGroup: true,
    items: [
      { title: "Overview", url: "/docs/vcs-connection", icon: Info },
      { title: "Bitbucket", url: "/docs/vcs-connection/bitbucket", icon: BitbucketIcon },
      { title: "GitHub", url: "/docs/vcs-connection/github", icon: Github },
      { title: "GitLab", url: "/docs/vcs-connection/gitlab", icon: GitLabIcon },
    ]
  },
  { title: "AI Connection", url: "/docs/ai-connection", icon: Cpu },
  { title: "First Project", url: "/docs/first-project", icon: FolderGit2 },
  { title: "Setup RAG (Optional)", url: "/docs/setup-rag", icon: DatabaseZap },
  {
    title: "Manual Pipeline Setup",
    icon: Workflow,
    isGroup: true,
    items: [
      { title: "Project Token", url: "/docs/project-token", icon: Key },
      { title: "Pipeline Setup", url: "/docs/pipeline-setup", icon: Workflow },
    ]
  },
  { title: "Create Pull Request", url: "/docs/pull-request", icon: GitPullRequest },
];

// Other items remain as groups for their own sections
const adminItems = [
  { title: "Overview", url: "/docs/admin/workspace", icon: UserPlus },
];

const projectAdminItems = [
  { title: "Overview", url: "/docs/admin/project", icon: LayoutDashboard },
  { title: "General", url: "/docs/admin/project/general", icon: Settings },
  { title: "Activity", url: "/docs/admin/project/activity", icon: HistoryIcon },
  { title: "Code Hosting", url: "/docs/admin/project/hosting", icon: Globe },
  { title: "Branches", url: "/docs/admin/project/branches", icon: GitBranch },
  { title: "Analysis Scope", url: "/docs/admin/project/scope", icon: Filter },
  { title: "AI Connections", url: "/docs/admin/project/ai", icon: Cpu },
  { title: "RAG Indexing", url: "/docs/admin/project/rag", icon: Database },
  { title: "Task Management", url: "/docs/admin/project/tasks", icon: Hammer },
  { title: "Danger Zone", url: "/docs/admin/project/danger", icon: AlertTriangle },
];

const ragGuideItems = [
  { title: "Overview", url: "/docs/rag/overview", icon: Brain },
  { title: "Manage on Project", url: "/docs/rag/setup", icon: Settings },
  { title: "Limitations", url: "/docs/rag/limitations", icon: AlertTriangle },
];

const commandItems = [
  { title: "Overview", url: "/docs/commands/overview", icon: MessageSquare },
  { title: "/analyze", url: "/docs/commands/analyze", icon: Terminal },
  { title: "/summarize", url: "/docs/commands/summarize", icon: Terminal },
  { title: "/ask", url: "/docs/commands/ask", icon: Terminal },
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
const capabilitiesItem = { title: "Capabilities", url: "/docs/capabilities", icon: CheckCircle2 };

interface NavItem {
  title: string;
  url?: string;
  icon: React.ElementType;
  isGroup?: boolean;
  items?: NavItem[];
}

interface NavSectionProps {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
  collapsed: boolean;
  defaultOpen?: boolean;
}

function NavItem({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const location = useLocation();
  const isAnyChildActive = item.isGroup && item.items?.some(subItem => subItem.url === location.pathname);
  const [isOpen, setIsOpen] = useState(isAnyChildActive || false);

  useEffect(() => {
    if (isAnyChildActive) {
      setIsOpen(true);
    }
  }, [isAnyChildActive]);

  if (item.isGroup && item.items) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger className="flex items-center w-full px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted/50 transition-colors group">
          <item.icon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
          <span className="flex-1 text-left text-muted-foreground group-hover:text-foreground">{item.title}</span>
          <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-0.5">
          <div className="ml-2 pl-3 border-l border-border/50 space-y-0.5">
            {item.items.map((subItem) => (
              <NavItem key={subItem.url || subItem.title} item={subItem} depth={depth + 1} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <NavLink
      to={item.url || "#"}
      end
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        } ${depth > 0 ? "text-xs" : ""}`
      }
    >
      <item.icon className={depth > 0 ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span>{item.title}</span>
    </NavLink>
  );
}

function NavSection({ title, icon: Icon, items, collapsed, defaultOpen = false }: NavSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

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
        <div className="ml-3 pl-1 space-y-0.5">
          {items.map((item) => (
            <NavItem key={item.url || item.title} item={item} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DocsSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
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
          <SidebarGroupContent className="grow">
            <div className="space-y-2">
              {/* Product Capabilities - High-level Link */}
              {!collapsed ? (
                <NavLink
                  to={capabilitiesItem.url}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/80 hover:bg-muted/50"
                    }`
                  }
                >
                  <capabilitiesItem.icon className="h-4 w-4" />
                  <span>{capabilitiesItem.title}</span>
                </NavLink>
              ) : (
                <div className="flex items-center justify-center p-2">
                  <NavLink to={capabilitiesItem.url}>
                    <capabilitiesItem.icon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                  </NavLink>
                </div>
              )}

              {/* Getting Started Section */}
              <NavSection
                title="Getting Started"
                icon={BookOpen}
                items={gettingStartedItems}
                collapsed={collapsed}
                defaultOpen={true}
              />

              {/* Project Administration Section */}
              <NavSection
                title="Project Administration"
                icon={LayoutDashboard}
                items={projectAdminItems}
                collapsed={collapsed}
                defaultOpen={false}
              />

              {/* Workspace Administration Section */}
              <NavSection
                title="Workspace Administration"
                icon={Settings}
                items={adminItems}
                collapsed={collapsed}
                defaultOpen={false}
              />

              {/* Interactive Commands Section */}
              <NavSection
                title="Interactive Commands"
                icon={MessageSquare}
                items={commandItems}
                collapsed={collapsed}
                defaultOpen={false}
              />

              <NavSection
                title="RAG Guide"
                icon={Brain}
                items={ragGuideItems}
                collapsed={collapsed}
                defaultOpen={false}
              />

              {/* FAQ - Single item */}
              {!collapsed ? (
                <NavLink
                  to={faqItem.url}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
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
          <SidebarGroupContent>
            {/* Developer Docs Section */}
            <NavSection
              title="Developer Docs"
              icon={Code2}
              items={developerDocsItems}
              collapsed={collapsed}
              defaultOpen={false}
            />
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
