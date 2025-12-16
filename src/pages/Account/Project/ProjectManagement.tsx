import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Settings, GitBranch, Zap, Trash2, Info, Search, FolderKanban, ArrowRight, Download, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast.ts";
import { projectService } from "@/api_service/project/projectService.ts";
import { bitbucketCloudService } from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.ts";
import { integrationService } from "@/api_service/integration/integrationService.ts";
import { VcsConnection, VcsConnectionType, PROVIDERS } from "@/api_service/integration/integration.interface.ts";
import { useWorkspace } from "@/context/WorkspaceContext";
import ProjectStats, { ProjectStatsData } from "@/components/ProjectStats";
import { usePermissions } from "@/hooks/usePermissions";

interface Project {
  id: string;
  name: string;
  description: string;
  namespace?: string;
  vcsConnectionId?: number;
  aiConnectionId?: number;
  projectVcsWorkspace?: string;
  projectRepoSlug?: string;
  isActive?: boolean;
  createdAt: string;
  defaultBranch: string|null;
  defaultBranchStats?: {
    branchName: string;
    totalIssues: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
    resolvedCount: number;
  };
}

interface CodeHostingConfig {
  id: string | number;
  name: string;
  provider: string;
  repository?: string;
}

interface TaskManagementConfig {
  id: string;
  name: string;
  provider: string;
  workspace: string;
}

// Bitbucket logo SVG component
function BitbucketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z"/>
    </svg>
  );
}

export default function ProjectSettings() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [codeHostingConfigs, setCodeHostingConfigs] = useState<CodeHostingConfig[]>([]);
  const [taskManagementConfigs, setTaskManagementConfigs] = useState<TaskManagementConfig[]>([]);
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStatsData>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    vcsConnectionId: "",
    aiConnectionId: ""
  });
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const { canManageWorkspace } = usePermissions();
  
  // VCS connections grouped by provider for import dropdown
  const [vcsConnections, setVcsConnections] = useState<VcsConnection[]>([]);

  const loadData = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      let projList, bbConnections;
      if(canManageWorkspace) {
          projList = await projectService.listProjects(currentWorkspace.slug)
      } else {
          [projList, bbConnections] = await Promise.all([
              projectService.listProjects(currentWorkspace.slug),
              bitbucketCloudService.getUserConnections(currentWorkspace.slug).catch(() => [])
          ]);
      }
      
      // Also fetch all VCS connections for the import dropdown
      const allVcsConnections = await integrationService.getAllConnections(currentWorkspace.slug).catch(() => []);
      setVcsConnections(allVcsConnections);


      const mappedProjects: Project[] = (projList || []).map((p: any) => ({
        id: String(p.id),
        name: p.name,
        description: p.description || "",
        namespace: p.namespace || "",
        vcsConnectionId: p.vcsConnectionId,
        aiConnectionId: p.aiConnectionId,
        projectVcsWorkspace: p.projectVcsWorkspace,
        projectRepoSlug: p.projectRepoSlug,
        isActive: p.isActive,
        createdAt: p.createdAt ? String(p.createdAt) : "",
        defaultBranchStats: p.defaultBranchStats,
        defaultBranch: p.defaultBranch,
      }));

      setProjects(mappedProjects);

      const mappedConnections: CodeHostingConfig[] = (bbConnections || []).map((c: any) => ({
        id: c.id,
        name: c.name || `Connection ${c.id}`,
        provider: "Bitbucket",
        repository: c.repository || ""
      }));

      setCodeHostingConfigs(mappedConnections);
      // Task management not implemented yet
      setTaskManagementConfigs([]);

      // Map default branch stats to project stats format
      const statsMap: Record<string, ProjectStatsData> = {};
      mappedProjects.forEach((project) => {
        if (project.defaultBranchStats) {
          statsMap[project.id] = {
            totalIssues: project.defaultBranchStats.totalIssues,
            highIssues: project.defaultBranchStats.highSeverityCount,
            mediumIssues: project.defaultBranchStats.mediumSeverityCount,
            lowIssues: project.defaultBranchStats.lowSeverityCount,
          };
        }
      });
      setProjectStats(statsMap);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentWorkspace]);

  const handleCreateProject = async () => {
    if (!newProject.name) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const payload: any = {
        name: newProject.name,
        description: newProject.description,
        creationMode: "MANUAL"
      };

      if (newProject.vcsConnectionId) {
        // API expects a numeric connectionId for VCS connections
        const parsed = Number(newProject.vcsConnectionId);
        if (!isNaN(parsed)) {
          payload.connectionId = parsed;
        }
      }

      await projectService.createProject(currentWorkspace!.slug, payload);
      toast({
        title: "Success",
        description: "Project created successfully"
      });
      setNewProject({ name: "", description: "", vcsConnectionId: "", aiConnectionId: "" });
      setIsCreateDialogOpen(false);
      await loadData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to create project",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProject = async (namespace: string) => {
    try {
      await projectService.deleteProject(currentWorkspace!.slug, namespace);
      toast({
        title: "Success",
        description: "Project deleted successfully"
      });
      setProjects(prev => prev.filter(p => p.namespace !== namespace));
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  const getDefaultBranchName = (name?: string) => {
    if (!name) return "Not configured";
    return name;
  };

  const getRepositoryInfo = (workspace?: string, slug?: string) => {
    if (!workspace || !slug) return "No repository";
    return `${workspace}/${slug}`;
  };

  const getAiConnectionStatus = (id?: number) => {
    return id ? "Active" : "Not configured";
  };

  const handleProjectSettings = (namespace: string) => {
    navigate(`/dashboard/projects/${namespace}/settings`);
  };
  
  const handleImportFromConnection = (connection: VcsConnection) => {
    // Use the step-by-step import flow for all connection types
    // This provides proper project naming, AI selection, and analysis configuration
    navigate(`/dashboard/projects/import?connectionId=${connection.id}&provider=${connection.provider}&connectionType=${connection.connectionType}`);
  };
  
  // Group connections by provider
  const connectionsByProvider = vcsConnections.reduce((acc, conn) => {
    if (!acc[conn.provider]) {
      acc[conn.provider] = [];
    }
    acc[conn.provider].push(conn);
    return acc;
  }, {} as Record<string, VcsConnection[]>);

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted/50 rounded-lg w-1/4 animate-pulse"></div>
          <div className="h-4 bg-muted/50 rounded w-1/2 animate-pulse"></div>
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-muted/50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">Projects</h1>
              <p className="text-sm text-muted-foreground">
                Manage your projects and their configurations
              </p>
            </div>
            <div className="flex gap-2">
              {/* Import Project Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Import Project
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {Object.keys(connectionsByProvider).length === 0 ? (
                    <>
                      <DropdownMenuLabel className="text-muted-foreground font-normal">
                        No VCS connections configured
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/dashboard/hosting')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add VCS Connection
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      {Object.entries(connectionsByProvider).map(([provider, connections]) => (
                        <div key={provider}>
                          <DropdownMenuLabel className="flex items-center gap-2">
                            {provider === 'bitbucket-cloud' && <BitbucketIcon className="h-4 w-4" />}
                            {PROVIDERS.find(p => p.id === provider)?.name || provider}
                          </DropdownMenuLabel>
                          {connections.map((conn) => (
                            <DropdownMenuItem
                              key={conn.id}
                              onClick={() => handleImportFromConnection(conn)}
                              className="pl-6"
                            >
                              <div className="flex flex-col">
                                <span>{conn.connectionName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {conn.connectionType === 'APP' ? 'App Installation' : 'OAuth'} • {conn.repoCount} repos
                                </span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                        </div>
                      ))}
                      <DropdownMenuItem onClick={() => navigate('/dashboard/hosting')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Connection
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* New Project Button */}
              <Button onClick={() => navigate('/dashboard/projects/new')}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 lg:p-6">
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="list">Project List</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={projectSearchQuery}
                onChange={(e) => setProjectSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* Projects Grid */}
            {projects.filter((project) =>
              project.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
            ).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted mb-4">
                    <FolderKanban className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No projects found</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    {projectSearchQuery ? "No projects match your search." : "Get started by creating your first project."}
                  </p>
                  {!projectSearchQuery && (
                    <Button onClick={() => navigate('/dashboard/projects/new')}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Project
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {projects
                  .filter((project) =>
                    project.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
                  )
                  .map((project) => (
                  <Card 
                    key={project.id} 
                    className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20"
                    onClick={() => navigate(`/dashboard/projects/${project.namespace || project.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                              {project.name}
                            </CardTitle>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                          </div>
                          <CardDescription className="mt-1.5 text-sm line-clamp-1">
                            {project.description || "No description provided"}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/dashboard/projects/${project.namespace || project.id}`)}
                            className="hidden sm:flex"
                          >
                            View Details
                          </Button>
                          {canManageWorkspace() && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleProjectSettings(project.namespace || String(project.id))}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <div className="space-y-3">
                        {/* Project Stats */}
                        {projectStats[project.id] ? (
                          <ProjectStats stats={projectStats[project.id]} compact={true} />
                        ) : (
                          <div className="h-6 bg-muted/50 rounded w-32 animate-pulse"></div>
                        )}

                        {/* Empty state for new projects with no analysis yet */}
                        {!project.defaultBranchStats && (
                          <Alert className="bg-muted/30 border-muted py-3">
                            <Info className="h-4 w-4" />
                            <AlertTitle className="text-sm font-medium">No analysis yet</AlertTitle>
                            <AlertDescription className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground">Results will appear after first analysis.</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/projects/${project.namespace || project.id}/setup`);
                                }}
                              >
                                Setup
                              </Button>
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Quick Info */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
                          <div className="flex items-center gap-1.5">
                            <GitBranch className="h-3.5 w-3.5" />
                            <span className="truncate">{getRepositoryInfo(project.projectVcsWorkspace, project.projectRepoSlug)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <GitBranch className="h-3.5 w-3.5" />
                            <span className="truncate">{project.defaultBranch ?? "Default branch not configured"}</span>
                          </div>
                          {project.aiConnectionId && (
                            <div className="flex items-center gap-1.5">
                              <Zap className="h-3.5 w-3.5 text-primary" />
                              <span>AI Enabled</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FolderKanban className="h-4 w-4" />
                    Total Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{projects.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    VCS Connected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{projects.filter(p => p.vcsConnectionId).length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {projects.length} projects
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    AI Enabled
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{projects.filter(p => p.aiConnectionId).length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {projects.length} projects
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
