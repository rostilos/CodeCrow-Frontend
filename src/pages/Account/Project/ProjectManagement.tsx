import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Settings, GitBranch, Zap, Trash2, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { projectService } from "@/api_service/project/projectService.ts";
import { bitbucketCloudService } from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.ts";
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and their configurations
          </p>
        </div>

          <Button onClick={() => navigate('/dashboard/projects/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Project List</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Project Search */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search projects by name..."
              value={projectSearchQuery}
              onChange={(e) => setProjectSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid gap-4">
            {projects
              .filter((project) =>
                project.name.toLowerCase().includes(projectSearchQuery.toLowerCase())
              )
              .map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/dashboard/projects/${project.namespace || project.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="mt-1 text-sm line-clamp-1">
                        {project.description || "No description provided"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/projects/${project.namespace || project.id}`)}
                      >
                        View Details
                      </Button>
                      {canManageWorkspace() && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProjectSettings(project.namespace || String(project.id))}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProject(project.namespace || String(project.id))}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="space-y-2">
                    {/* Project Stats */}
                    {projectStats[project.id] ? (
                      <ProjectStats stats={projectStats[project.id]} compact={true} />
                    ) : (
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="animate-pulse h-4 bg-muted rounded w-32"></div>
                      </div>
                    )}

                    {/* Empty state for new projects with no analysis yet */}
                    {!project.defaultBranchStats && (
                      <Alert className="bg-muted/30 py-2">
                        <Info className="h-4 w-4" />
                        <AlertTitle className="text-sm">No analysis yet</AlertTitle>
                        <AlertDescription className="flex items-center justify-between">
                          <span className="text-xs">Results will appear after first analysis.</span>
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

                    {/* Quick Actions */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-2">
                      <div className="flex items-center gap-1">
                        <GitBranch className="h-3.5 w-3.5" />
                        <span className="truncate">{getRepositoryInfo(project.projectVcsWorkspace, project.projectRepoSlug)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                          <GitBranch className="h-3.5 w-3.5" />
                          <span className="truncate">{project.defaultBranch ?? "Default branch is not configured."}</span>
                      </div>
                      {project.aiConnectionId && (
                        <div className="flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5" />
                          <span>{project.aiConnectionId ? "AI Enabled" : "AI connection is not configured"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Total Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <GitBranch className="mr-2 h-5 w-5" />
                  Code Hosting Configs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{codeHostingConfigs.length}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {projects.filter(p => p.vcsConnectionId).length} projects connected
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  AI Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.filter(p => p.aiConnectionId).length}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {projects.filter(p => p.aiConnectionId).length} projects with AI
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
