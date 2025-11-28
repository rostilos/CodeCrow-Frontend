import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

import {
    BookOpen,
    Briefcase,
    GitBranch,
    Sparkles,
    FolderGit2,
    Key,
    Workflow,
    GitPullRequest, 
    Code,
    HelpCircle,
} from "lucide-react";

const gettingStartedItems = [
  {
    title: "Overview",
    url: "/docs",
    icon: BookOpen,
  },
  {
    title: "Create Workspace",
    url: "/docs/workspace",
    icon: Briefcase,
  },
  {
    title: "Create VCS Connection",
    url: "/docs/vcs-connection",
    icon: GitBranch,
  },
  {
    title: "Create AI Connection",
    url: "/docs/ai-connection",
    icon: Sparkles,
  },
  {
    title: "Create Your First Project",
    url: "/docs/first-project",
    icon: FolderGit2,
  },
  {
    title: "Generate Project Token",
    url: "/docs/project-token",
    icon: Key,
  },
  {
    title: "Setup Bitbucket Pipelines",
    url: "/docs/bitbucket-pipelines",
    icon: Workflow,
  },
  {
    title: "Create Pull Request",
    url: "/docs/pull-request",
    icon: GitPullRequest,
  },
];

const qaItem = {
  title: "Q&A",
  url: "/docs/faq",
  icon: HelpCircle,
};

export function DocsSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = state === "collapsed";

  // Check if any getting started route is active
  const isGettingStartedActive = gettingStartedItems.some(
    (item) => location.pathname === item.url
  );

  const getNavClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-primary text-primary-foreground shadow-primary"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  const getSubNavClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center w-full pl-8 pr-3 py-2 text-sm rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {/* Getting Started Section */}
              <Collapsible defaultOpen={true} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="w-full px-3 py-2 text-sm font-semibold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                      {!collapsed && (
                        <>
                          <BookOpen className="h-5 w-5 mr-3" />
                          <span className="flex-1 text-left">Getting Started</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                      {collapsed && <BookOpen className="h-5 w-5 mx-auto" />}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  
                  {!collapsed && (
                    <CollapsibleContent>
                      <SidebarMenuSub className="ml-0 border-l-2 border-sidebar-border pl-0 mt-1">
                        {gettingStartedItems.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={item.url}
                                end
                                className={({ isActive }) => getSubNavClasses({ isActive })}
                              >
                                <item.icon className="h-4 w-4 mr-2" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>

              {/* Q&A Section */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={qaItem.url}
                    className={({ isActive }) => getNavClasses({ isActive })}
                  >
                    <qaItem.icon className={`h-5 w-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
                    {!collapsed && <span>{qaItem.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
