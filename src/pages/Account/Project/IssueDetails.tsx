import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
  Link,
} from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import { analysisService } from "@/api_service/analysis/analysisService";
import type {
  AnalysisIssue,
  FileSnippetResponse,
  InlineIssue,
} from "@/api_service/analysis/analysisService";
import {
  projectService,
  type ProjectDTO,
} from "@/api_service/project/projectService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Clock,
  GitBranch,
  GitPullRequest,
  GitCommitVertical,
  ChevronRight,
  ChevronLeft,
  Copy,
  ExternalLink,
  User,
  Code2,
  AlertCircle,
  AlertTriangle,
  Info,
  Braces,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/components/ThemeProvider";
import { getCategoryInfo } from "@/config/issueCategories";
import { cn } from "@/lib/utils";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { buildVcsPrUrl } from "@/components/IssueListWithFilters";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default function IssueDetails() {
  const { namespace, issueId } = useParams<{
    namespace: string;
    issueId: string;
  }>();
  const navigate = useNavigate();
  const routes = useWorkspaceRoutes();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { theme } = useTheme();
  const { canManageWorkspace } = usePermissions();

  const [issue, setIssue] = useState<AnalysisIssue | null>(null);
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [scopeIssues, setScopeIssues] = useState<AnalysisIssue[]>(
    // Initialize from route state if available
    (location.state as { scopeIssues?: AnalysisIssue[] })?.scopeIssues || [],
  );
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeTotal, setScopeTotal] = useState(0);
  const [scopeLoadingMore, setScopeLoadingMore] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [snippet, setSnippet] = useState<FileSnippetResponse | null>(null);
  const [snippetLoading, setSnippetLoading] = useState(false);
  const [snippetExpanding, setSnippetExpanding] = useState<
    "up" | "down" | "all" | null
  >(null);

  // Ref for auto-scrolling the active sidebar item into view
  const activeSidebarItemRef = useRef<HTMLAnchorElement>(null);

  // Track current snippet coverage via ref (avoids stale closures in effects)
  const snippetRangeRef = useRef<{
    file: string;
    start: number;
    end: number;
  } | null>(null);
  useEffect(() => {
    snippetRangeRef.current = snippet
      ? {
          file: snippet.filePath,
          start: snippet.startLine,
          end: snippet.endLine,
        }
      : null;
  }, [snippet]);

  // Stable key: only changes when the set of same-file issue lines changes
  const sameFileIssueKey = useMemo(() => {
    if (!issue?.file) return "";
    return scopeIssues
      .filter((si) => si.file === issue.file && si.line > 0)
      .map((si) => si.line)
      .sort((a, b) => a - b)
      .join(",");
  }, [issue?.file, scopeIssues]);

  // Get scope parameters from URL
  const scopeBranch = searchParams.get("branch");
  const scopePrNumber = searchParams.get("prNumber");
  const scopePrVersion = searchParams.get("prVersion");
  const returnPath = searchParams.get("returnPath");
  const returnTab = searchParams.get("returnTab");
  const filterSeverity = searchParams.get("severity");
  const filterStatus = searchParams.get("status");
  const filterCategory = searchParams.get("category");

  // Helper to build PR URL using project VCS info
  const buildPrUrl = (prNumber: number | null | undefined): string | null => {
    if (!prNumber || !project) return null;
    return buildVcsPrUrl(
      project.vcsProvider,
      project.projectVcsWorkspace,
      project.projectVcsRepoSlug || project.projectRepoSlug,
      prNumber,
    );
  };

  const loadIssue = async () => {
    if (!currentWorkspace || !namespace || !issueId) return;

    try {
      setLoading(true);

      // When navigating from the branch issue listing the ID is a
      // BranchIssue PK — use the branch-specific endpoint so we hit
      // the right table.  The presence of `scopeBranch` (the ?branch=
      // search param) is the discriminator.
      const issuePromise = scopeBranch
        ? analysisService.getBranchIssueById(
            currentWorkspace.slug,
            namespace,
            issueId,
          )
        : analysisService.getIssueById(
            currentWorkspace.slug,
            namespace,
            issueId,
          );

      // Load issue and project info in parallel
      const [issueData, projectData] = await Promise.all([
        issuePromise,
        projectService.getProjectByNamespace(currentWorkspace.slug, namespace),
      ]);
      setIssue(issueData);
      setProject(projectData);
    } catch (error: any) {
      // If 404, the issue doesn't exist in this workspace/project - navigate away
      if (error.response?.status === 404 || error.status === 404) {
        toast({
          title: "Issue not found",
          description:
            "This issue doesn't exist or doesn't belong to this workspace",
          variant: "destructive",
        });
        // Navigate to projects list for this workspace
        navigate(routes.projects());
        return;
      }
      toast({
        title: "Failed to load issue",
        description: error.message || "Could not load issue details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadScopeIssues = async () => {
    if (!currentWorkspace || !namespace) return;

    setScopeLoading(true);
    try {
      let issues: AnalysisIssue[] = [];

      // If PR scope is specified, load PR issues
      if (scopePrNumber) {
        const version = scopePrVersion ? parseInt(scopePrVersion) : undefined;
        const response = await analysisService.getAnalysisIssues(
          currentWorkspace.slug,
          namespace,
          scopePrNumber,
          version,
        );
        issues = response.issues;
      } else {
        // Fall back to branch scope
        const branch = scopeBranch || issue?.branch;
        if (!branch) {
          setScopeLoading(false);
          return;
        }

        // Use filter parameters from URL if available
        // Default to 'open' to match BranchIssues page behavior (show only open issues by default)
        const statusFilter = filterStatus || "open";
        const response = await analysisService.getBranchIssues(
          currentWorkspace.slug,
          namespace,
          branch,
          statusFilter,
          1,
          200, // Load issues for sidebar navigation
          true, // excludeDiff to reduce payload size
        );
        issues = response.issues;
        setScopeTotal(response.total);
      }

      // Apply additional filters if present
      if (filterSeverity && filterSeverity !== "ALL") {
        issues = issues.filter(
          (i) => i.severity.toLowerCase() === filterSeverity.toLowerCase(),
        );
      }
      if (filterCategory && filterCategory !== "ALL") {
        issues = issues.filter(
          (i) =>
            i.issueCategory?.toLowerCase() === filterCategory.toLowerCase(),
        );
      }
      // Apply status filter (client-side to ensure consistency for both PR and branch issues)
      // Default to 'open' to match BranchIssues page behavior
      const effectiveStatusFilter = filterStatus || "open";
      if (effectiveStatusFilter !== "all") {
        if (effectiveStatusFilter === "open") {
          issues = issues.filter((i) => i.status !== "resolved");
        } else if (effectiveStatusFilter === "resolved") {
          issues = issues.filter((i) => i.status === "resolved");
        }
      }

      setScopeIssues(issues);
    } catch (error: any) {
      console.error("Failed to load scope issues:", error);
    } finally {
      setScopeLoading(false);
    }
  };

  const loadMoreScopeIssues = async () => {
    if (!currentWorkspace || !namespace || scopeLoadingMore) return;
    const branch = scopeBranch || issue?.branch;
    if (!branch) return;

    setScopeLoadingMore(true);
    try {
      const statusFilter = filterStatus || "open";
      const currentPage = Math.ceil(scopeIssues.length / 200);
      const response = await analysisService.getBranchIssues(
        currentWorkspace.slug,
        namespace,
        branch,
        statusFilter,
        currentPage + 1,
        200,
        true,
      );

      let newIssues = response.issues;

      // Apply same client-side filters
      if (filterSeverity && filterSeverity !== "ALL") {
        newIssues = newIssues.filter(
          (i) => i.severity.toLowerCase() === filterSeverity.toLowerCase(),
        );
      }
      if (filterCategory && filterCategory !== "ALL") {
        newIssues = newIssues.filter(
          (i) =>
            i.issueCategory?.toLowerCase() === filterCategory.toLowerCase(),
        );
      }
      const effectiveStatusFilter = filterStatus || "open";
      if (effectiveStatusFilter !== "all") {
        if (effectiveStatusFilter === "open") {
          newIssues = newIssues.filter((i) => i.status !== "resolved");
        } else if (effectiveStatusFilter === "resolved") {
          newIssues = newIssues.filter((i) => i.status === "resolved");
        }
      }

      setScopeIssues((prev) => [...prev, ...newIssues]);
      setScopeTotal(response.total);
    } catch (error: any) {
      console.error("Failed to load more scope issues:", error);
    } finally {
      setScopeLoadingMore(false);
    }
  };

  useEffect(() => {
    loadIssue();
  }, [currentWorkspace, namespace, issueId, scopeBranch]);

  useEffect(() => {
    // Skip loading if we already have scope issues from route state
    if (scopeIssues.length > 0) return;

    if (issue || scopeBranch || scopePrNumber) {
      loadScopeIssues();
    }
  }, [issue, scopeBranch, scopePrNumber, currentWorkspace, namespace]);

  // Auto-scroll the active sidebar item into view when issueId changes
  useEffect(() => {
    if (!issueId || sidebarCollapsed) return;
    const timer = setTimeout(() => {
      activeSidebarItemRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [issueId, sidebarCollapsed]);

  // Load code snippet when issue is available and has a file + line.
  // Uses a range that covers ALL issues in the same file (from scopeIssues)
  // so that every inline annotation is visible without additional fetches.
  // When switching between issues in the SAME file, the existing snippet
  // already covers them — no re-fetch, no loading flash.
  useEffect(() => {
    if (!issue || !currentWorkspace || !namespace) return;
    if (!issue.file || !issue.line || issue.line <= 0) {
      setSnippet(null);
      return;
    }
    // Need at least one source: analysisId, branch, or prNumber
    if (!issue.analysisId && !issue.branch && !issue.prNumber) {
      setSnippet(null);
      return;
    }

    const MARGIN = 10;

    // Compute the range that covers ALL same-file issues (not just the current one)
    const sameFileLines = sameFileIssueKey
      ? sameFileIssueKey.split(",").map(Number)
      : [issue.line];
    let rangeStart = Math.max(
      1,
      Math.min(...sameFileLines, issue.line) - MARGIN,
    );
    let rangeEnd = Math.max(...sameFileLines, issue.line) + MARGIN;

    // Check if existing snippet already covers this range (via ref, avoids stale closure)
    const existing = snippetRangeRef.current;
    if (existing && existing.file === issue.file) {
      if (rangeStart >= existing.start && rangeEnd <= existing.end) {
        // Snippet already covers every same-file issue — nothing to fetch
        return;
      }
      // Merge with existing range so we never shrink the visible window
      rangeStart = Math.max(1, Math.min(existing.start, rangeStart));
      rangeEnd = Math.max(existing.end, rangeEnd);
    }

    const isSameFile = existing?.file === issue.file;
    let cancelled = false;

    const fetchSnippet = async () => {
      // Only show the loading skeleton for the very first load or a file change;
      // same-file expansions keep the current snippet visible.
      if (!isSameFile) setSnippetLoading(true);

      try {
        let data: FileSnippetResponse | null = null;

        // When in branch context the branch file snapshot is the most
        // up-to-date source — try it first.  For PR / analysis context
        // we keep the original priority: analysis → branch → PR.
        const inBranchScope = !!scopeBranch;

        if (inBranchScope) {
          // ── Branch context: branch → analysis → PR ──
          if (!data && issue.branch) {
            try {
              data = await analysisService.getBranchFileSnippetByRange(
                currentWorkspace.slug,
                namespace,
                issue.branch,
                issue.file,
                rangeStart,
                rangeEnd,
              );
            } catch {
              /* fallback */
            }
          }
          if (!data && issue.analysisId) {
            try {
              data = await analysisService.getFileSnippetByRange(
                currentWorkspace.slug,
                namespace,
                issue.analysisId,
                issue.file,
                rangeStart,
                rangeEnd,
              );
            } catch {
              /* fallback */
            }
          }
          if (!data && issue.prNumber) {
            try {
              data = await analysisService.getPrFileSnippetByRange(
                currentWorkspace.slug,
                namespace,
                issue.prNumber,
                issue.file,
                rangeStart,
                rangeEnd,
              );
            } catch {
              /* all sources failed */
            }
          }
        } else {
          // ── PR / analysis context: analysis → branch → PR ──
          if (issue.analysisId) {
            try {
              data = await analysisService.getFileSnippetByRange(
                currentWorkspace.slug,
                namespace,
                issue.analysisId,
                issue.file,
                rangeStart,
                rangeEnd,
              );
            } catch {
              /* fallback */
            }
          }
          if (!data && issue.branch) {
            try {
              data = await analysisService.getBranchFileSnippetByRange(
                currentWorkspace.slug,
                namespace,
                issue.branch,
                issue.file,
                rangeStart,
                rangeEnd,
              );
            } catch {
              /* fallback */
            }
          }
          if (!data && issue.prNumber) {
            try {
              data = await analysisService.getPrFileSnippetByRange(
                currentWorkspace.slug,
                namespace,
                issue.prNumber,
                issue.file,
                rangeStart,
                rangeEnd,
              );
            } catch {
              /* all sources failed */
            }
          }
        }

        if (!cancelled) {
          if (!data) {
            console.warn(
              "[IssueDetails] All snippet sources failed for",
              issue.file,
              {
                branch: issue.branch,
                analysisId: issue.analysisId,
                prNumber: issue.prNumber,
                scopeBranch,
              },
            );
          }
          setSnippet(data);
          setSnippetLoading(false);
        }
      } catch {
        if (!cancelled) {
          if (!isSameFile) setSnippet(null);
          setSnippetLoading(false);
        }
      }
    };

    fetchSnippet();
    return () => {
      cancelled = true;
    };
  }, [
    issue?.id,
    issue?.analysisId,
    sameFileIssueKey,
    currentWorkspace,
    namespace,
    scopeBranch,
  ]);

  // Expand snippet up or down by 50 lines
  const handleSnippetExpand = useCallback(
    async (direction: "up" | "down" | "all") => {
      if (!snippet || !issue || !currentWorkspace || !namespace) return;
      // Need at least one source
      if (!issue.analysisId && !issue.branch && !issue.prNumber) return;

      const EXPAND_LINES = 50;
      const newStart =
        direction === "up"
          ? Math.max(1, snippet.startLine - EXPAND_LINES)
          : direction === "all"
            ? 1
            : snippet.startLine;
      const newEnd =
        direction === "down"
          ? Math.min(snippet.totalLineCount, snippet.endLine + EXPAND_LINES)
          : direction === "all"
            ? snippet.totalLineCount
            : snippet.endLine;

      // No change — already at file boundary
      if (newStart === snippet.startLine && newEnd === snippet.endLine) return;

      setSnippetExpanding(direction);
      try {
        let data: FileSnippetResponse | null = null;

        // Use same priority as the initial snippet fetch:
        // branch context → branch first; otherwise analysis first.
        const inBranchScope = !!scopeBranch;

        if (inBranchScope) {
          if (!data && issue.branch) {
            try {
              data = await analysisService.getBranchFileSnippetByRange(
                currentWorkspace.slug,
                namespace,
                issue.branch,
                snippet.filePath,
                newStart,
                newEnd,
              );
            } catch {
              /* fallback */
            }
          }
          if (!data && issue.analysisId) {
            try {
              data = await analysisService.getFileSnippetByRange(
                currentWorkspace.slug,
                namespace,
                issue.analysisId,
                snippet.filePath,
                newStart,
                newEnd,
              );
            } catch {
              /* fallback */
            }
          }
          if (!data && issue.prNumber) {
            try {
              data = await analysisService.getPrFileSnippetByRange(
                currentWorkspace.slug,
                namespace,
                issue.prNumber,
                snippet.filePath,
                newStart,
                newEnd,
              );
            } catch {
              /* all failed */
            }
          }
        } else {
          if (issue.analysisId) {
            try {
              data = await analysisService.getFileSnippetByRange(
                currentWorkspace.slug,
                namespace,
                issue.analysisId,
                snippet.filePath,
                newStart,
                newEnd,
              );
            } catch {
              /* fallback */
            }
          }
          if (!data && issue.branch) {
            try {
              data = await analysisService.getBranchFileSnippetByRange(
                currentWorkspace.slug,
                namespace,
                issue.branch,
                snippet.filePath,
                newStart,
                newEnd,
              );
            } catch {
              /* fallback */
            }
          }
          if (!data && issue.prNumber) {
            try {
              data = await analysisService.getPrFileSnippetByRange(
                currentWorkspace.slug,
                namespace,
                issue.prNumber,
                snippet.filePath,
                newStart,
                newEnd,
              );
            } catch {
              /* all failed */
            }
          }
        }

        if (data) {
          setSnippet(data);
        } else {
          toast({
            title: "Could not expand source context",
            description:
              "No source snapshot is available for this file. Try re-running the analysis.",
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Failed to expand source context",
          description: "An unexpected error occurred while loading more lines.",
          variant: "destructive",
        });
      } finally {
        setSnippetExpanding(null);
      }
    },
    [snippet, issue, currentWorkspace, namespace, scopeBranch, toast],
  );

  // Detect language from file extension for syntax highlighting
  const detectLanguageForFile = (filepath: string): string => {
    const ext = filepath.split(".").pop()?.toLowerCase() || "";
    const langMap: Record<string, string> = {
      ts: "typescript",
      tsx: "tsx",
      js: "javascript",
      jsx: "jsx",
      py: "python",
      java: "java",
      kt: "kotlin",
      kts: "kotlin",
      php: "php",
      rb: "ruby",
      go: "go",
      rs: "rust",
      c: "c",
      cpp: "cpp",
      h: "c",
      hpp: "cpp",
      cs: "csharp",
      swift: "swift",
      html: "html",
      css: "css",
      scss: "scss",
      less: "less",
      json: "json",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
      toml: "toml",
      sql: "sql",
      sh: "bash",
      bash: "bash",
      md: "markdown",
      dockerfile: "docker",
      gradle: "groovy",
      groovy: "groovy",
    };
    return langMap[ext] || "text";
  };

  const getIssueUrl = (targetIssueId: string) => {
    const params = new URLSearchParams();
    if (scopeBranch) params.set("branch", scopeBranch);
    if (returnPath) params.set("returnPath", returnPath);
    if (returnTab) params.set("returnTab", returnTab);
    // Preserve PR scope parameters
    if (scopePrNumber) params.set("prNumber", scopePrNumber);
    if (scopePrVersion) params.set("prVersion", scopePrVersion);
    // Preserve filter parameters
    if (filterSeverity) params.set("severity", filterSeverity);
    if (filterStatus) params.set("status", filterStatus);
    if (filterCategory) params.set("category", filterCategory);

    return routes.issueDetail(
      namespace!,
      targetIssueId,
      Object.fromEntries(params),
    );
  };

  const navigateToIssue = (e: React.MouseEvent, targetIssueId: string) => {
    // Allow ctrl+click and middle-click to open in new tab
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      return;
    }
    e.preventDefault();

    // Pass scopeIssues via route state to avoid reloading
    // Use replace: true to update URL without adding to history stack (avoids full re-render)
    navigate(getIssueUrl(targetIssueId), {
      state: { scopeIssues },
      replace: true,
    });
  };

  const handleUpdateIssueStatus = async (newStatus: "open" | "resolved") => {
    if (!currentWorkspace || !namespace || !issueId) return;

    try {
      const isResolved = newStatus === "resolved";

      // Capture PR context if we're viewing from a PR scope
      const prNumber = scopePrNumber ? parseInt(scopePrNumber) : undefined;
      // Use the issue's commit hash as context for the resolution
      const commitHash = issue?.commitHash || undefined;

      // When the issue detail was loaded via the branch endpoint the ID
      // is a BranchIssue PK — use the branch-specific status endpoint
      // so we update the correct entity without touching the immutable
      // PR-level CodeAnalysisIssue.
      const response = scopeBranch
        ? await analysisService.updateBranchIssueStatus(
            currentWorkspace.slug,
            namespace,
            issueId,
            isResolved,
            undefined, // comment
            isResolved ? prNumber : undefined,
            isResolved ? commitHash : undefined,
          )
        : await analysisService.updateIssueStatus(
            currentWorkspace.slug,
            namespace,
            issueId,
            isResolved,
            undefined, // comment
            isResolved ? prNumber : undefined,
            isResolved ? commitHash : undefined,
          );

      if (!response.success) {
        throw new Error(
          response.errorMessage || "Failed to update issue status",
        );
      }

      // Update local state with resolution info
      const now = new Date().toISOString();
      setIssue((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              resolvedAt: isResolved ? now : null,
              resolvedBy: isResolved ? "manual" : null,
              resolvedByPr: isResolved ? prNumber : null,
              resolvedCommitHash: isResolved ? commitHash : null,
            }
          : null,
      );

      // Update in scope list too
      setScopeIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)),
      );
      toast({
        title: "Success",
        description: "Issue status updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update issue status",
        description: error.message || "Could not update issue status",
        variant: "destructive",
      });
    }
  };

  const getSeverityBadge = (severity: string, minimal: boolean = false) => {
    const colors = {
      high: "bg-red-200 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      medium:
        "bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      low: "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300",
    };

    const displayText = severity.toUpperCase();

    if (minimal) {
      return (
        <Badge
          className={`shrink-0 h-4 w-4 ${colors[severity as keyof typeof colors] || colors.medium}`}
        />
      );
    }
    return (
      <Badge
        className={colors[severity as keyof typeof colors] || colors.medium}
      >
        {displayText}
      </Badge>
    );
  };

  const renderDiff = (diffContent: string) => {
    if (!diffContent) return null;

    // Parse the diff to extract file information and detect language
    const detectLanguage = (filepath: string): string => {
      const ext = filepath.split(".").pop()?.toLowerCase() || "";
      const langMap: Record<string, string> = {
        ts: "typescript",
        tsx: "tsx",
        js: "javascript",
        jsx: "jsx",
        py: "python",
        java: "java",
        php: "php",
        rb: "ruby",
        go: "go",
        rs: "rust",
        c: "c",
        cpp: "cpp",
        cs: "csharp",
        html: "html",
        css: "css",
        scss: "scss",
        json: "json",
        xml: "xml",
        yaml: "yaml",
        yml: "yaml",
        sql: "sql",
        sh: "bash",
        md: "markdown",
      };
      return langMap[ext] || "text";
    };

    const lines = diffContent.split("\n");
    const sections: Array<{
      type: "header" | "hunk" | "content";
      content: string;
      language?: string;
    }> = [];
    let currentLanguage = "text";
    let currentHunk: string[] = [];
    let inHunkContent = false;

    lines.forEach((line, idx) => {
      // File header
      if (
        line.startsWith("diff --git") ||
        line.startsWith("---") ||
        line.startsWith("+++")
      ) {
        if (currentHunk.length > 0) {
          sections.push({
            type: "content",
            content: currentHunk.join("\n"),
            language: currentLanguage,
          });
          currentHunk = [];
          inHunkContent = false;
        }

        // Detect language from file path
        if (line.startsWith("+++") || line.startsWith("---")) {
          const match = line.match(/[ab]\/(.*)/);
          if (match) {
            currentLanguage = detectLanguage(match[1]);
          }
        }

        sections.push({ type: "header", content: line });
      }
      // Hunk header
      else if (line.startsWith("@@")) {
        if (currentHunk.length > 0) {
          sections.push({
            type: "content",
            content: currentHunk.join("\n"),
            language: currentLanguage,
          });
          currentHunk = [];
        }
        sections.push({ type: "hunk", content: line });
        inHunkContent = true;
      }
      // Diff content
      else if (inHunkContent) {
        currentHunk.push(line);
      }
      // Fallback
      else {
        sections.push({ type: "header", content: line });
      }
    });

    // Push remaining hunk
    if (currentHunk.length > 0) {
      sections.push({
        type: "content",
        content: currentHunk.join("\n"),
        language: currentLanguage,
      });
    }

    return (
      <div className="rounded-lg overflow-x-auto border border-border">
        <div className="inline-block min-w-full">
          {sections.map((section, idx) => {
            if (section.type === "header") {
              return (
                <div
                  key={idx}
                  className="bg-muted px-4 py-2 text-sm font-mono text-muted-foreground border-b border-border"
                >
                  {section.content}
                </div>
              );
            }

            if (section.type === "hunk") {
              return (
                <div
                  key={idx}
                  className="bg-accent/50 px-4 py-1.5 text-sm font-mono text-accent-foreground border-b border-border"
                >
                  {section.content}
                </div>
              );
            }

            // Render diff content with syntax highlighting
            const diffLines = section.content.split("\n");
            return (
              <div key={idx} className="bg-background">
                {diffLines.map((line, lineIdx) => {
                  const isAddition =
                    line.startsWith("+") && !line.startsWith("+++");
                  const isDeletion =
                    line.startsWith("-") && !line.startsWith("---");
                  const isContext = line.startsWith(" ");

                  // Extract the actual code (remove +/- prefix)
                  const code =
                    isAddition || isDeletion ? line.substring(1) : line;

                  let bgClass = "";
                  let borderClass = "";

                  if (isAddition) {
                    bgClass = "bg-green-500/10 dark:bg-green-500/20";
                    borderClass = "border-l-2 border-green-500";
                  } else if (isDeletion) {
                    bgClass = "bg-red-500/10 dark:bg-red-500/20";
                    borderClass = "border-l-2 border-red-500";
                  }

                  return (
                    <div
                      key={lineIdx}
                      className={`flex font-mono text-sm ${bgClass} ${borderClass}`}
                    >
                      <span className="inline-block w-12 text-right pr-4 text-muted-foreground/50 select-none flex-shrink-0">
                        {lineIdx + 1}
                      </span>
                      <span className="inline-block w-6 text-center flex-shrink-0 select-none text-muted-foreground/70">
                        {isAddition ? "+" : isDeletion ? "-" : " "}
                      </span>
                      <div className="flex-1">
                        <SyntaxHighlighter
                          language={section.language || "text"}
                          style={theme === "dark" ? vscDarkPlus : vs}
                          wrapLongLines={false}
                          customStyle={{
                            margin: 0,
                            padding: "0.125rem 0.75rem",
                            background: "transparent",
                            fontSize: "0.875rem",
                            lineHeight: "1.5",
                            border: "none",
                          }}
                          codeTagProps={{
                            style: {
                              fontFamily: "inherit",
                            },
                          }}
                          PreTag="span"
                        >
                          {code}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading && !issue) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!issue) {
    // Determine fallback URL - if we have branch scope, go back to branch issues
    let backUrl = returnPath;
    if (!backUrl) {
      if (scopeBranch) {
        backUrl = routes.branchIssues(namespace!, scopeBranch);
      } else {
        backUrl = routes.projectDetail(namespace!);
      }
    }
    // Append returnTab to backUrl if we have it
    if (returnTab && backUrl) {
      const separator = backUrl.includes("?") ? "&" : "?";
      backUrl = `${backUrl}${separator}returnTab=${returnTab}`;
    }

    return (
      <div className="mx-auto p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link
            to={backUrl}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey || e.button === 1) return;
              e.preventDefault();
              navigate(-1);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analysis
          </Link>
        </Button>
        <div className="mt-6">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Issue Not Found</h3>
              <p className="text-muted-foreground">
                The requested issue could not be loaded.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Use description (detailed reason) if available, fallback to suggestedFixDescription for older issues
  const descriptionText = issue.description || issue.suggestedFixDescription;
  const diffContent = issue.suggestedFixDiff;

  // Determine back URL - if we have branch scope, go back to branch issues
  // Also append returnTab to ensure correct tab is restored
  let backUrl = returnPath;
  if (!backUrl) {
    if (scopeBranch) {
      backUrl = routes.branchIssues(namespace!, scopeBranch);
    } else {
      backUrl = routes.projectDetail(namespace!);
    }
  }
  // Append returnTab to backUrl if we have it
  if (returnTab && backUrl) {
    const separator = backUrl.includes("?") ? "&" : "?";
    backUrl = `${backUrl}${separator}returnTab=${returnTab}`;
  }

  // Find current issue index in scope list
  const currentIndex = scopeIssues.findIndex((i) => i.id === issueId);
  const prevIssue = currentIndex > 0 ? scopeIssues[currentIndex - 1] : null;
  const nextIssue =
    currentIndex < scopeIssues.length - 1
      ? scopeIssues[currentIndex + 1]
      : null;

  return (
    <div className="container mx-auto py-4 lg:py-6 h-[calc(100vh-64px)]">
      <div className="flex h-full w-full overflow-hidden rounded-xl border border-border/50 shadow-sm relative">
        {/* Left Sidebar - Issues List */}
        <div
          className={cn(
            "border-r border-border/50 bg-card/60 backdrop-blur-xl transition-all duration-300 flex flex-col z-10 shrink-0",
            sidebarCollapsed ? "w-12 items-center" : "w-80 max-w-[320px]",
          )}
        >
          {/* Sidebar Toggle */}
          <div className="p-3 border-b border-border/50 flex items-center justify-between min-h-[53px]">
            {!sidebarCollapsed && (
              <span className="text-sm font-semibold tracking-tight">
                Issues{" "}
                <Badge
                  variant="secondary"
                  className="ml-1 px-1.5 font-mono text-[10px]"
                >
                  {scopeIssues.length}
                </Badge>
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 p-0 shrink-0 rounded-md hover:bg-primary/10 hover:text-primary transition-colors",
                sidebarCollapsed && "w-8 h-8",
              )}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <ScrollArea className="flex-1 w-full overflow-hidden [&>div>div]:!block">
              {scopeLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : scopeIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 p-6 text-center text-sm text-muted-foreground w-full">
                  <CheckCircle className="h-8 w-8 mb-2 opacity-20" />
                  <p>No issues in scope</p>
                </div>
              ) : (
                <div className="p-3 space-y-5 overflow-hidden w-full">
                  {(() => {
                    const groups: Record<string, typeof scopeIssues> = {};
                    scopeIssues.forEach((issue) => {
                      const file = issue.file || "Unknown File";
                      if (!groups[file]) groups[file] = [];
                      groups[file].push(issue);
                    });

                    // Sort issues within each group by date (newest first)
                    for (const file of Object.keys(groups)) {
                      groups[file].sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      );
                    }

                    // Sort file groups by most recent issue date (newest first)
                    const groupedIssues = Object.keys(groups)
                      .sort((a, b) => {
                        const aLatest = new Date(
                          groups[a][0].createdAt,
                        ).getTime();
                        const bLatest = new Date(
                          groups[b][0].createdAt,
                        ).getTime();
                        return bLatest - aLatest;
                      })
                      .map((file) => ({
                        file,
                        issues: groups[file],
                      }));

                    return groupedIssues.map((group) => (
                      <div key={group.file} className="space-y-1.5 w-full">
                        <div className="flex items-center gap-2 px-1 text-xs font-semibold text-muted-foreground/80 mb-2">
                          <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          <span
                            className="truncate w-full min-w-0"
                            title={group.file}
                          >
                            <span className="direction-rtl unicode-bidi-plaintext truncate w-full inline-block">
                              {group.file.split(/[/\\]/).pop()}
                            </span>
                          </span>
                        </div>
                        {group.issues.map((scopeIssue) => (
                          <Link
                            key={scopeIssue.id}
                            ref={
                              scopeIssue.id === issueId
                                ? activeSidebarItemRef
                                : undefined
                            }
                            to={getIssueUrl(scopeIssue.id)}
                            onClick={(e) => navigateToIssue(e, scopeIssue.id)}
                            onAuxClick={(e) => {
                              if (e.button === 1) {
                                window.open(
                                  getIssueUrl(scopeIssue.id),
                                  "_blank",
                                );
                              }
                            }}
                            className={cn(
                              "group flex w-full text-left p-2.5 rounded-lg border transition-all duration-200 overflow-hidden relative",
                              scopeIssue.id === issueId
                                ? "bg-primary/10 border-primary/30 shadow-sm"
                                : "bg-background/40 border-transparent hover:bg-background/80 hover:border-border hover:shadow-sm",
                            )}
                          >
                            <div className="flex flex-col min-w-0 w-full">
                              <div className="flex items-start gap-2 max-w-full">
                                <div className="shrink-0 flex items-center justify-center">
                                  {getSeverityBadge(scopeIssue.severity, true)}
                                </div>
                                <p
                                  className={cn(
                                    "text-xs font-medium leading-relaxed break-words flex-1 min-w-0 pr-1",
                                    scopeIssue.id === issueId
                                      ? "text-foreground"
                                      : "text-muted-foreground group-hover:text-foreground transition-colors",
                                  )}
                                  title={scopeIssue.title}
                                >
                                  {scopeIssue.title}
                                </p>
                                {scopeIssue.status === "resolved" && (
                                  <div className="shrink-0 bg-green-500/10 p-0.5 rounded-full ml-auto">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ));
                  })()}
                  {/* Load More button for sidebar when there are more issues */}
                  {scopeTotal > scopeIssues.length && !scopePrNumber && (
                    <div className="pt-2 pb-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground hover:text-foreground"
                        onClick={loadMoreScopeIssues}
                        disabled={scopeLoadingMore}
                      >
                        {scopeLoadingMore
                          ? "Loading..."
                          : `Load more (${scopeIssues.length} of ${scopeTotal})`}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-muted/10 relative min-w-0">
          <div className="px-4 lg:px-8 py-6 w-full max-w-6xl mx-auto">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" asChild>
                <Link
                  to={backUrl}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey || e.button === 1) return;
                    e.preventDefault();
                    navigate(-1);
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>

              {/* Navigation between issues */}
              {scopeIssues.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} of {scopeIssues.length}
                  </span>
                  {prevIssue ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        to={getIssueUrl(prevIssue.id)}
                        onClick={(e) => navigateToIssue(e, prevIssue.id)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  {nextIssue ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        to={getIssueUrl(nextIssue.id)}
                        onClick={(e) => navigateToIssue(e, nextIssue.id)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Issue Header - Compact Metadata Bar */}
            <div className="flex justify-between gap-x-4">
              <div className="bg-card border rounded-lg p-4 mb-6 w-full">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <h1 className="text-lg font-bold leading-tight">
                      {issue.title}
                    </h1>
                    <div className="flex gap-x-4 text-xs"></div>
                  </div>
                  {canManageWorkspace() && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={issue.status}
                        onValueChange={(value) =>
                          handleUpdateIssueStatus(value as "open" | "resolved")
                        }
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {getSeverityBadge(issue.severity)}
                  {issue.issueCategory && (
                    <Badge
                      variant="outline"
                      className={cn(
                        getCategoryInfo(issue.issueCategory).color,
                        getCategoryInfo(issue.issueCategory).bgColor,
                        getCategoryInfo(issue.issueCategory).borderColor,
                        "text-xs",
                      )}
                    >
                      {getCategoryInfo(issue.issueCategory).label}
                    </Badge>
                  )}
                  {issue.issueScope && (
                    <Badge
                      variant="outline"
                      className="text-xs border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                    >
                      <Braces className="h-3 w-3 mr-1" />
                      {issue.issueScope === "FUNCTION"
                        ? "Function"
                        : issue.issueScope === "FILE"
                          ? "File"
                          : issue.issueScope === "BLOCK"
                            ? "Block"
                            : "Line"}
                    </Badge>
                  )}
                  <Separator orientation="vertical" className="h-4" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            const fullPath = `${issue.file}${issue.line > 0 ? `:${issue.line}` : ""}`;
                            navigator.clipboard.writeText(fullPath);
                            toast({
                              title: "Copied to clipboard",
                              description: fullPath,
                            });
                          }}
                          className="text-xs text-muted-foreground flex items-center gap-1 max-w-[200px] lg:max-w-[500px] hover:text-foreground transition-colors cursor-pointer group"
                        >
                          <FileText className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{issue.file}</span>
                          {issue.line > 0 && (
                            <span className="flex-shrink-0">:{issue.line}</span>
                          )}
                          <Copy className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono text-xs">
                          {issue.file}
                          {issue.line > 0 ? `:${issue.line}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Click to copy
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    {issue.branch}
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                  {issue.vcsAuthorUsername && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-xs flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium text-foreground/80">
                          {issue.vcsAuthorUsername}
                        </span>
                      </span>
                    </>
                  )}
                  <Separator orientation="vertical" className="h-4" />
                  {issue.prNumber && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      PR #{issue.prNumber}
                    </span>
                  )}
                  <Separator orientation="vertical" className="h-4" />
                  {issue.commitHash && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {issue.commitHash.substring(0, 8)}
                    </span>
                  )}
                  {issue.detectionSource === "DIRECT_PUSH_ANALYSIS" && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="text-xs flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-medium">
                        <GitCommitVertical className="h-3 w-3" />
                        Direct Push
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="md:flex justify-between gap-2">
              {/* Resolution Info - shown when issue is resolved */}
              {issue.status === "resolved" &&
                (issue.resolvedAt ||
                  issue.resolvedBy ||
                  issue.resolvedDescription ||
                  issue.resolvedCommitHash) && (
                  <Card className="mb-6 border-green-500/30 bg-green-500/5 basis-1/2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        Resolution Information
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Details about how and when this issue was resolved
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {issue.resolvedAt && (
                          <div>
                            <span className="text-muted-foreground">
                              Resolved on:
                            </span>
                            <span className="ml-2 font-medium">
                              {new Date(issue.resolvedAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {issue.resolvedBy && (
                          <div>
                            <span className="text-muted-foreground">
                              Resolved by:
                            </span>
                            <span className="ml-2 font-medium">
                              {issue.resolvedBy}
                            </span>
                          </div>
                        )}
                        {issue.resolvedByPr && (
                          <div>
                            <span className="text-muted-foreground">
                              Resolved in PR:
                            </span>
                            {buildPrUrl(issue.resolvedByPr) ? (
                              <a
                                href={buildPrUrl(issue.resolvedByPr)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 font-medium text-green-600 dark:text-green-400 hover:underline inline-flex items-center gap-1"
                              >
                                #{issue.resolvedByPr}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="ml-2 font-medium">
                                #{issue.resolvedByPr}
                              </span>
                            )}
                          </div>
                        )}
                        {issue.resolvedCommitHash && (
                          <div>
                            <span className="text-muted-foreground">
                              Resolved in commit:
                            </span>
                            <span className="ml-2 font-mono font-medium">
                              {issue.resolvedCommitHash.substring(0, 8)}
                            </span>
                          </div>
                        )}
                      </div>
                      {issue.resolvedDescription && (
                        <div className="pt-2 border-t">
                          <span className="text-muted-foreground text-sm">
                            Resolution explanation:
                          </span>
                          <p className="mt-1 text-sm text-foreground leading-relaxed">
                            {issue.resolvedDescription}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Original Issue Detection Info */}
              {(issue.analysisId || issue.prNumber || issue.commitHash) && (
                <Card
                  className={cn(
                    "mb-6 basis-1/2 grow",
                    issue.detectionSource === "DIRECT_PUSH_ANALYSIS"
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-blue-500/30 bg-blue-500/5",
                  )}
                >
                  <CardHeader className="pb-3">
                    <CardTitle
                      className={cn(
                        "text-base flex items-center gap-2",
                        issue.detectionSource === "DIRECT_PUSH_ANALYSIS"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-blue-600 dark:text-blue-400",
                      )}
                    >
                      {issue.detectionSource === "DIRECT_PUSH_ANALYSIS" ? (
                        <GitCommitVertical className="h-4 w-4" />
                      ) : (
                        <GitPullRequest className="h-4 w-4" />
                      )}
                      Original Detection
                      {issue.detectionSource && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "ml-2 text-[10px] font-semibold",
                            issue.detectionSource === "DIRECT_PUSH_ANALYSIS"
                              ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
                          )}
                        >
                          {issue.detectionSource === "DIRECT_PUSH_ANALYSIS"
                            ? "Direct Push"
                            : "PR Analysis"}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {issue.detectionSource === "DIRECT_PUSH_ANALYSIS"
                        ? "Detected via direct commit analysis (no PR)"
                        : "Where this issue was first identified"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {issue.analysisId && (
                        <div>
                          <span className="text-muted-foreground">
                            Analysis ID:
                          </span>
                          <span className="ml-2 font-medium">
                            #{issue.analysisId}
                          </span>
                        </div>
                      )}
                      {snippet &&
                        (issue.branch ||
                          issue.prNumber ||
                          issue.analysisId) && (
                          <div className="flex items-center">
                            <Link
                              to={
                                issue.branch
                                  ? routes.branchSourceView(
                                      namespace!,
                                      issue.branch,
                                      {
                                        file: issue.file || "",
                                        issueId: String(issue.id),
                                      },
                                    )
                                  : issue.prNumber
                                    ? routes.prSourceView(
                                        namespace!,
                                        issue.prNumber,
                                        {
                                          file: issue.file || "",
                                          issueId: String(issue.id),
                                        },
                                      )
                                    : routes.analysisSourceView(
                                        namespace!,
                                        issue.analysisId!,
                                        {
                                          file: issue.file || "",
                                          issueId: String(issue.id),
                                        },
                                      )
                              }
                              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                              View Source
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        )}
                      {issue.prNumber && (
                        <div>
                          <span className="text-muted-foreground">
                            Detected in PR:
                          </span>
                          {buildPrUrl(issue.prNumber) ? (
                            <a
                              href={buildPrUrl(issue.prNumber)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                            >
                              #{issue.prNumber}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="ml-2 font-medium">
                              #{issue.prNumber}
                            </span>
                          )}
                        </div>
                      )}
                      {issue.commitHash && (
                        <div>
                          <span className="text-muted-foreground">
                            Detected in commit:
                          </span>
                          <span className="ml-2 font-mono font-medium">
                            {issue.commitHash.substring(0, 8)}
                          </span>
                        </div>
                      )}
                      {issue.detectedAt && (
                        <div>
                          <span className="text-muted-foreground">
                            Detected on:
                          </span>
                          <span className="ml-2 font-medium">
                            {new Date(issue.detectedAt).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Inline Source Code Snippet */}
            {/* For resolved branch issues the line numbers may have drifted,
                so we hide the (possibly misleading) branch file snippet and
                show a link to the original PR-level issue instead. */}
            {scopeBranch &&
            issue.status === "resolved" &&
            (issue.originIssueId || issue.prNumber || issue.analysisId) ? (
              <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Code2 className="h-4 w-4" />
                    Source Context Unavailable
                  </CardTitle>
                  <CardDescription className="text-xs">
                    This issue has been resolved and the file may have changed
                    since detection. The source code snippet is hidden because
                    line numbers may no longer match.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {issue.originIssueId ? (
                    <Link
                      to={routes.issueDetail(
                        namespace!,
                        String(issue.originIssueId),
                        {
                          ...(issue.prNumber
                            ? { prNumber: String(issue.prNumber) }
                            : {}),
                        },
                      )}
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <GitPullRequest className="h-4 w-4" />
                      View original issue in PR context
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : issue.analysisId ? (
                    <Link
                      to={routes.analysisSourceView(
                        namespace!,
                        issue.analysisId,
                        {
                          file: issue.file || "",
                          issueId: String(issue.id),
                        },
                      )}
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Code2 className="h-4 w-4" />
                      View original source in analysis snapshot
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : null}
                </CardContent>
              </Card>
            ) : (snippet || snippetLoading) && issue ? (
              <Card className="mb-6 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Code2 className="h-4 w-4" />
                      Source Context
                    </CardTitle>
                    {snippet &&
                      (issue.branch || issue.prNumber || issue.analysisId) && (
                        <Link
                          to={
                            issue.branch
                              ? routes.branchSourceView(
                                  namespace!,
                                  issue.branch,
                                  {
                                    file: issue.file || "",
                                    issueId: String(issue.id),
                                  },
                                )
                              : issue.prNumber
                                ? routes.prSourceView(
                                    namespace!,
                                    issue.prNumber,
                                    {
                                      file: issue.file || "",
                                      issueId: String(issue.id),
                                    },
                                  )
                                : routes.analysisSourceView(
                                    namespace!,
                                    issue.analysisId!,
                                    {
                                      file: issue.file || "",
                                      issueId: String(issue.id),
                                    },
                                  )
                          }
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View full file
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                  </div>
                  {snippet && (
                    <CardDescription className="text-xs font-mono">
                      {snippet.filePath}
                      <span className="text-muted-foreground/50 ml-2">
                        lines {snippet.startLine}–{snippet.endLine} of{" "}
                        {snippet.totalLineCount}
                      </span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {snippetLoading ? (
                    <div className="p-4 space-y-2">
                      {[...Array(8)].map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-5 w-full"
                          style={{ width: `${50 + Math.random() * 50}%` }}
                        />
                      ))}
                    </div>
                  ) : snippet ? (
                    <IssueCodeSnippet
                      key={issueId}
                      snippet={snippet}
                      issueLineNumber={issue.line}
                      activeIssue={{
                        issueId: issueId!,
                        lineNumber: issue.line,
                        severity: issue.severity,
                        title: issue.title,
                        category: issue.issueCategory,
                      }}
                      theme={theme}
                      language={detectLanguageForFile(snippet.filePath)}
                      onExpand={handleSnippetExpand}
                      expanding={snippetExpanding}
                      onIssueSelect={(inlineIssue) => {
                        // Find the matching scope issue by title and navigate to it
                        const match = scopeIssues.find(
                          (si) =>
                            si.title === inlineIssue.title &&
                            si.file === issue.file,
                        );
                        if (match) {
                          navigate(getIssueUrl(match.id), {
                            state: { scopeIssues },
                            replace: true,
                          });
                        }
                      }}
                    />
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {/* Issue Content */}
            <div className="space-y-6">
              {/* Description */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Issue Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {descriptionText ? (
                    <MarkdownRenderer
                      content={descriptionText}
                      className="text-sm leading-relaxed"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No description available.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Code Diff */}
              {diffContent && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Suggested Fix</CardTitle>
                    <CardDescription className="text-xs">
                      Suggested code change to resolve this issue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>{renderDiff(diffContent)}</CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline Code Snippet Component ───────────────────────────────────

function severityLineHighlightClass(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "high") return "bg-red-500/15 dark:bg-red-500/10";
  if (s === "medium") return "bg-yellow-500/15 dark:bg-yellow-500/10";
  if (s === "low") return "bg-green-500/10 dark:bg-green-500/8";
  return "bg-blue-500/10 dark:bg-blue-500/8";
}

function severityGutterBorder(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "high") return "border-l-2 border-red-500";
  if (s === "medium") return "border-l-2 border-yellow-500";
  if (s === "low") return "border-l-2 border-green-500";
  return "border-l-2 border-blue-400";
}

/** Softer background for scope-range (non-anchor) lines */
function severityScopeLineClass(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "high") return "bg-red-500/5 dark:bg-red-500/[0.03]";
  if (s === "medium") return "bg-yellow-500/5 dark:bg-yellow-500/[0.03]";
  if (s === "low") return "bg-green-500/5 dark:bg-green-500/[0.03]";
  return "bg-blue-500/5 dark:bg-blue-500/[0.03]";
}

/** Dashed gutter for scope-range (non-anchor) lines */
function severityScopeGutterBorder(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "high") return "border-l-2 border-dashed border-red-500/40";
  if (s === "medium") return "border-l-2 border-dashed border-yellow-500/40";
  if (s === "low") return "border-l-2 border-dashed border-green-500/40";
  return "border-l-2 border-dashed border-blue-400/40";
}

function SeverityIconSmall({ severity }: { severity: string }) {
  const s = severity.toLowerCase();
  if (s === "high") return <AlertCircle className="h-3 w-3 text-red-500" />;
  if (s === "medium")
    return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
  if (s === "low") return <Info className="h-3 w-3 text-green-500" />;
  return <Info className="h-3 w-3 text-blue-400" />;
}

interface IssueCodeSnippetProps {
  snippet: FileSnippetResponse;
  issueLineNumber: number;
  activeIssue?: {
    issueId: string;
    lineNumber: number;
    severity: string;
    title: string;
    category?: string;
  };
  theme: string;
  language: string;
  onExpand?: (direction: "up" | "down" | "all") => void;
  expanding?: "up" | "down" | "all" | null;
  /** Called when a non-active inline issue annotation is clicked */
  onIssueSelect?: (issue: InlineIssue) => void;
}

function IssueCodeSnippet({
  snippet,
  issueLineNumber,
  activeIssue,
  theme: themeMode,
  language,
  onExpand,
  expanding,
  onIssueSelect,
}: IssueCodeSnippetProps) {
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Scroll to the active issue line whenever the highlighted line changes
  useEffect(() => {
    const timer = setTimeout(() => {
      activeLineRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 60);
    return () => clearTimeout(timer);
  }, [issueLineNumber]);

  // Build a set of lines that have issues for quick lookup.
  // Aggressively deduplicate to avoid showing the same issue twice
  // (can happen when branch tracking creates copies without content_fingerprint,
  // or when PR analysis + branch tracking both produce entries).
  const issuesByLine = new Map<number, InlineIssue[]>();
  const seenIssueIds = new Set<number>();
  const seenNormKeys = new Set<string>();

  const normalizeTitle = (t: string | null | undefined) =>
    (t ?? "").trim().toLowerCase();

  snippet.issues.forEach((issue) => {
    // Skip exact duplicate issueIds
    if (seenIssueIds.has(issue.issueId)) return;
    // Skip same line + same normalized title (catches slightly differing whitespace / case)
    const normKey = `${issue.lineNumber}:${normalizeTitle(issue.title)}`;
    if (seenNormKeys.has(normKey)) return;
    seenIssueIds.add(issue.issueId);
    seenNormKeys.add(normKey);

    // For BLOCK/FUNCTION/FILE scopes with an endLineNumber, expand across the full range
    const scope = issue.issueScope;
    if (
      scope &&
      scope !== "LINE" &&
      issue.endLineNumber != null &&
      issue.endLineNumber > issue.lineNumber
    ) {
      const rangeStart = Math.min(
        issue.scopeStartLine ?? issue.lineNumber,
        issue.lineNumber,
      );
      const rangeEnd = issue.endLineNumber;
      for (let ln = rangeStart; ln <= rangeEnd; ln++) {
        const existing = issuesByLine.get(ln) || [];
        existing.push(issue);
        issuesByLine.set(ln, existing);
      }
    } else {
      const existing = issuesByLine.get(issue.lineNumber) || [];
      existing.push(issue);
      issuesByLine.set(issue.lineNumber, existing);
    }
  });

  // Ensure the active issue always has an annotation card on its line,
  // but ONLY if the snippet has zero issues on that line already.
  // The snippet endpoint returns all branch/analysis issues for the file,
  // so if the line already has annotations the active issue is already covered
  // (possibly with a slightly different title from a different analysis run).
  if (activeIssue && activeIssue.lineNumber > 0) {
    const lineIssues = issuesByLine.get(activeIssue.lineNumber);
    if (!lineIssues || lineIssues.length === 0) {
      const newEntry: InlineIssue = {
        issueId: Number(activeIssue.issueId) || 0,
        lineNumber: activeIssue.lineNumber,
        severity: activeIssue.severity,
        title: activeIssue.title,
        reason: "",
        category: activeIssue.category || "",
        resolved: false,
        suggestedFixDescription: null,
        suggestedFixDiff: null,
        trackedFromIssueId: null,
        trackingConfidence: null,
        issueScope: null,
        endLineNumber: null,
        scopeStartLine: null,
      };
      issuesByLine.set(activeIssue.lineNumber, [newEntry]);
    }
  }

  const canExpandUp = snippet.startLine > 1;
  const canExpandDown = snippet.endLine < snippet.totalLineCount;

  return (
    <div className="font-mono text-[13px] leading-[1.6] overflow-x-auto">
      {/* Expand up button */}
      {canExpandUp && (
        <button
          onClick={() => onExpand?.("up")}
          disabled={expanding === "up" || expanding === "all"}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-b border-border/30 disabled:opacity-50"
        >
          {expanding === "up" ? (
            <span className="animate-pulse">Loading...</span>
          ) : (
            <>
              <svg
                className="h-3 w-3"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 8L6 4L10 8" />
              </svg>
              <span>
                Show {Math.min(50, snippet.startLine - 1)} more lines above
              </span>
              <svg
                className="h-3 w-3"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 8L6 4L10 8" />
              </svg>
            </>
          )}
        </button>
      )}

      {snippet.lines.map((line) => {
        const lineIssues = issuesByLine.get(line.lineNumber);
        const hasIssue = !!lineIssues && lineIssues.length > 0;
        const isIssueLine = line.lineNumber === issueLineNumber;

        // Determine if this is an anchor line (primary lineNumber) or
        // just a scope-range line (included via scope expansion)
        const isAnchorLine =
          hasIssue &&
          lineIssues!.some((iss) => iss.lineNumber === line.lineNumber);

        // Find highest severity for this line
        const highestSeverity = lineIssues
          ? lineIssues.reduce((prev, curr) => {
              const order: Record<string, number> = {
                high: 0,
                medium: 1,
                low: 2,
                info: 3,
              };
              return (order[curr.severity.toLowerCase()] ?? 9) <
                (order[prev.severity.toLowerCase()] ?? 9)
                ? curr
                : prev;
            }).severity
          : null;

        return (
          <div
            key={line.lineNumber}
            ref={isIssueLine ? activeLineRef : undefined}
          >
            <div
              className={cn(
                "flex group",
                hasIssue && highestSeverity
                  ? isAnchorLine
                    ? `${severityLineHighlightClass(highestSeverity)} ${severityGutterBorder(highestSeverity)}`
                    : `${severityScopeLineClass(highestSeverity)} ${severityScopeGutterBorder(highestSeverity)}`
                  : "border-l-2 border-transparent",
                isIssueLine &&
                  !hasIssue &&
                  "bg-primary/5 border-l-2 border-primary/40",
              )}
            >
              {/* Line number */}
              <span
                className={cn(
                  "w-12 text-right pr-3 select-none shrink-0 text-muted-foreground/40",
                  hasIssue && "text-muted-foreground/70 font-medium",
                  isIssueLine && "text-primary/70 font-bold",
                )}
              >
                {line.lineNumber}
              </span>

              {/* Issue severity icon */}
              <div className="w-5 shrink-0 flex items-center justify-center">
                {isAnchorLine && highestSeverity && (
                  <SeverityIconSmall severity={highestSeverity} />
                )}
              </div>

              {/* Code */}
              <div className="flex-1 min-w-0">
                <SyntaxHighlighter
                  language={language}
                  style={themeMode === "dark" ? vscDarkPlus : vs}
                  wrapLongLines={false}
                  customStyle={{
                    margin: 0,
                    padding: "0 0.75rem 0 0",
                    background: "transparent",
                    fontSize: "inherit",
                    lineHeight: "inherit",
                    border: "none",
                  }}
                  codeTagProps={{ style: { fontFamily: "inherit" } }}
                  PreTag="span"
                >
                  {line.content || " "}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* Inline issue annotation cards — only on anchor lines */}
            {isAnchorLine &&
              lineIssues
                ?.filter((iss) => iss.lineNumber === line.lineNumber)
                .map((iss) => {
                  // isIssueLine is the reliable indicator (line highlight works).
                  // For lines with multiple annotations, use normalized title to pick the right one.
                  const isActive =
                    isIssueLine &&
                    activeIssue != null &&
                    (lineIssues!.length === 1 ||
                      normalizeTitle(iss.title) ===
                        normalizeTitle(activeIssue.title));
                  const isClickable = !isActive && onIssueSelect;
                  return (
                    <div
                      key={iss.issueId}
                      className={cn(
                        "ml-12 mr-3 my-1 rounded-md border px-3 py-1.5 text-xs",
                        isActive
                          ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                          : "border-border/50 bg-muted/30",
                        isClickable &&
                          "cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors",
                      )}
                      onClick={
                        isClickable ? () => onIssueSelect(iss) : undefined
                      }
                      role={isClickable ? "button" : undefined}
                      tabIndex={isClickable ? 0 : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <SeverityIconSmall severity={iss.severity} />
                        <Badge
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            iss.severity.toLowerCase() === "high"
                              ? "bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-300"
                              : iss.severity.toLowerCase() === "medium"
                                ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300"
                                : iss.severity.toLowerCase() === "low"
                                  ? "bg-green-200 text-green-800 dark:bg-green-900/60 dark:text-green-300"
                                  : "bg-blue-200 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300",
                          )}
                        >
                          {iss.severity.toUpperCase()}
                        </Badge>
                        {iss.category && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              getCategoryInfo(iss.category).color,
                              getCategoryInfo(iss.category).bgColor,
                              getCategoryInfo(iss.category).borderColor,
                            )}
                          >
                            {getCategoryInfo(iss.category).label}
                          </Badge>
                        )}
                        <span className="text-muted-foreground/70 ml-auto">
                          {iss.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
          </div>
        );
      })}

      {/* Expand down button */}
      {canExpandDown && (
        <button
          onClick={() => onExpand?.("down")}
          disabled={expanding === "down" || expanding === "all"}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t border-border/30 disabled:opacity-50"
        >
          {expanding === "down" ? (
            <span className="animate-pulse">Loading...</span>
          ) : (
            <>
              <svg
                className="h-3 w-3"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 4L6 8L10 4" />
              </svg>
              <span>
                Show {Math.min(50, snippet.totalLineCount - snippet.endLine)}{" "}
                more lines below
              </span>
              <svg
                className="h-3 w-3"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 4L6 8L10 4" />
              </svg>
            </>
          )}
        </button>
      )}

      {/* Show full file button — visible when file is not fully loaded */}
      {(canExpandUp || canExpandDown) && (
        <button
          onClick={() => onExpand?.("all")}
          disabled={expanding === "all"}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t border-border/30 disabled:opacity-50"
        >
          {expanding === "all" ? (
            <span className="animate-pulse">Loading full file...</span>
          ) : (
            <span>Show full file ({snippet.totalLineCount} lines)</span>
          )}
        </button>
      )}
    </div>
  );
}
