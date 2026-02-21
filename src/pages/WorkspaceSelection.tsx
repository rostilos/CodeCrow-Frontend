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
  Zap,
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-40 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header — same TopNavigation as workspace dashboard, but in minimal mode */}
      <TopNavigation minimal />

      {/* Main Content */}
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* ─── Welcome Section ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-card/50 backdrop-blur-sm border border-border/50 p-6 sm:p-8 rounded-2xl shadow-sm">
            <div className="flex items-center gap-5">
              <Avatar className="h-16 w-16 border-2 border-background shadow-md ring-2 ring-primary/20">
                <AvatarImage src={user?.avatarUrl} alt={user?.name || "User"} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xl font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                  !
                </h1>
                <p className="text-muted-foreground mt-1.5 text-base">
                  {user?.email || "Manage your workspaces and projects"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Dialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="shadow-md hover:shadow-lg transition-all"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    New Workspace
                  </Button>
                </DialogTrigger>
                {createWorkspaceDialogContent()}
              </Dialog>
            </div>
          </div>

          {/* ─── Quick Stats ─── */}
          {workspaces.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/20 transition-colors shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold tracking-tight">
                      {workspaces.length}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      Workspace{workspaces.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-blue-500/20 transition-colors shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                    <FolderGit2 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold tracking-tight">
                      {projectsLoading ? "…" : totalProjects}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      Project{totalProjects !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-emerald-500/20 transition-colors shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                    <Users className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold tracking-tight">
                      {totalMembers}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      Member{totalMembers !== 1 ? "s" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* ─── Workspaces Section (Left Column, takes 2/3) ─── */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Building className="h-5 w-5 text-primary" />
                  </div>
                  Your Workspaces
                </h2>
              </div>

              {workspaces.length === 0 ? (
                <Card className="border-dashed border-2 bg-transparent shadow-none">
                  <CardContent className="p-12 text-center flex flex-col items-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 ring-1 ring-primary/10 mb-6">
                      <Building className="h-8 w-8 text-primary/60" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      No Workspaces Yet
                    </h3>
                    <p className="text-muted-foreground mb-8 max-w-sm">
                      Get started by creating your first workspace to organize
                      your projects and team.
                    </p>
                    <Dialog
                      open={showCreateDialog}
                      onOpenChange={setShowCreateDialog}
                    >
                      <DialogTrigger asChild>
                        <Button size="lg" className="shadow-sm">
                          <Plus className="h-5 w-5 mr-2" />
                          Create Workspace
                        </Button>
                      </DialogTrigger>
                      {createWorkspaceDialogContent("-empty")}
                    </Dialog>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {workspaces.map((workspace) => (
                    <Card
                      key={workspace.id}
                      className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                      onClick={() => handleSelectWorkspace(workspace)}
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-4">
                            <CardTitle className="text-lg font-bold truncate group-hover:text-primary transition-colors">
                              {workspace.name}
                            </CardTitle>
                            <CardDescription className="mt-1.5 line-clamp-2 text-sm leading-relaxed">
                              {workspace.description ||
                                "No description provided for this workspace."}
                            </CardDescription>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                            <ArrowRight className="h-4 w-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                          <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                            <Users className="h-4 w-4 text-primary/60" />
                            <span>
                              {workspace.membersCount ??
                                workspace.members?.length ??
                                0}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-md">
                            <Calendar className="h-4 w-4 text-primary/60" />
                            <span>
                              {workspace.createdAt
                                ? new Date(
                                    workspace.createdAt,
                                  ).toLocaleDateString(undefined, {
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Recently"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* ─── Right Column (Recent Projects & Quick Actions) ─── */}
            <div className="space-y-8">
              {/* ─── Recent Projects ─── */}
              {workspaces.length > 0 && (
                <section className="space-y-6">
                  <h2 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-blue-500/10">
                      <Clock className="h-5 w-5 text-blue-500" />
                    </div>
                    Recent Projects
                  </h2>

                  {projectsLoading ? (
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                      <CardContent className="p-8 flex justify-center">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          <span className="text-sm font-medium">
                            Loading projects…
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ) : recentProjects.length === 0 ? (
                    <Card className="border-dashed border-2 bg-transparent shadow-none">
                      <CardContent className="p-8 text-center">
                        <FolderGit2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground font-medium">
                          No projects yet. Open a workspace to create one.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden shadow-sm">
                      <div className="divide-y divide-border/50">
                        {recentProjects.map((project) => (
                          <button
                            key={`${project.workspaceSlug}-${project.id}`}
                            onClick={() => handleOpenProject(project)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left group"
                          >
                            <div className="p-2.5 rounded-xl bg-background shadow-sm ring-1 ring-border group-hover:ring-primary/30 group-hover:bg-primary/5 transition-all">
                              <FolderGit2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                  {project.name}
                                </span>
                                {project.defaultBranchStats &&
                                  project.defaultBranchStats.totalIssues >
                                    0 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] px-1.5 py-0 h-5 shrink-0 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-0"
                                    >
                                      {project.defaultBranchStats
                                        .highSeverityCount > 0 && (
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                      )}
                                      {project.defaultBranchStats.totalIssues}
                                    </Badge>
                                  )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-muted-foreground truncate">
                                  {project.workspaceName}
                                </span>
                                {project.mainBranch && (
                                  <>
                                    <span className="text-muted-foreground/30">
                                      •
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <GitBranch className="h-3 w-3" />
                                      {project.mainBranch}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </Card>
                  )}
                </section>
              )}

              {/* ─── Quick Actions ─── */}
              <section className="space-y-6">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-emerald-500/10">
                    <Zap className="h-5 w-5 text-emerald-500" />
                  </div>
                  Quick Actions
                </h2>
                <div className="grid gap-4">
                  <Card
                    className="group hover:shadow-md hover:border-blue-500/40 transition-all duration-300 cursor-pointer bg-card/50 backdrop-blur-sm border-border/50"
                    onClick={() => window.open(CROSS_LINKS.docs, "_blank")}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors ring-1 ring-blue-500/20">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm group-hover:text-blue-500 transition-colors flex items-center gap-1.5">
                          Documentation
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Guides, setup & API reference
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className="group hover:shadow-md hover:border-emerald-500/40 transition-all duration-300 cursor-pointer bg-card/50 backdrop-blur-sm border-border/50"
                    onClick={() =>
                      window.open(
                        `${CROSS_LINKS.docs}/getting-started`,
                        "_blank",
                      )
                    }
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors ring-1 ring-emerald-500/20">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm group-hover:text-emerald-500 transition-colors flex items-center gap-1.5">
                          Getting Started
                          <ExternalLink className="h-3 w-3 opacity-50" />
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
      </div>
    </div>
  );
}
