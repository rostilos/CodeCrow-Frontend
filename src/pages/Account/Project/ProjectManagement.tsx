import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Settings, GitBranch, Zap, Trash2, Info, Search, FolderKanban, ArrowRight, Download, Calendar, AlertTriangle, CheckCircle, Clock, Activity, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { projectService } from "@/api_service/project/projectService.ts";
import { bitbucketCloudService } from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.ts";
import { useWorkspace } from "@/context/WorkspaceContext";
import ProjectStats, { ProjectStatsData } from "@/components/ProjectStats";
import { usePermissions } from "@/hooks/usePermissions";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";

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
  defaultBranch: string | null;
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

export default function ProjectSettings() {
  const navigate = useNavigate();
  const routes = useWorkspaceRoutes();
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

  const loadData = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      let projList, bbConnections;
      if (canManageWorkspace) {
        projList = await projectService.listProjects(currentWorkspace.slug)
      } else {
        [projList, bbConnections] = await Promise.all([
          projectService.listProjects(currentWorkspace.slug),
          bitbucketCloudService.getUserConnections(currentWorkspace.slug).catch(() => [])
        ]);
      }


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
    navigate(routes.projectSettings(namespace));
  };

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
        <div className="px-4 lg:px-6 container py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">Projects</h1>
              <p className="text-sm text-muted-foreground">
                Manage your projects and their configurations
              </p>
            </div>
            {canManageWorkspace() && (
              <div className="flex gap-2">
                {/* Add Project - unified flow */}
                <Button onClick={() => navigate(routes.projectImport())}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container p-4 lg:p-6">
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
                    <Button onClick={() => navigate(routes.projectNew())}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Project
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {projects
                  .filter((project) =>
                    project.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
                  )
                  .map((project) => {
                    const stats = projectStats[project.id];
                    const hasIssues = stats && stats.totalIssues > 0;
                    const isConfigured = project.vcsConnectionId && project.aiConnectionId;

                    return (
                      <Card
                        key={project.id}
                        className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/30 flex flex-col"
                        onClick={() => navigate(routes.projectDetail(project.namespace || project.id))}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors truncate">
                                  {project.name}
                                </CardTitle>
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                              </div>
                              {project.description && (
                                <CardDescription className="mt-1 text-xs line-clamp-1">
                                  {project.description}
                                </CardDescription>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {canManageWorkspace() && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleProjectSettings(project.namespace || String(project.id))}
                                >
                                  <Settings className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3 flex-1 flex flex-col">
                          {/* Repository Info */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                            <GitBranch className="h-3 w-3 shrink-0" />
                            <span className="truncate">{getRepositoryInfo(project.projectVcsWorkspace, project.projectRepoSlug)}</span>
                            {project.defaultBranch && (
                              <>
                                <span className="text-border">•</span>
                                <span className="truncate">{project.defaultBranch}</span>
                              </>
                            )}
                          </div>

                          {/* Status Badges */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {project.vcsConnectionId ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-green-500/10 text-green-600 border-green-200 dark:border-green-800">
                                <CheckCircle className="h-2.5 w-2.5 mr-1" />
                                VCS
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-muted text-muted-foreground">
                                <Clock className="h-2.5 w-2.5 mr-1" />
                                VCS
                              </Badge>
                            )}
                            {project.aiConnectionId ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800">
                                <Zap className="h-2.5 w-2.5 mr-1" />
                                AI
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-muted text-muted-foreground">
                                <Clock className="h-2.5 w-2.5 mr-1" />
                                AI
                              </Badge>
                            )}
                            {project.isActive !== false && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800">
                                <Activity className="h-2.5 w-2.5 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>

                          {/* Analysis Stats or Empty State */}
                          <div className="mt-auto">
                            {stats ? (
                              <div className="grid grid-cols-4 gap-2 p-2 rounded-lg bg-muted/40">
                                <div className="text-center">
                                  <div className="text-sm font-semibold">{stats.totalIssues}</div>
                                  <div className="text-[10px] text-muted-foreground">Total</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-semibold text-red-500">{stats.highIssues}</div>
                                  <div className="text-[10px] text-muted-foreground">High</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-semibold text-yellow-500">{stats.mediumIssues}</div>
                                  <div className="text-[10px] text-muted-foreground">Medium</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-semibold text-blue-500">{stats.lowIssues}</div>
                                  <div className="text-[10px] text-muted-foreground">Low</div>
                                </div>
                              </div>
                            ) : !isConfigured ? (
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-xs">Setup required</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 text-muted-foreground">
                                <Info className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-xs">Awaiting first analysis</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
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
