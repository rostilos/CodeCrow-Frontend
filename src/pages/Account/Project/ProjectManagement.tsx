import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Settings, GitBranch, Zap, Trash2, Info, Search, FolderKanban, ArrowRight, Download, Calendar, AlertTriangle, CheckCircle, Clock, Activity, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
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
  projectVcsRepoSlug?: string;
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const { canManageWorkspace } = usePermissions();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(projectSearchQuery);
      setCurrentPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [projectSearchQuery]);

  const loadData = async () => {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      let bbConnections;
      // Load paginated projects with server-side search
      const projectsResponse = await projectService.listProjectsPaginated(
        currentWorkspace.slug,
        { search: debouncedSearch, page: currentPage, size: pageSize }
      );

      if (!canManageWorkspace) {
        bbConnections = await bitbucketCloudService.getUserConnections(currentWorkspace.slug).catch(() => []);
      }

      const projList = projectsResponse.projects || [];
      setTotalElements(projectsResponse.totalElements);
      setTotalPages(projectsResponse.totalPages);

      const mappedProjects: Project[] = projList.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        description: p.description || "",
        namespace: p.namespace || "",
        vcsConnectionId: p.vcsConnectionId,
        aiConnectionId: p.aiConnectionId,
        projectVcsWorkspace: p.projectVcsWorkspace,
        projectVcsRepoSlug: p.projectVcsRepoSlug,
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
  }, [currentWorkspace, debouncedSearch, currentPage, pageSize]);

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

  const getRepositoryInfo = (workspace?: string, slug?: string) => {
    if (!workspace || !slug) return "No repository";
    return `${workspace}/${slug}`;
  };

  const handleProjectSettings = (namespace: string) => {
    navigate(routes.projectSettings(namespace));
  };

  if (loading && projects.length === 0) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted/50 rounded-lg w-1/4 animate-pulse"></div>
          <div className="h-4 bg-muted/50 rounded w-1/2 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-muted/50 rounded-xl animate-pulse"></div>
            <div className="h-32 bg-muted/50 rounded-xl animate-pulse"></div>
            <div className="h-32 bg-muted/50 rounded-xl animate-pulse"></div>
          </div>
          <div className="h-10 bg-muted/50 rounded-lg w-full max-w-md animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-40 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Wrapper */}
      <div className="relative z-10 w-full">
        {/* Page Header */}
        <div className="w-full bg-background/40 backdrop-blur-xl border-b border-border/40 shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-inner">
                  <FolderKanban className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    Projects
                  </h1>
                  <p className="text-base text-muted-foreground font-medium mt-1">
                    Manage your workspace projects and overview quality metrics
                  </p>
                </div>
              </div>
              {canManageWorkspace() && (
                <div className="flex gap-4">
                  <Button size="lg" onClick={() => navigate(routes.projectImport())} className="shadow-md hover:shadow-lg transition-all animate-in fade-in slide-in-from-right-4">
                    <Plus className="mr-2 h-5 w-5" />
                    New Project
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-10">
          <div className="space-y-6">
            {/* Search Bar and Page Size */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card/40 backdrop-blur-xl p-4 rounded-2xl border border-border/50 shadow-sm animate-in fade-in duration-700">
              <div className="relative max-w-md flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-background/80 hover:bg-background border-border/60 focus-visible:ring-primary/40 rounded-xl transition-colors text-base"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(0);
                  }}
                  className="h-12 px-4 py-2 rounded-xl border border-border/60 bg-background/80 hover:bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
              <Card className="border-dashed border-2 bg-transparent shadow-none animate-in fade-in duration-500">
                <CardContent className="py-20 text-center flex flex-col items-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/5 ring-1 ring-primary/10 mb-6">
                    <FolderKanban className="h-10 w-10 text-primary/60" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">No projects found</h3>
                  <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                    {projectSearchQuery ? "No projects match your search criteria." : "Get started by creating your first project in this workspace."}
                  </p>
                  {!projectSearchQuery && (
                    <Button onClick={() => navigate(routes.projectNew())} size="lg" className="shadow-md px-8">
                      <Plus className="mr-2 h-5 w-5" />
                      New Project
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {projects.map((project, index) => {
                  const stats = projectStats[project.id];
                  const hasIssues = stats && stats.totalIssues > 0;
                  const isConfigured = project.vcsConnectionId && project.aiConnectionId;

                  return (
                    <Card
                      key={project.id}
                      className="group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 border-border/50 hover:border-primary/40 flex flex-col bg-card/60 backdrop-blur-xl overflow-hidden relative animate-in fade-in slide-in-from-bottom-8"
                      style={{ animationFillMode: "both", animationDelay: `${index * 50}ms` }}
                      onClick={() => navigate(routes.projectDetail(project.namespace || project.id))}
                    >
                      {/* Top glow border */}
                      <div className={`absolute top-0 left-0 w-full h-1 transition-all duration-500 ${stats && stats.highIssues > 0
                        ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500 opacity-80 group-hover:opacity-100 bg-[length:200%_auto] group-hover:animate-pulse'
                        : stats && stats.totalIssues > 0
                          ? 'bg-gradient-to-r from-yellow-500 via-green-500 to-yellow-500 opacity-80 group-hover:opacity-100 bg-[length:200%_auto] group-hover:animate-pulse'
                          : isConfigured
                            ? 'bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-80 group-hover:opacity-100 bg-[length:200%_auto] group-hover:animate-pulse'
                            : 'bg-gradient-to-r from-muted to-muted-foreground/30 opacity-50 group-hover:opacity-80'
                        }`} />

                      <CardHeader className="pb-3 pt-5 px-5 relative z-10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-10 w-10 rounded-xl bg-background/80 shadow-sm ring-1 ring-border flex items-center justify-center shrink-0 group-hover:ring-primary/40 group-hover:bg-primary/10 transition-all duration-300">
                                <FolderKanban className="h-5 w-5 text-primary/80 group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
                              </div>
                              <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors truncate">
                                {project.name}
                              </CardTitle>
                            </div>
                            {project.description && (
                              <CardDescription className="text-xs line-clamp-2 ml-[3.25rem] mt-[-0.25rem] leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                {project.description}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {canManageWorkspace() && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all hover:bg-primary/10 hover:text-primary duration-300"
                                onClick={() => handleProjectSettings(project.namespace || String(project.id))}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 pb-5 px-5 flex-1 flex flex-col gap-4 relative z-10">
                        {/* Repository Info */}
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground px-3 py-2 rounded-lg bg-background/50 border border-border/60 group-hover:border-primary/20 transition-colors">
                          <GitBranch className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                          <span className="truncate font-semibold">{getRepositoryInfo(project.projectVcsWorkspace, project.projectVcsRepoSlug)}</span>
                          {project.defaultBranch && (
                            <>
                              <span className="text-border mx-1">→</span>
                              <span className="truncate text-foreground/80">{project.defaultBranch}</span>
                            </>
                          )}
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-1.5">
                          {project.vcsConnectionId ? (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 font-semibold group-hover:bg-emerald-500/20 transition-colors">
                              <CheckCircle className="h-2.5 w-2.5 mr-1" />
                              VCS Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-muted/80 text-muted-foreground border-muted-foreground/30 font-semibold">
                              <Clock className="h-2.5 w-2.5 mr-1" />
                              VCS Pending
                            </Badge>
                          )}
                          {project.aiConnectionId ? (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-violet-500/10 text-violet-600 border-violet-500/30 dark:text-violet-400 font-semibold group-hover:bg-violet-500/20 transition-colors">
                              <Zap className="h-2.5 w-2.5 mr-1" />
                              AI Enabled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-muted/80 text-muted-foreground border-muted-foreground/30 font-semibold">
                              <Clock className="h-2.5 w-2.5 mr-1" />
                              AI Pending
                            </Badge>
                          )}
                        </div>

                        {/* Analysis Stats or Empty State */}
                        <div className="mt-auto pt-1">
                          {stats ? (
                            <div className="grid grid-cols-4 gap-1.5 px-2 py-3 rounded-lg bg-background/50 border border-border/50 group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
                              <div className="text-center">
                                <div className="text-xl font-extrabold text-foreground">{stats.totalIssues}</div>
                                <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">Total</div>
                              </div>
                              <div className="text-center relative after:content-[''] after:absolute after:left-0 after:top-[20%] after:h-[60%] after:w-px after:bg-border/60">
                                <div className="text-xl font-extrabold text-red-500">{stats.highIssues}</div>
                                <div className="text-[9px] text-red-500/70 font-bold uppercase tracking-wider mt-0.5">High</div>
                              </div>
                              <div className="text-center relative after:content-[''] after:absolute after:left-0 after:top-[20%] after:h-[60%] after:w-px after:bg-border/60">
                                <div className="text-xl font-extrabold text-amber-500">{stats.mediumIssues}</div>
                                <div className="text-[9px] text-amber-500/70 font-bold uppercase tracking-wider mt-0.5">Med</div>
                              </div>
                              <div className="text-center relative after:content-[''] after:absolute after:left-0 after:top-[20%] after:h-[60%] after:w-px after:bg-border/60">
                                <div className="text-xl font-extrabold text-sky-500">{stats.lowIssues}</div>
                                <div className="text-[9px] text-sky-500/70 font-bold uppercase tracking-wider mt-0.5">Low</div>
                              </div>
                            </div>
                          ) : !isConfigured ? (
                            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/15 transition-colors">
                              <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-amber-700 dark:text-amber-300 leading-tight">Setup Required</div>
                                <div className="text-[10px] font-medium text-amber-600/80 dark:text-amber-400/80 mt-0.5">Configure VCS & AI</div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-primary/5 border border-primary/10 group-hover:bg-primary/10 transition-colors">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Activity className="h-4 w-4 text-primary/80" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-foreground/90 leading-tight">Ready for Analysis</div>
                                <div className="text-[10px] font-medium text-muted-foreground mt-0.5">Awaiting first review</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between pt-8 mt-4 gap-4 animate-in fade-in duration-700">
                <div className="text-sm font-semibold text-muted-foreground bg-card/40 backdrop-blur-md px-5 py-2.5 rounded-xl border border-border/50">
                  Showing <span className="text-foreground">{currentPage * pageSize + 1}</span> - <span className="text-foreground">{Math.min((currentPage + 1) * pageSize, totalElements)}</span> of <span className="text-foreground">{totalElements}</span>
                </div>
                <div className="flex items-center gap-2 bg-card/40 backdrop-blur-md p-2 rounded-xl border border-border/50 shadow-sm">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                    className="h-9 px-4 font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    First
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="h-9 px-4 font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    Previous
                  </Button>
                  <div className="text-sm font-bold px-4 py-1.5 bg-background/80 rounded-lg border border-border/60">
                    {currentPage + 1} / {totalPages}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="h-9 px-4 font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    Next
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="h-9 px-4 font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all hover:border-primary/30 group">
              <CardContent className="p-6 flex items-center gap-5">
                <div className="p-4 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors ring-1 ring-primary/20">
                  <FolderKanban className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-extrabold tracking-tight">{totalElements}</div>
                  <p className="text-sm font-semibold text-muted-foreground mt-0.5">Total Projects</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all hover:border-emerald-500/30 group">
              <CardContent className="p-6 flex items-center gap-5">
                <div className="p-4 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors ring-1 ring-emerald-500/20">
                  <GitBranch className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-extrabold tracking-tight">{projects.filter(p => p.vcsConnectionId).length}</div>
                    <p className="text-sm font-medium text-muted-foreground">/ {projects.length}</p>
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground mt-0.5">VCS Connected</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-sm hover:shadow-md transition-all hover:border-violet-500/30 group">
              <CardContent className="p-6 flex items-center gap-5">
                <div className="p-4 rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors ring-1 ring-violet-500/20">
                  <Zap className="h-6 w-6 text-violet-500" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-extrabold tracking-tight">{projects.filter(p => p.aiConnectionId).length}</div>
                    <p className="text-sm font-medium text-muted-foreground">/ {projects.length}</p>
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground mt-0.5">AI Enabled</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
