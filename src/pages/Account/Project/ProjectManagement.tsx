import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpenCheck,
  Database,
  Eye,
  FolderKanban,
  GitBranch,
  ListFilter,
  ListTodo,
  Plus,
  RotateCcw,
  Search,
  Settings,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet.tsx";
import { bitbucketCloudService } from "@/api_service/codeHosting/bitbucket/cloud/bitbucketCloudService.ts";
import { githubService } from "@/api_service/codeHosting/github/githubService.ts";
import { gitlabService } from "@/api_service/codeHosting/gitlab/gitlabService.ts";
import {
  projectService,
  type ProjectDTO,
  type RagStatusResponse,
} from "@/api_service/project/projectService.ts";
import { taskManagementService } from "@/api_service/taskManagement/taskManagementService";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast.ts";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";
import { useWorkspace } from "@/context/WorkspaceContext";

type QualityScore = "A+" | "A" | "B" | "C" | "D" | "F";
type IssueCountFilter =
  | "all"
  | "not-analyzed"
  | "none"
  | "1-10"
  | "11-50"
  | "51-plus";
type ConfigurationFilter = "all" | "configured" | "needs-setup";
type ProjectStatusFilter = "all" | "active" | "inactive";

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
  mainBranch: string | null;
  vcsProvider?: ProjectDTO["vcsProvider"];
  vcsConnectionName?: string;
  ragConfig?: ProjectDTO["ragConfig"];
  ragStatus?: RagStatusResponse | null;
  taskManagementConfig?: ProjectDTO["taskManagementConfig"];
  taskManagementConnectionName?: string;
  taskManagementProvider?: string;
  qaAutoDocConfig?: ProjectDTO["qaAutoDocConfig"];
  qualityGateId?: number | null;
  defaultBranchStats?: ProjectDTO["defaultBranchStats"];
}

interface ProjectFilters {
  issueCount: IssueCountFilter;
  qualityScore: "all" | "unscored" | QualityScore;
  configuration: ConfigurationFilter;
  status: ProjectStatusFilter;
  provider: string;
  qaAutoDocEnabled: boolean;
  ragEnabled: boolean;
  taskManagementConnected: boolean;
  aiConnected: boolean;
  vcsConnected: boolean;
}

interface VcsConnectionSummary {
  id: number;
  connectionName: string;
  provider: NonNullable<ProjectDTO["vcsProvider"]>;
}

const EMPTY_FILTERS: ProjectFilters = {
  issueCount: "all",
  qualityScore: "all",
  configuration: "all",
  status: "all",
  provider: "all",
  qaAutoDocEnabled: false,
  ragEnabled: false,
  taskManagementConnected: false,
  aiConnected: false,
  vcsConnected: false,
};

const loadVcsConnectionSummaries = async (
  workspaceSlug: string,
): Promise<VcsConnectionSummary[]> => {
  const [bitbucketConnections, githubConnections, gitlabConnections] =
    await Promise.all([
      bitbucketCloudService.getUserConnections(workspaceSlug).catch(() => []),
      githubService.getUserConnections(workspaceSlug).catch(() => []),
      gitlabService.getUserConnections(workspaceSlug).catch(() => []),
    ]);

  return [
    ...bitbucketConnections.map((connection) => ({
      id: connection.id,
      connectionName: connection.connectionName,
      provider: "BITBUCKET_CLOUD" as const,
    })),
    ...githubConnections.map((connection) => ({
      id: connection.id,
      connectionName: connection.connectionName,
      provider: "GITHUB" as const,
    })),
    ...gitlabConnections.map((connection) => ({
      id: connection.id,
      connectionName: connection.connectionName,
      provider: "GITLAB" as const,
    })),
  ];
};

const formatProvider = (provider?: string | null) => {
  if (!provider) return "No provider";
  return provider
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getRepositoryInfo = (workspace?: string, slug?: string) => {
  if (!workspace || !slug) return "No repository";
  return `${workspace}/${slug}`;
};

const getQualityScore = (project: Project): QualityScore | null => {
  const stats = project.defaultBranchStats;
  if (!stats) return null;

  const weightedScore =
    stats.highSeverityCount * 3 +
    stats.mediumSeverityCount * 2 +
    stats.lowSeverityCount;
  const scoredIssueCount =
    stats.highSeverityCount +
    stats.mediumSeverityCount +
    stats.lowSeverityCount;

  if (scoredIssueCount === 0) return "A+";
  if (weightedScore <= 5) return "A";
  if (weightedScore <= 15) return "B";
  if (weightedScore <= 30) return "C";
  if (weightedScore <= 50) return "D";
  return "F";
};

const getQualityScoreClass = (score: QualityScore | null) => {
  switch (score) {
    case "A+":
    case "A":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "B":
      return "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "C":
      return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "D":
    case "F":
      return "border-destructive/30 bg-destructive/10 text-destructive";
    default:
      return "border-border bg-muted/60 text-muted-foreground";
  }
};

const getCommentVisibility = (project: Project) => {
  if (!project.qaAutoDocConfig?.enabled) return "QA documentation disabled";

  const visibility = project.qaAutoDocConfig.commentVisibility;
  if (!visibility) return "Visible to everyone";

  const visibilityName =
    visibility.displayName ||
    visibility.value ||
    visibility.identifier ||
    "Restricted";

  return `${visibility.type === "group" ? "Group" : "Role"}: ${visibilityName}`;
};

const getRagState = (project: Project) => {
  if (!project.ragConfig?.enabled) {
    return {
      label: "RAG off",
      className: "border-border bg-muted/60 text-muted-foreground",
    };
  }

  if (project.ragStatus === null) {
    return {
      label: "RAG unavailable",
      className:
        "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    };
  }

  const status = project.ragStatus?.indexStatus?.status;
  if (status === "INDEXED") {
    return {
      label: "RAG indexed",
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    };
  }
  if (status === "INDEXING" || status === "UPDATING") {
    return {
      label: status === "INDEXING" ? "RAG indexing" : "RAG updating",
      className:
        "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    };
  }
  if (status === "FAILED") {
    return {
      label: "RAG failed",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    };
  }

  return project.ragStatus?.isIndexed
    ? {
        label: "RAG indexed",
        className:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      }
    : {
        label: "RAG not indexed",
        className:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      };
};

const isFullyConfigured = (project: Project) =>
  Boolean(project.vcsConnectionId && project.aiConnectionId && project.mainBranch);

const countActiveFilters = (filters: ProjectFilters) =>
  Number(filters.issueCount !== "all") +
  Number(filters.qualityScore !== "all") +
  Number(filters.configuration !== "all") +
  Number(filters.status !== "all") +
  Number(filters.provider !== "all") +
  Number(filters.qaAutoDocEnabled) +
  Number(filters.ragEnabled) +
  Number(filters.taskManagementConnected) +
  Number(filters.aiConnected) +
  Number(filters.vcsConnected);

interface ProjectFiltersPanelProps {
  filters: ProjectFilters;
  providers: string[];
  idPrefix: string;
  onChange: (filters: ProjectFilters) => void;
  onClear: () => void;
}

function ProjectFiltersPanel({
  filters,
  providers,
  idPrefix,
  onChange,
  onClear,
}: ProjectFiltersPanelProps) {
  const activeFilterCount = countActiveFilters(filters);
  const updateFilter = <Key extends keyof ProjectFilters>(
    key: Key,
    value: ProjectFilters[Key],
  ) => onChange({ ...filters, [key]: value });

  const featureFilters: Array<{
    key:
      | "qaAutoDocEnabled"
      | "ragEnabled"
      | "taskManagementConnected"
      | "aiConnected"
      | "vcsConnected";
    label: string;
  }> = [
    { key: "qaAutoDocEnabled", label: "QA auto-documentation" },
    { key: "ragEnabled", label: "RAG enabled" },
    { key: "taskManagementConnected", label: "Task management connected" },
    { key: "aiConnected", label: "AI connected" },
    { key: "vcsConnected", label: "VCS connected" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Filters</h2>
          {activeFilterCount > 0 && (
            <Badge className="h-5 min-w-5 justify-center px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={activeFilterCount === 0}
          onClick={onClear}
          className="h-8 px-2 text-xs text-muted-foreground"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Issue count
        </Label>
        <Select
          value={filters.issueCount}
          onValueChange={(value) =>
            updateFilter("issueCount", value as IssueCountFilter)
          }
        >
          <SelectTrigger className="h-10 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any issue count</SelectItem>
            <SelectItem value="not-analyzed">Not analyzed</SelectItem>
            <SelectItem value="none">No issues</SelectItem>
            <SelectItem value="1-10">1–10 issues</SelectItem>
            <SelectItem value="11-50">11–50 issues</SelectItem>
            <SelectItem value="51-plus">51+ issues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Quality score
        </Label>
        <Select
          value={filters.qualityScore}
          onValueChange={(value) =>
            updateFilter(
              "qualityScore",
              value as ProjectFilters["qualityScore"],
            )
          }
        >
          <SelectTrigger className="h-10 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any quality score</SelectItem>
            <SelectItem value="unscored">Not analyzed</SelectItem>
            {(["A+", "A", "B", "C", "D", "F"] as QualityScore[]).map(
              (score) => (
                <SelectItem key={score} value={score}>
                  Score {score}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Configuration
        </Label>
        <Select
          value={filters.configuration}
          onValueChange={(value) =>
            updateFilter("configuration", value as ConfigurationFilter)
          }
        >
          <SelectTrigger className="h-10 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any configuration</SelectItem>
            <SelectItem value="configured">Fully configured</SelectItem>
            <SelectItem value="needs-setup">Needs setup</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </Label>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              updateFilter("status", value as ProjectStatusFilter)
            }
          >
            <SelectTrigger className="h-10 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Provider
          </Label>
          <Select
            value={filters.provider}
            onValueChange={(value) => updateFilter("provider", value)}
          >
            <SelectTrigger className="h-10 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All providers</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {formatProvider(provider)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Features
        </Label>
        {featureFilters.map((filter) => {
          const id = `${idPrefix}-${filter.key}`;
          return (
            <div key={filter.key} className="flex items-center gap-2.5">
              <Checkbox
                id={id}
                checked={filters[filter.key]}
                onCheckedChange={(checked) =>
                  updateFilter(filter.key, checked === true)
                }
              />
              <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
                {filter.label}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProjectManagement() {
  const navigate = useNavigate();
  const routes = useWorkspaceRoutes();
  const { currentWorkspace } = useWorkspace();
  const { canManageWorkspace } = usePermissions();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<ProjectFilters>(EMPTY_FILTERS);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(projectSearchQuery.trim().toLowerCase());
      setCurrentPage(0);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [projectSearchQuery]);

  const loadData = useCallback(async () => {
    if (!currentWorkspace) return;
    setLoading(true);

    try {
      const [projectList, vcsConnections, taskConnections] = await Promise.all([
        projectService.listProjects(currentWorkspace.slug),
        loadVcsConnectionSummaries(currentWorkspace.slug),
        taskManagementService
          .listConnections(currentWorkspace.slug)
          .catch(() => []),
      ]);

      const vcsConnectionsById = new Map(
        vcsConnections.map((connection) => [connection.id, connection]),
      );
      const taskConnectionsById = new Map(
        taskConnections.map((connection) => [connection.id, connection]),
      );

      const ragStatuses = new Map<string, RagStatusResponse | null>();
      await Promise.all(
        projectList.map(async (project) => {
          if (!project.ragConfig?.enabled || !project.namespace) return;
          const status = await projectService
            .getRagStatus(currentWorkspace.slug, project.namespace)
            .catch(() => null);
          ragStatuses.set(String(project.id), status);
        }),
      );

      const mappedProjects = projectList.map<Project>((project) => {
        const vcsConnection = project.vcsConnectionId
          ? vcsConnectionsById.get(project.vcsConnectionId)
          : undefined;
        const taskConnectionId =
          project.taskManagementConfig?.taskManagementConnectionId;
        const taskConnection = taskConnectionId
          ? taskConnectionsById.get(taskConnectionId)
          : undefined;

        return {
          id: String(project.id),
          name: project.name,
          description: project.description || "",
          namespace: project.namespace || "",
          vcsConnectionId: project.vcsConnectionId,
          aiConnectionId: project.aiConnectionId,
          projectVcsWorkspace: project.projectVcsWorkspace,
          projectVcsRepoSlug: project.projectVcsRepoSlug,
          isActive: project.isActive ?? project.active,
          mainBranch:
            project.mainBranch ||
            project.defaultBranch ||
            project.defaultBranchStats?.branchName ||
            null,
          vcsProvider: project.vcsProvider || vcsConnection?.provider,
          vcsConnectionName: vcsConnection?.connectionName,
          ragConfig: project.ragConfig,
          ragStatus: project.ragConfig?.enabled
            ? (ragStatuses.get(String(project.id)) ?? null)
            : undefined,
          taskManagementConfig: project.taskManagementConfig,
          taskManagementConnectionName: taskConnection?.connectionName,
          taskManagementProvider: taskConnection?.providerType,
          qaAutoDocConfig: project.qaAutoDocConfig,
          qualityGateId: project.qualityGateId,
          defaultBranchStats: project.defaultBranchStats,
        };
      });

      setProjects(mappedProjects);
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Failed to load projects";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(0);
  }, [filters, pageSize]);

  const providers = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((project) => project.vcsProvider)
            .filter((provider): provider is NonNullable<typeof provider> =>
              Boolean(provider),
            ),
        ),
      ).sort(),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const stats = project.defaultBranchStats;
      const issueCount = stats?.totalIssues;
      const qualityScore = getQualityScore(project);

      if (debouncedSearch) {
        const searchableValues = [
          project.name,
          project.description,
          project.namespace,
          project.projectVcsWorkspace,
          project.projectVcsRepoSlug,
          project.vcsConnectionName,
          project.taskManagementConnectionName,
          project.mainBranch,
        ];
        if (
          !searchableValues.some((value) =>
            value?.toLowerCase().includes(debouncedSearch),
          )
        ) {
          return false;
        }
      }

      if (filters.issueCount === "not-analyzed" && stats) return false;
      if (filters.issueCount === "none" && issueCount !== 0) return false;
      if (
        filters.issueCount === "1-10" &&
        (issueCount === undefined || issueCount < 1 || issueCount > 10)
      ) {
        return false;
      }
      if (
        filters.issueCount === "11-50" &&
        (issueCount === undefined || issueCount < 11 || issueCount > 50)
      ) {
        return false;
      }
      if (
        filters.issueCount === "51-plus" &&
        (issueCount === undefined || issueCount < 51)
      ) {
        return false;
      }

      if (filters.qualityScore === "unscored" && qualityScore) return false;
      if (
        filters.qualityScore !== "all" &&
        filters.qualityScore !== "unscored" &&
        qualityScore !== filters.qualityScore
      ) {
        return false;
      }

      if (
        filters.configuration === "configured" &&
        !isFullyConfigured(project)
      ) {
        return false;
      }
      if (
        filters.configuration === "needs-setup" &&
        isFullyConfigured(project)
      ) {
        return false;
      }

      if (filters.status === "active" && project.isActive === false) return false;
      if (filters.status === "inactive" && project.isActive !== false) return false;
      if (filters.provider !== "all" && project.vcsProvider !== filters.provider) {
        return false;
      }
      if (filters.qaAutoDocEnabled && !project.qaAutoDocConfig?.enabled) {
        return false;
      }
      if (filters.ragEnabled && !project.ragConfig?.enabled) return false;
      if (
        filters.taskManagementConnected &&
        !project.taskManagementConfig?.taskManagementConnectionId
      ) {
        return false;
      }
      if (filters.aiConnected && !project.aiConnectionId) return false;
      if (filters.vcsConnected && !project.vcsConnectionId) return false;

      return true;
    });
  }, [debouncedSearch, filters, projects]);

  const totalElements = filteredProjects.length;
  const totalPages = Math.ceil(totalElements / pageSize);
  const visibleProjects = useMemo(
    () =>
      filteredProjects.slice(
        currentPage * pageSize,
        (currentPage + 1) * pageSize,
      ),
    [currentPage, filteredProjects, pageSize],
  );
  const activeFilterCount = countActiveFilters(filters);

  useEffect(() => {
    if (totalPages > 0 && currentPage >= totalPages) {
      setCurrentPage(totalPages - 1);
    }
  }, [currentPage, totalPages]);

  const clearFilters = () => setFilters(EMPTY_FILTERS);
  const resetSearchAndFilters = () => {
    setProjectSearchQuery("");
    setDebouncedSearch("");
    setFilters(EMPTY_FILTERS);
  };

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-40 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full">
          <div className="w-full bg-background/40 backdrop-blur-xl border-b border-border/40 shadow-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 lg:px-8 py-6 sm:py-8">
              <div className="flex items-center gap-5">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-inner">
                  <FolderKanban className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <div className="h-8 w-48 animate-pulse rounded bg-muted/60" />
                  <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted/50" />
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 lg:px-8 py-8 space-y-6">
            <div className="h-16 animate-pulse rounded-2xl bg-muted/50" />
            <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="hidden h-96 animate-pulse rounded-2xl bg-muted/50 lg:block" />
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-xl bg-muted/50"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden">
      {/* Keep the same dashboard page background used by AI/VCS settings. */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-40 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full">
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
                <Button
                  onClick={() => navigate(routes.projectImport())}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Project</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/50 p-3 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xl">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label="Search projects"
                placeholder="Search projects, repositories, branches, or connections..."
                value={projectSearchQuery}
                onChange={(event) => setProjectSearchQuery(event.target.value)}
                className="h-11 rounded-xl bg-background/80 pl-10"
              />
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setFiltersOpen(true)}
                className="relative h-11 flex-1 lg:hidden"
              >
                <ListFilter className="mr-2 h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 h-5 min-w-5 justify-center px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>

              <div className="flex h-11 items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-2.5">
                <span className="hidden whitespace-nowrap text-xs font-medium text-muted-foreground sm:inline">
                  Per page
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger
                    aria-label="Items per page"
                    className="h-8 w-[72px] border-0 bg-transparent px-2 font-semibold shadow-none focus:ring-0"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="sticky top-28 hidden rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm backdrop-blur-xl lg:block">
              <ProjectFiltersPanel
                filters={filters}
                providers={providers}
                idPrefix="desktop-filter"
                onChange={setFilters}
                onClear={clearFilters}
              />
            </aside>

            <main className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {totalElements}
                  </span>{" "}
                  project{totalElements === 1 ? "" : "s"}
                  {(activeFilterCount > 0 || debouncedSearch) &&
                    ` matching ${projects.length} total`}
                </p>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 text-xs text-muted-foreground lg:hidden"
                  >
                    Clear filters
                  </Button>
                )}
              </div>

              {projects.length === 0 ? (
                <Card className="border-dashed bg-transparent shadow-none">
                  <CardContent className="flex flex-col items-center py-16 text-center">
                    <FolderKanban className="mb-4 h-12 w-12 text-primary/50" />
                    <h2 className="text-xl font-semibold">No projects yet</h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                      Import a repository to create the first project in this
                      workspace.
                    </p>
                  </CardContent>
                </Card>
              ) : visibleProjects.length === 0 ? (
                <Card className="border-dashed bg-transparent shadow-none">
                  <CardContent className="flex flex-col items-center py-14 text-center">
                    <ListFilter className="mb-4 h-10 w-10 text-muted-foreground/60" />
                    <h2 className="text-lg font-semibold">
                      No matching projects
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Adjust the search or filters to see more projects.
                    </p>
                    <Button
                      variant="outline"
                      onClick={resetSearchAndFilters}
                      className="mt-5"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset search and filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {visibleProjects.map((project, index) => {
                    const stats = project.defaultBranchStats;
                    const qualityScore = getQualityScore(project);
                    const ragState = getRagState(project);
                    const taskConnectionId =
                      project.taskManagementConfig
                        ?.taskManagementConnectionId;

                    return (
                      <Card
                        key={project.id}
                        className="group relative cursor-pointer overflow-hidden border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md animate-in fade-in slide-in-from-bottom-2"
                        style={{
                          animationFillMode: "both",
                          animationDelay: `${index * 35}ms`,
                        }}
                        onClick={() =>
                          navigate(
                            routes.projectDetail(
                              project.namespace || project.id,
                            ),
                          )
                        }
                      >
                        <CardContent className="p-0">
                          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                            <div className="flex min-w-0 flex-1 items-center gap-3 pr-10 sm:pr-0">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FolderKanban className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-2">
                                  <h2 className="truncate text-base font-semibold transition-colors group-hover:text-primary">
                                    {project.name}
                                  </h2>
                                  <span
                                    className={`h-2 w-2 shrink-0 rounded-full ${
                                      project.isActive === false
                                        ? "bg-muted-foreground/40"
                                        : "bg-emerald-500"
                                    }`}
                                    title={
                                      project.isActive === false
                                        ? "Inactive"
                                        : "Active"
                                    }
                                  />
                                </div>
                                <p
                                  className="mt-0.5 truncate text-sm font-medium text-foreground/75"
                                  title={getRepositoryInfo(
                                    project.projectVcsWorkspace,
                                    project.projectVcsRepoSlug,
                                  )}
                                >
                                  {getRepositoryInfo(
                                    project.projectVcsWorkspace,
                                    project.projectVcsRepoSlug,
                                  )}
                                </p>
                                <p
                                  className="mt-0.5 truncate text-xs text-muted-foreground"
                                  title={project.vcsConnectionName}
                                >
                                  {formatProvider(project.vcsProvider)} ·{" "}
                                  {project.vcsConnectionName ||
                                    (project.vcsConnectionId
                                      ? `Connection #${project.vcsConnectionId}`
                                      : "Not connected")}
                                </p>
                              </div>
                            </div>

                            <div className="w-full shrink-0 rounded-xl border border-border bg-muted/20 px-3 py-2.5 sm:w-[320px]">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground">
                                  Issues
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`h-5 px-1.5 text-[10px] ${getQualityScoreClass(qualityScore)}`}
                                >
                                  Quality {qualityScore || "—"}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-4 divide-x divide-border text-center">
                                <div>
                                  <p className="text-xl font-bold leading-none text-foreground">
                                    {stats?.totalIssues ?? "—"}
                                  </p>
                                  <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                                    Total
                                  </p>
                                </div>
                                <div>
                                  <p className="text-lg font-semibold leading-none text-destructive">
                                    {stats?.highSeverityCount ?? "—"}
                                  </p>
                                  <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                                    High
                                  </p>
                                </div>
                                <div>
                                  <p className="text-lg font-semibold leading-none text-amber-500">
                                    {stats?.mediumSeverityCount ?? "—"}
                                  </p>
                                  <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                                    Medium
                                  </p>
                                </div>
                                <div>
                                  <p className="text-lg font-semibold leading-none text-sky-500">
                                    {stats?.lowSeverityCount ?? "—"}
                                  </p>
                                  <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                                    Low
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div
                              className="absolute right-3 top-3 sm:static"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {canManageWorkspace() && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Configure ${project.name}`}
                                  className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground"
                                  onClick={() =>
                                    navigate(
                                      routes.projectSettings(
                                        project.namespace || project.id,
                                      ),
                                    )
                                  }
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/10 px-4 py-2.5 text-xs">
                            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-1 text-sky-700 dark:text-sky-300">
                              <GitBranch className="h-3.5 w-3.5 shrink-0" />
                              <span className="font-medium">
                                {project.mainBranch || "No main branch"}
                              </span>
                            </span>
                            <span
                              className={`inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2 py-1 ${
                                project.qaAutoDocConfig?.enabled
                                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : "border-border bg-muted/60 text-muted-foreground"
                              }`}
                              title={getCommentVisibility(project)}
                            >
                              <BookOpenCheck className="h-3.5 w-3.5 shrink-0" />
                              <span className="max-w-[180px] truncate">
                                {project.qaAutoDocConfig?.enabled
                                  ? getCommentVisibility(project)
                                  : "QA documentation off"}
                              </span>
                              {project.qaAutoDocConfig?.enabled && (
                                <Eye className="h-3 w-3 shrink-0" />
                              )}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 ${ragState.className}`}
                              title={
                                project.ragConfig?.enabled
                                  ? `Branch: ${project.ragConfig.branch || project.mainBranch || "main"}`
                                  : undefined
                              }
                            >
                              <Database className="h-3.5 w-3.5" />
                              {ragState.label}
                            </span>
                            <span
                              className={`inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2 py-1 ${
                                taskConnectionId
                                  ? "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                                  : "border-border bg-muted/60 text-muted-foreground"
                              }`}
                              title={project.taskManagementConnectionName}
                            >
                              <ListTodo className="h-3.5 w-3.5 shrink-0" />
                              <span className="max-w-[170px] truncate">
                                {project.taskManagementConnectionName ||
                                  (taskConnectionId
                                    ? `Task connection #${taskConnectionId}`
                                    : "Task management off")}
                              </span>
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 ${
                                project.aiConnectionId
                                  ? "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                                  : "border-border bg-muted/60 text-muted-foreground"
                              }`}
                            >
                              <Zap className="h-3.5 w-3.5" />
                              AI {project.aiConnectionId ? "connected" : "off"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex flex-col items-center justify-between gap-3 pt-4 sm:flex-row">
                  <p className="text-sm font-medium text-muted-foreground">
                    Showing {currentPage * pageSize + 1}–
                    {Math.min((currentPage + 1) * pageSize, totalElements)} of{" "}
                    {totalElements}
                  </p>
                  <div className="flex items-center gap-1 rounded-xl border border-border/50 bg-card/50 p-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(0)}
                      disabled={currentPage === 0}
                    >
                      First
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((page) => Math.max(0, page - 1))
                      }
                      disabled={currentPage === 0}
                    >
                      Previous
                    </Button>
                    <span className="px-2 text-sm font-semibold">
                      {currentPage + 1} / {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(totalPages - 1, page + 1),
                        )
                      }
                      disabled={currentPage >= totalPages - 1}
                    >
                      Next
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages - 1)}
                      disabled={currentPage >= totalPages - 1}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="overflow-y-auto">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle>Filter projects</SheetTitle>
            <SheetDescription>
              Narrow projects by quality, issue count, and configuration.
            </SheetDescription>
          </SheetHeader>
          <ProjectFiltersPanel
            filters={filters}
            providers={providers}
            idPrefix="mobile-filter"
            onChange={setFilters}
            onClear={clearFilters}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
