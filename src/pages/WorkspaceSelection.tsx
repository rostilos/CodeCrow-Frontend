import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Building,
  Users,
  Calendar,
  ArrowRight,
  BookOpen,
  FolderGit2,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  workspaceService,
  CreateWorkspaceRequest,
} from "@/api_service/workspace/workspaceService";
import {
  projectService,
  ProjectDTO,
} from "@/api_service/project/projectService";
import { useToast } from "@/hooks/use-toast";
import { TopNavigation } from "@/components/TopNavigation";
import { ROUTES } from "@/lib/routes";
import { CROSS_LINKS } from "@/lib/domains";
import { authUtils } from "@/lib/auth";

interface RecentProject extends ProjectDTO {
  workspaceSlug: string;
  workspaceName: string;
}

export default function WorkspaceSelection() {
  const navigate = useNavigate();
  const { workspaces, setCurrentWorkspace, refreshWorkspaces, loading } =
    useWorkspace();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState<CreateWorkspaceRequest>({
    slug: "",
    name: "",
    description: "",
  });
  const [slugError, setSlugError] = useState<string>("");

  const user = authUtils.getUser();

  const userInitials = useMemo(() => {
    if (!user) return "?";
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return (user.username || user.email || "?")[0].toUpperCase();
  }, [user]);

  // Fetch recent projects across all workspaces
  useEffect(() => {
    if (workspaces.length === 0) return;

    let cancelled = false;
    setProjectsLoading(true);

    const fetchProjects = async () => {
      try {
        const allProjects: RecentProject[] = [];
        // Fetch projects from each workspace (in parallel)
        const results = await Promise.allSettled(
          workspaces.map(async (ws) => {
            const projects = await projectService.listProjects(ws.slug);
            return projects.map((p) => ({
              ...p,
              workspaceSlug: ws.slug,
              workspaceName: ws.name,
            }));
          }),
        );
        for (const result of results) {
          if (result.status === "fulfilled") {
            allProjects.push(...result.value);
          }
        }
        // Sort by createdAt descending, take top 5
        allProjects.sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
        if (!cancelled) {
          setRecentProjects(allProjects.slice(0, 5));
        }
      } catch {
        // Silently fail — recent projects are non-critical
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    };

    fetchProjects();
    return () => {
      cancelled = true;
    };
  }, [workspaces]);

  const handleSelectWorkspace = (workspace: any) => {
    setCurrentWorkspace(workspace);
    navigate(ROUTES.PROJECTS(workspace.slug));
  };

  const handleOpenProject = (project: RecentProject) => {
    const ws = workspaces.find((w) => w.slug === project.workspaceSlug);
    if (ws) setCurrentWorkspace(ws);
    navigate(
      `/dashboard/${project.workspaceSlug}/projects/${project.namespace}`,
    );
  };

  const validateSlug = (slug: string): boolean => {
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slug.trim()) {
      setSlugError("Workspace slug is required");
      return false;
    }
    if (slug.length < 3 || slug.length > 64) {
      setSlugError("Slug must be between 3 and 64 characters");
      return false;
    }
    if (!slugPattern.test(slug)) {
      setSlugError(
        "Slug must contain only lowercase letters, numbers, and hyphens",
      );
      return false;
    }
    setSlugError("");
    return true;
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.slug.trim() || !validateSlug(newWorkspace.slug)) {
      toast({
        title: "Validation Error",
        description: slugError || "Workspace slug is required",
        variant: "destructive",
      });
      return;
    }
    if (!newWorkspace.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Workspace name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreateLoading(true);
      const created = await workspaceService.createWorkspace(newWorkspace);
      await refreshWorkspaces();
      setCurrentWorkspace(created);
      setShowCreateDialog(false);
      setNewWorkspace({ slug: "", name: "", description: "" });
      setSlugError("");
      toast({
        title: "Success",
        description: "Workspace created successfully",
      });
      navigate(ROUTES.PROJECTS(created.slug));
    } catch (error: any) {
      toast({
        title: "Failed to create workspace",
        description: error.message || "Could not create workspace",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  // Shared Create Workspace Dialog content
  const createWorkspaceDialogContent = (idSuffix: string = "") => (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create New Workspace</DialogTitle>
        <DialogDescription>
          Set up a workspace for your team and projects
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor={`workspace-slug${idSuffix}`}>Workspace Slug</Label>
          <Input
            id={`workspace-slug${idSuffix}`}
            value={newWorkspace.slug}
            onChange={(e) => {
              setNewWorkspace({
                ...newWorkspace,
                slug: e.target.value.toLowerCase(),
              });
              if (e.target.value) validateSlug(e.target.value.toLowerCase());
            }}
            placeholder="my-workspace"
            className={slugError ? "border-destructive" : ""}
          />
          {slugError && <p className="text-sm text-destructive">{slugError}</p>}
          <p className="text-xs text-muted-foreground">
            Lowercase letters, numbers, and hyphens only (3-64 chars)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`workspace-name${idSuffix}`}>Workspace Name</Label>
          <Input
            id={`workspace-name${idSuffix}`}
            value={newWorkspace.name}
            onChange={(e) =>
              setNewWorkspace({ ...newWorkspace, name: e.target.value })
            }
            placeholder="My Workspace"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`workspace-description${idSuffix}`}>
            Description (Optional)
          </Label>
          <Textarea
            id={`workspace-description${idSuffix}`}
            value={newWorkspace.description}
            onChange={(e) =>
              setNewWorkspace({ ...newWorkspace, description: e.target.value })
            }
            placeholder="What is this workspace for?"
            rows={3}
          />
        </div>
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setShowCreateDialog(false)}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateWorkspace}
          disabled={createLoading}
          className="flex-1"
        >
          {createLoading ? "Creating..." : "Create"}
        </Button>
      </div>
    </DialogContent>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  const totalProjects = recentProjects.length;
  const totalMembers = workspaces.reduce(
    (sum, ws) => sum + (ws.membersCount ?? ws.members?.length ?? 0),
    0,
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header — same TopNavigation as workspace dashboard, but in minimal mode */}
      <TopNavigation minimal />

      {/* Main Content */}
      <div className="container px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* ─── Welcome Section ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarImage src={user?.avatarUrl} alt={user?.name || "User"} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-muted-foreground mt-1">
                {user?.email || "Manage your workspaces and projects"}
              </p>
            </div>
          </div>

          {/* ─── Quick Stats ─── */}
          {workspaces.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-muted/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{workspaces.length}</p>
                    <p className="text-xs text-muted-foreground">
                      Workspace{workspaces.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <FolderGit2 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {projectsLoading ? "…" : totalProjects}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Project{totalProjects !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalMembers}</p>
                    <p className="text-xs text-muted-foreground">
                      Member{totalMembers !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Workspaces Section ─── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  Your Workspaces
                </h2>
              </div>
              <Dialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Workspace
                  </Button>
                </DialogTrigger>
                {createWorkspaceDialogContent()}
              </Dialog>
            </div>

            {workspaces.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted mb-6">
                    <Building className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    No Workspaces Yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Get started by creating your first workspace
                  </p>
                  <Dialog
                    open={showCreateDialog}
                    onOpenChange={setShowCreateDialog}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Workspace
                      </Button>
                    </DialogTrigger>
                    {createWorkspaceDialogContent("-empty")}
                  </Dialog>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces.map((workspace) => (
                  <Card
                    key={workspace.id}
                    className="group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => handleSelectWorkspace(workspace)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-semibold truncate group-hover:text-primary transition-colors">
                            {workspace.name}
                          </CardTitle>
                          <CardDescription className="mt-1 line-clamp-2 text-sm">
                            {workspace.description || "No description"}
                          </CardDescription>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>
                            {workspace.membersCount ??
                              workspace.members?.length ??
                              0}{" "}
                            members
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {workspace.createdAt
                              ? new Date(
                                  workspace.createdAt,
                                ).toLocaleDateString()
                              : "Recently"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* ─── Recent Projects ─── */}
          {workspaces.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Recent Projects
              </h2>

              {projectsLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="text-sm">Loading projects…</span>
                    </div>
                  </CardContent>
                </Card>
              ) : recentProjects.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <FolderGit2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No projects yet. Open a workspace and create your first
                      project.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0 divide-y divide-border">
                    {recentProjects.map((project) => (
                      <button
                        key={`${project.workspaceSlug}-${project.id}`}
                        onClick={() => handleOpenProject(project)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left group"
                      >
                        <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                          <FolderGit2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                              {project.name}
                            </span>
                            {project.defaultBranchStats &&
                              project.defaultBranchStats.totalIssues > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 h-5 shrink-0"
                                >
                                  {project.defaultBranchStats
                                    .highSeverityCount > 0 && (
                                    <AlertTriangle className="h-3 w-3 text-orange-500 mr-1" />
                                  )}
                                  {project.defaultBranchStats.totalIssues} issue
                                  {project.defaultBranchStats.totalIssues !== 1
                                    ? "s"
                                    : ""}
                                </Badge>
                              )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground truncate">
                              {project.workspaceName}
                            </span>
                            {project.mainBranch && (
                              <>
                                <span className="text-muted-foreground/40">
                                  ·
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <GitBranch className="h-3 w-3" />
                                  {project.mainBranch}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                          {project.createdAt
                            ? new Date(project.createdAt).toLocaleDateString()
                            : ""}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </section>
          )}

          {/* ─── Quick Actions ─── */}
          <section>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              Quick Actions
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card
                className="group hover:shadow-md hover:border-blue-500/30 transition-all cursor-pointer"
                onClick={() => window.open(CROSS_LINKS.docs, "_blank")}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm group-hover:text-blue-500 transition-colors flex items-center gap-1">
                      Documentation
                      <ExternalLink className="h-3 w-3" />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Guides, setup & API reference
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="group hover:shadow-md hover:border-emerald-500/30 transition-all cursor-pointer"
                onClick={() =>
                  window.open(`${CROSS_LINKS.docs}/getting-started`, "_blank")
                }
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm group-hover:text-emerald-500 transition-colors flex items-center gap-1">
                      Getting Started
                      <ExternalLink className="h-3 w-3" />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Setup your first code review
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
