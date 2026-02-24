import { useState, useEffect, useCallback, useMemo } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  Link,
} from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import { analysisService } from "@/api_service/analysis/analysisService";
import {
  projectService,
  type BranchDTO,
} from "@/api_service/project/projectService";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Code2,
  GitBranch,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";

/**
 * Branch-level source code viewer.
 *
 * Resolves the latest analysis for a branch, then lazy-loads the existing
 * AnalysisSourceView with that analysisId via client-side redirect.
 * Includes a branch selector dropdown for switching between branches.
 */
export default function BranchSourceView() {
  const { namespace, branchName } = useParams<{
    namespace: string;
    branchName: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const routes = useWorkspaceRoutes();
  const { currentWorkspace } = useWorkspace();

  const [branches, setBranches] = useState<BranchDTO[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [resolving, setResolving] = useState(true);
  const [resolvedAnalysisId, setResolvedAnalysisId] = useState<number | null>(
    null,
  );
  const [noAnalysis, setNoAnalysis] = useState(false);

  const decodedBranch = branchName ? decodeURIComponent(branchName) : "";

  // ── Load available branches ──────────────────────────────────────

  const loadBranches = useCallback(async () => {
    if (!currentWorkspace || !namespace) return;
    try {
      setBranchesLoading(true);
      const data = await projectService.getProjectBranches(
        currentWorkspace.slug,
        namespace,
      );
      setBranches(data);
    } catch {
      // Non-critical — branch selector will just be empty
    } finally {
      setBranchesLoading(false);
    }
  }, [currentWorkspace, namespace]);

  // ── Resolve latest analysis for the current branch ────────────────

  const resolveAnalysis = useCallback(async () => {
    if (!currentWorkspace || !namespace || !decodedBranch) return;
    try {
      setResolving(true);
      setNoAnalysis(false);
      setResolvedAnalysisId(null);
      const result = await analysisService.getLatestBranchAnalysis(
        currentWorkspace.slug,
        namespace,
        decodedBranch,
      );
      setResolvedAnalysisId(result.analysisId);
    } catch {
      setNoAnalysis(true);
      setResolvedAnalysisId(null);
    } finally {
      setResolving(false);
    }
  }, [currentWorkspace, namespace, decodedBranch]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  useEffect(() => {
    resolveAnalysis();
  }, [resolveAnalysis]);

  // ── Redirect to the analysis source view when resolved ────────────

  useEffect(() => {
    if (resolvedAnalysisId && namespace) {
      // Forward any query params (file, issueId) to the analysis source view
      const forwardParams: Record<string, string> = {};
      const file = searchParams.get("file");
      const issueId = searchParams.get("issueId");
      if (file) forwardParams.file = file;
      if (issueId) forwardParams.issueId = issueId;

      navigate(
        routes.analysisSourceView(
          namespace,
          resolvedAnalysisId,
          Object.keys(forwardParams).length > 0 ? forwardParams : undefined,
        ),
        { replace: true },
      );
    }
  }, [resolvedAnalysisId, namespace]);

  // ── Branch selector handler ───────────────────────────────────────

  const handleBranchChange = (newBranch: string) => {
    if (newBranch !== decodedBranch && namespace) {
      navigate(routes.branchSourceView(namespace, newBranch));
    }
  };

  // ── Sort branches: current first, then by updatedAt ───────────────

  const sortedBranches = useMemo(() => {
    return [...branches].sort((a, b) => {
      if (a.branchName === decodedBranch) return -1;
      if (b.branchName === decodedBranch) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [branches, decodedBranch]);

  // ── Resolving / Loading state ─────────────────────────────────────

  if (resolving) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to={routes.projectDetail(namespace!)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <Code2 className="h-4 w-4 text-primary" />
              <span className="font-semibold">Branch Source</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                <GitBranch className="h-3 w-3 mr-1" />
                {decodedBranch}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
            <p className="text-sm text-muted-foreground mt-4">
              Resolving latest analysis for branch...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── No analysis available ─────────────────────────────────────────

  if (noAnalysis) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to={routes.projectDetail(namespace!)}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <Code2 className="h-4 w-4 text-primary" />
              <span className="font-semibold">Branch Source</span>
            </div>
          </div>
          {/* Branch selector */}
          <div className="flex items-center gap-2">
            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={decodedBranch} onValueChange={handleBranchChange}>
              <SelectTrigger className="w-[220px] h-8 text-xs">
                <SelectValue placeholder="Select branch..." />
              </SelectTrigger>
              <SelectContent>
                {sortedBranches.map((branch) => (
                  <SelectItem
                    key={branch.id}
                    value={branch.branchName}
                    className="text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="truncate">{branch.branchName}</span>
                      {branch.totalIssues > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1 py-0"
                        >
                          {branch.totalIssues}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <h2 className="text-lg font-semibold">No Source Files Available</h2>
            <p className="text-muted-foreground text-sm max-w-md">
              No analysis with stored source files was found for branch{" "}
              <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
                {decodedBranch}
              </code>
              . Source files are stored automatically when analyses run.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={routes.projectDetail(namespace!)}>
                  <FileText className="h-4 w-4 mr-1.5" />
                  View Project
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we have a resolved analysis but haven't redirected yet, show a brief loading state
  return (
    <div className="flex-1 flex items-center justify-center h-[calc(100vh-64px)]">
      <div className="text-center space-y-3">
        <Skeleton className="h-8 w-64 mx-auto" />
        <p className="text-sm text-muted-foreground">
          Redirecting to source viewer...
        </p>
      </div>
    </div>
  );
}
