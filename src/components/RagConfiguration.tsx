import { useState, useEffect, useRef } from "react";
import {
  Database,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Square,
  Plus,
  X,
  Info,
  GitBranch,
  Layers,
  ChevronDown,
  ChevronUp,
  Terminal,
  Wifi,
  WifiOff,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  projectService,
  ProjectDTO,
  RagStatusResponse,
  UpdateRagConfigRequest,
  RagIndexingProgressEvent,
  RagIndexingResult,
} from "@/api_service/project/projectService";

interface LogEntry {
  id: number;
  timestamp: Date;
  stage: string;
  message: string;
  type: "info" | "progress" | "complete" | "error";
}

interface RagConfigurationProps {
  workspaceSlug: string;
  project: ProjectDTO;
  onProjectUpdate?: (project: ProjectDTO) => void;
}

export default function RagConfiguration({
  workspaceSlug,
  project,
  onProjectUpdate,
}: RagConfigurationProps) {
  const { toast } = useToast();
  const [ragStatus, setRagStatus] = useState<RagStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState<string | null>(null);
  const [indexingError, setIndexingError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Log window state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogWindowOpen, setIsLogWindowOpen] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const logIdCounter = useRef(0);
  const logScrollRef = useRef<HTMLDivElement>(null);

  // Local form state
  const [enabled, setEnabled] = useState(project.ragConfig?.enabled ?? false);
  const [branch, setBranch] = useState(project.ragConfig?.branch ?? "");
  const [includePatterns, setIncludePatterns] = useState<string[]>(
    project.ragConfig?.includePatterns ?? [],
  );
  const [newIncludePattern, setNewIncludePattern] = useState("");
  const [excludePatterns, setExcludePatterns] = useState<string[]>(
    project.ragConfig?.excludePatterns ?? [],
  );
  const [newPattern, setNewPattern] = useState("");

  // Multi-branch RAG state
  const [multiBranchEnabled, setMultiBranchEnabled] = useState(
    project.ragConfig?.multiBranchEnabled ?? false,
  );
  const [branchRetentionDays, setBranchRetentionDays] = useState(
    project.ragConfig?.branchRetentionDays ?? 30,
  );
  const [isMultiBranchOpen, setIsMultiBranchOpen] = useState(false);

  // Helper to add a log entry
  const addLog = (
    stage: string,
    message: string,
    type: LogEntry["type"] = "info",
  ) => {
    const entry: LogEntry = {
      id: ++logIdCounter.current,
      timestamp: new Date(),
      stage,
      message,
      type,
    };
    setLogs((prev) => [...prev, entry]);
    // Auto-open log window when indexing starts
    if (!isLogWindowOpen && type !== "error") {
      setIsLogWindowOpen(true);
    }
  };

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    loadRagStatus();
  }, [workspaceSlug, project.namespace]);

  // Poll for status updates when indexing is in progress (detected from backend status)
  // Also set local indexing state based on backend status
  useEffect(() => {
    if (ragStatus?.indexStatus?.status === "INDEXING") {
      // Show that indexing is in progress (possibly from another session or before page reload)
      if (!indexing && !sseConnected) {
        setIndexingProgress("Indexing in progress...");
        // Add a log entry if there are no logs (page was reloaded)
        if (logs.length === 0) {
          addLog(
            "system",
            "Detected indexing in progress. Live logs unavailable - page was reloaded during indexing.",
            "info",
          );
        }
      }

      const pollInterval = setInterval(() => {
        loadRagStatus();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(pollInterval);
    } else {
      // If backend says not indexing but we have local progress shown, clear it
      if (indexingProgress === "Indexing in progress..." && !indexing) {
        setIndexingProgress(null);
        // If we were waiting for indexing to finish, add completion log
        if (logs.length > 0 && !sseConnected) {
          const lastLog = logs[logs.length - 1];
          if (lastLog.message.includes("page was reloaded")) {
            addLog("system", "Indexing completed.", "complete");
          }
        }
      }
    }
  }, [ragStatus?.indexStatus?.status, indexing, sseConnected]);

  useEffect(() => {
    // Update local state when project changes
    setEnabled(project.ragConfig?.enabled ?? false);
    setBranch(project.ragConfig?.branch ?? "");
    setExcludePatterns(project.ragConfig?.excludePatterns ?? []);
    // Multi-branch settings
    setMultiBranchEnabled(project.ragConfig?.multiBranchEnabled ?? false);
    setBranchRetentionDays(project.ragConfig?.branchRetentionDays ?? 30);
  }, [project.ragConfig]);

  // Helper to check if reindex is allowed (24h cooldown after successful index)
  const getReindexCooldownInfo = (): {
    isOnCooldown: boolean;
    remainingTime: string | null;
  } => {
    if (!ragStatus?.indexStatus) {
      return { isOnCooldown: false, remainingTime: null };
    }

    const status = ragStatus.indexStatus.status;
    const lastIndexedAt = ragStatus.indexStatus.lastIndexedAt;

    // Only apply cooldown if the last index was successful
    if (status !== "INDEXED" || !lastIndexedAt) {
      return { isOnCooldown: false, remainingTime: null };
    }

    const lastIndexDate = new Date(lastIndexedAt);
    const now = new Date();
    const hoursSinceLastIndex =
      (now.getTime() - lastIndexDate.getTime()) / (1000 * 60 * 60);
    const cooldownHours = 24;

    if (hoursSinceLastIndex < cooldownHours) {
      const remainingHours = Math.ceil(cooldownHours - hoursSinceLastIndex);
      const remainingTime =
        remainingHours > 1
          ? `${remainingHours} hours`
          : `${Math.ceil((cooldownHours - hoursSinceLastIndex) * 60)} minutes`;
      return { isOnCooldown: true, remainingTime };
    }

    return { isOnCooldown: false, remainingTime: null };
  };

  const loadRagStatus = async () => {
    if (!project.namespace) return;

    try {
      setLoading(true);
      const status = await projectService.getRagStatus(
        workspaceSlug,
        project.namespace,
      );
      setRagStatus(status);
    } catch (error: any) {
      console.error("Failed to load RAG status:", error);
      // Don't show error toast for 404 - just means RAG not yet set up
      if (error.status !== 404) {
        toast({
          title: "Failed to load RAG status",
          description:
            error.message || "Could not retrieve RAG indexing status",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!project.namespace) return;

    try {
      setUpdating(true);
      const request: UpdateRagConfigRequest = {
        enabled,
        branch: branch.trim() || null,
        includePatterns: includePatterns.length > 0 ? includePatterns : null,
        excludePatterns: excludePatterns.length > 0 ? excludePatterns : null,
        // Multi-branch settings
        multiBranchEnabled: multiBranchEnabled || null,
        branchRetentionDays: branchRetentionDays || null,
      };

      const updatedProject = await projectService.updateRagConfig(
        workspaceSlug,
        project.namespace,
        request,
      );

      toast({
        title: "RAG configuration updated",
        description: enabled
          ? "RAG indexing is now enabled for this project"
          : "RAG indexing has been disabled",
      });

      onProjectUpdate?.(updatedProject);
      await loadRagStatus();
    } catch (error: any) {
      toast({
        title: "Failed to update RAG configuration",
        description: error.message || "Could not update RAG settings",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleAddIncludePattern = () => {
    const pattern = newIncludePattern.trim();
    if (pattern && !includePatterns.includes(pattern)) {
      setIncludePatterns([...includePatterns, pattern]);
      setNewIncludePattern("");
    }
  };

  const handleRemoveIncludePattern = (pattern: string) => {
    setIncludePatterns(includePatterns.filter((p) => p !== pattern));
  };

  const handleIncludeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddIncludePattern();
    }
  };

  const handleAddPattern = () => {
    const pattern = newPattern.trim();
    if (pattern && !excludePatterns.includes(pattern)) {
      setExcludePatterns([...excludePatterns, pattern]);
      setNewPattern("");
    }
  };

  const handleRemovePattern = (pattern: string) => {
    setExcludePatterns(excludePatterns.filter((p) => p !== pattern));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPattern();
    }
  };

  const handleTriggerIndexing = async () => {
    if (!project.namespace) return;

    // If already indexing, cancel it
    if (indexing && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIndexing(false);
      setIndexingProgress(null);
      setIndexingError(null);
      setSseConnected(false);
      addLog("system", "Indexing cancelled by user", "info");
      toast({
        title: "Indexing Cancelled",
        description: "RAG indexing operation was cancelled",
      });
      return;
    }

    // Clear previous logs and start fresh
    setLogs([]);
    setIndexing(true);
    setIndexingProgress("Starting indexing...");
    setIndexingError(null);
    setSseConnected(true);
    setIsLogWindowOpen(true);
    addLog("system", "Connecting to indexing service...", "info");

    const handleProgress = (event: RagIndexingProgressEvent) => {
      setIndexingProgress(event.message || `${event.stage}: Processing...`);
      addLog(
        event.stage || "progress",
        event.message || "Processing...",
        "progress",
      );
    };

    const handleComplete = (result: RagIndexingResult) => {
      setIndexing(false);
      setIndexingProgress(null);
      abortControllerRef.current = null;
      setSseConnected(false);

      if (result.status === "completed") {
        addLog(
          "complete",
          result.message ||
            `Successfully indexed ${result.filesIndexed || 0} files`,
          "complete",
        );
        toast({
          title: "Indexing Complete",
          description:
            result.message ||
            `Successfully indexed ${result.filesIndexed || 0} files`,
        });
        // Refresh status
        loadRagStatus();
      } else if (result.status === "skipped") {
        addLog("skipped", result.message || "Indexing skipped", "info");
        toast({
          title: "Indexing Skipped",
          description: result.message,
        });
      } else if (result.status === "locked") {
        const lockedMessage =
          result.message || "Another indexing operation is already in progress";
        setIndexingError(lockedMessage);
        addLog("locked", lockedMessage, "error");
        toast({
          title: "Indexing Locked",
          description: lockedMessage,
          variant: "destructive",
        });
      }
    };

    const handleError = (error: string) => {
      setIndexing(false);
      setIndexingProgress(null);
      abortControllerRef.current = null;
      setSseConnected(false);

      if (error === "Indexing cancelled") {
        setIndexingError(null);
        return; // Don't show toast for user-cancelled operations
      }

      setIndexingError(error);
      addLog("error", error, "error");

      // Check for rate limiting message
      const isRateLimited =
        error.toLowerCase().includes("wait") &&
        error.toLowerCase().includes("seconds");

      toast({
        title: isRateLimited ? "Rate Limited" : "Indexing Failed",
        description: error,
        variant: "destructive",
      });

      // Refresh status to get latest state
      loadRagStatus();
    };

    // Start SSE indexing
    abortControllerRef.current = projectService.triggerRagIndexing(
      workspaceSlug,
      project.namespace,
      branch || null,
      handleProgress,
      handleComplete,
      handleError,
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const getStatusBadge = () => {
    if (!ragStatus?.indexStatus) {
      return <Badge variant="secondary">Not Indexed</Badge>;
    }

    const status = ragStatus.indexStatus.status;
    switch (status) {
      case "INDEXED":
        return (
          <Badge variant="default" className="bg-green-500">
            Indexed
          </Badge>
        );
      case "INDEXING":
        return (
          <Badge variant="default" className="bg-blue-500">
            Indexing...
          </Badge>
        );
      case "UPDATING":
        return (
          <Badge variant="default" className="bg-yellow-500">
            Updating...
          </Badge>
        );
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Not Indexed</Badge>;
    }
  };

  const getStatusIcon = () => {
    if (!ragStatus?.indexStatus) {
      return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }

    const status = ragStatus.indexStatus.status;
    switch (status) {
      case "INDEXED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "INDEXING":
      case "UPDATING":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  };

  const hasChanges =
    enabled !== (project.ragConfig?.enabled ?? false) ||
    !arraysEqual(includePatterns, project.ragConfig?.includePatterns ?? []) ||
    !arraysEqual(excludePatterns, project.ragConfig?.excludePatterns ?? []) ||
    multiBranchEnabled !== (project.ragConfig?.multiBranchEnabled ?? false) ||
    branchRetentionDays !== (project.ragConfig?.branchRetentionDays ?? 30);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>RAG Configuration</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Configure RAG (Retrieval-Augmented Generation) indexing for enhanced
          AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Free Plan Info Banner */}
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
            <p>
              <strong>Free Plan:</strong> RAG indexing supports up to{" "}
              <strong>70,000 chunks</strong> and <strong>40,000 files</strong>{" "}
              per branch.
            </p>
            <p>
              <strong>Tip:</strong> Use <em>include patterns</em> to limit
              indexing to specific directories, and <em>exclude patterns</em> to
              skip large or unnecessary directories such as:
            </p>
            <ul className="list-disc list-inside ml-2 text-xs space-y-0.5">
              <li>
                <code className="bg-muted px-1 rounded">node_modules/**</code>,{" "}
                <code className="bg-muted px-1 rounded">vendor/**</code> -
                package dependencies
              </li>
              <li>
                <code className="bg-muted px-1 rounded">dist/**</code>,{" "}
                <code className="bg-muted px-1 rounded">build/**</code>,{" "}
                <code className="bg-muted px-1 rounded">target/**</code> - build
                outputs
              </li>
              <li>
                <code className="bg-muted px-1 rounded">*.generated.*</code>,{" "}
                <code className="bg-muted px-1 rounded">*.min.js</code> -
                generated files
              </li>
              <li>
                <code className="bg-muted px-1 rounded">.venv/**</code>,{" "}
                <code className="bg-muted px-1 rounded">__pycache__/**</code> -
                Python environments
              </li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="rag-enabled">Enable RAG Indexing</Label>
            <p className="text-sm text-muted-foreground">
              Index repository code for AI-powered contextual analysis
            </p>
          </div>
          <Switch
            id="rag-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
            disabled={updating}
          />
        </div>

        {/* Branch Configuration - Read-only, managed via Branches tab */}
        <div className="space-y-2">
          <Label>Index Branch</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-muted rounded-md border text-sm">
              <code>
                {project.mainBranch || project.ragConfig?.branch || "main"}
              </code>
            </div>
            <a
              href="?tab=branches"
              className="text-sm text-primary hover:underline whitespace-nowrap"
            >
              Change in Branches →
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            RAG indexing uses the project's main branch. To change this, go to
            the <strong>Branches</strong> tab.
          </p>
        </div>

        {/* Include Patterns Configuration */}
        <div className="space-y-2">
          <Label>Include Patterns</Label>
          <p className="text-sm text-muted-foreground mb-2">
            When set, <strong>only</strong> files matching at least one pattern
            will be indexed. Applied before exclude patterns. Supports glob
            patterns (e.g.,{" "}
            <code className="text-xs bg-muted px-1 rounded">src/**</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">*.py</code>).
          </p>

          <div className="flex gap-2">
            <Input
              placeholder="e.g., src/** or *.ts"
              value={newIncludePattern}
              onChange={(e) => setNewIncludePattern(e.target.value)}
              onKeyDown={handleIncludeKeyDown}
              disabled={updating || !enabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddIncludePattern}
              disabled={updating || !enabled || !newIncludePattern.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {includePatterns.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {includePatterns.map((pattern, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1 bg-green-500/10 border-green-500/30"
                >
                  <span className="font-mono text-xs">{pattern}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIncludePattern(pattern)}
                    disabled={updating || !enabled}
                    className="ml-1 hover:bg-muted rounded-sm p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {includePatterns.length === 0 && enabled && (
            <p className="text-xs text-muted-foreground italic">
              No include patterns set — all files will be considered for
              indexing (subject to exclude patterns below).
            </p>
          )}
        </div>

        {/* Exclude Patterns Configuration */}
        <div className="space-y-2">
          <Label>Exclude Patterns</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Add patterns to exclude large or unnecessary directories from
            indexing. Supports glob patterns (e.g.,{" "}
            <code className="text-xs bg-muted px-1 rounded">vendor/**</code>,{" "}
            <code className="text-xs bg-muted px-1 rounded">
              *.generated.ts
            </code>
            ).
          </p>

          <div className="flex gap-2">
            <Input
              placeholder="e.g., node_modules/** or *.min.js"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={updating || !enabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddPattern}
              disabled={updating || !enabled || !newPattern.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {excludePatterns.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {excludePatterns.map((pattern, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  <span className="font-mono text-xs">{pattern}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePattern(pattern)}
                    disabled={updating || !enabled}
                    className="ml-1 hover:bg-muted rounded-sm p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {excludePatterns.length === 0 && enabled && (
            <p className="text-xs text-muted-foreground italic">
              Consider excluding:{" "}
              <code className="bg-muted px-1 rounded">node_modules/**</code>,{" "}
              <code className="bg-muted px-1 rounded">vendor/**</code>,{" "}
              <code className="bg-muted px-1 rounded">dist/**</code>,{" "}
              <code className="bg-muted px-1 rounded">.venv/**</code>
            </p>
          )}
        </div>

        {/* Multi-Branch RAG Configuration */}
        <Collapsible
          open={isMultiBranchOpen}
          onOpenChange={setIsMultiBranchOpen}
        >
          <div className="rounded-lg border p-4 bg-muted/20">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  Multi-Branch Indexing (Advanced)
                </span>
                <Badge variant="outline" className="text-xs">
                  Beta
                </Badge>
              </div>
              <GitBranch
                className={`h-4 w-4 transition-transform ${isMultiBranchOpen ? "rotate-90" : ""}`}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-4 space-y-4">
              <Alert className="bg-amber-500/10 border-amber-500/30">
                <Info className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
                  <strong>Multi-Branch Indexing</strong> tracks code changes
                  across branches in a unified index. During PR review, context
                  is retrieved from both the main branch and target branch, with
                  branch-specific changes taking priority. This preserves
                  cross-file relationships while providing accurate
                  branch-specific context.
                </AlertDescription>
              </Alert>

              {/* Enable Multi-Branch Indexing */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="multi-branch-enabled">
                    Enable Multi-Branch Indexing
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Index branches matching your Branch Push Patterns for
                    enhanced PR analysis
                  </p>
                </div>
                <Switch
                  id="multi-branch-enabled"
                  checked={multiBranchEnabled}
                  onCheckedChange={setMultiBranchEnabled}
                  disabled={updating || !enabled}
                />
              </div>

              {/* Multi-Branch Info */}
              {multiBranchEnabled && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Branches matching your <strong>Branch Push Patterns</strong>{" "}
                    will be indexed automatically. PR reviews will search both
                    the target branch and main branch, with target branch
                    changes taking priority.
                  </AlertDescription>
                </Alert>
              )}

              {/* Branch Retention Days */}
              <div className="space-y-2">
                <Label htmlFor="branch-retention">
                  Branch Index Retention (days)
                </Label>
                <Input
                  id="branch-retention"
                  type="number"
                  min="1"
                  max="365"
                  value={branchRetentionDays}
                  onChange={(e) =>
                    setBranchRetentionDays(parseInt(e.target.value) || 30)
                  }
                  disabled={updating || !enabled || !multiBranchEnabled}
                  className="w-24"
                />
                <p className="text-sm text-muted-foreground">
                  Automatically clean up branch index data older than this many
                  days.
                </p>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Status Information */}
        {ragStatus?.indexStatus && (
          <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">Index Status</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Branch:</span>
                <span className="ml-2 font-mono">
                  {ragStatus.indexStatus.indexedBranch || "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Files:</span>
                <span className="ml-2">
                  {ragStatus.indexStatus.totalFilesIndexed ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Indexed:</span>
                <span className="ml-2">
                  {formatDate(ragStatus.indexStatus.lastIndexedAt)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Commit:</span>
                <span className="ml-2 font-mono text-xs">
                  {ragStatus.indexStatus.indexedCommitHash?.substring(0, 8) ||
                    "—"}
                </span>
              </div>
            </div>

            {ragStatus.indexStatus.errorMessage && (
              <div className="text-sm text-destructive mt-2">
                Error: {ragStatus.indexStatus.errorMessage}
              </div>
            )}
          </div>
        )}

        {/* Warning for failed incremental updates */}
        {ragStatus?.indexStatus &&
          (ragStatus.indexStatus.failedIncrementalCount ?? 0) >= 5 && (
            <div className="rounded-lg border border-amber-500 p-4 bg-amber-50 dark:bg-amber-950/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Multiple Incremental Update Failures Detected
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    There have been{" "}
                    {ragStatus.indexStatus.failedIncrementalCount} failed
                    incremental RAG updates. This may indicate issues with the
                    repository structure or file patterns. Consider triggering a
                    full reindex to resolve potential index inconsistencies.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Indexing Progress */}
        {indexingProgress && (
          <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-950/30">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-blue-700 dark:text-blue-300">
                {indexingProgress}
              </span>
            </div>
          </div>
        )}

        {/* Indexing Error/Locked State */}
        {indexingError && !indexingProgress && (
          <div className="rounded-lg border p-3 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-amber-700 dark:text-amber-300">
                  {indexingError}
                </span>
                <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">
                  Try again later or check if another indexing process is
                  running.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Indexing Log Window */}
        {(logs.length > 0 ||
          (ragStatus?.indexStatus?.status === "INDEXING" && !sseConnected)) && (
          <Collapsible open={isLogWindowOpen} onOpenChange={setIsLogWindowOpen}>
            <div className="rounded-lg border bg-muted/20">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Indexing Logs</span>
                  <Badge variant="outline" className="text-xs">
                    {logs.length} entries
                  </Badge>
                  {sseConnected ? (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Wifi className="h-3 w-3" />
                      <span className="text-xs">Connected</span>
                    </div>
                  ) : ragStatus?.indexStatus?.status === "INDEXING" ? (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <WifiOff className="h-3 w-3" />
                      <span className="text-xs">Disconnected</span>
                    </div>
                  ) : null}
                </div>
                {isLogWindowOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>

              <CollapsibleContent>
                {/* Warning when disconnected but indexing in progress */}
                {!sseConnected &&
                  ragStatus?.indexStatus?.status === "INDEXING" && (
                    <Alert className="mx-3 mb-2 bg-amber-500/10 border-amber-500/30">
                      <WifiOff className="h-4 w-4 text-amber-500" />
                      <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs">
                        <strong>Connection lost.</strong> Indexing is still
                        running in the background. New logs cannot be displayed
                        until you trigger a new indexing operation. The status
                        will update automatically when indexing completes.
                      </AlertDescription>
                    </Alert>
                  )}

                <div
                  ref={logScrollRef}
                  className="max-h-64 overflow-y-auto p-3 pt-0 font-mono text-xs"
                >
                  {logs.length === 0 ? (
                    <div className="text-muted-foreground text-center py-4">
                      No logs yet. Trigger indexing to see progress.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className={`flex gap-2 ${
                            log.type === "error"
                              ? "text-red-600 dark:text-red-400"
                              : log.type === "complete"
                                ? "text-green-600 dark:text-green-400"
                                : log.type === "progress"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-muted-foreground"
                          }`}
                        >
                          <span className="text-muted-foreground/70 shrink-0">
                            [{log.timestamp.toLocaleTimeString()}]
                          </span>
                          <span className="text-primary/80 shrink-0 uppercase">
                            [{log.stage}]
                          </span>
                          <span className="break-all">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clear logs button */}
                {logs.length > 0 && !indexing && (
                  <div className="px-3 pb-3 pt-1 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setLogs([])}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear Logs
                    </Button>
                  </div>
                )}
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleUpdateConfig}
            disabled={updating || !hasChanges}
          >
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>

          {(() => {
            const cooldownInfo = getReindexCooldownInfo();
            return (
              <Button
                variant={indexing ? "destructive" : "outline"}
                onClick={handleTriggerIndexing}
                disabled={
                  !enabled ||
                  (!ragStatus?.canStartIndexing && !indexing) ||
                  cooldownInfo.isOnCooldown
                }
                title={
                  cooldownInfo.isOnCooldown
                    ? `Reindex available in ${cooldownInfo.remainingTime}`
                    : undefined
                }
              >
                {indexing ? (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Cancel Indexing
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    {cooldownInfo.isOnCooldown
                      ? `Reindex in ${cooldownInfo.remainingTime}`
                      : "Trigger Indexing"}
                  </>
                )}
              </Button>
            );
          })()}

          <Button
            variant="ghost"
            size="icon"
            onClick={loadRagStatus}
            disabled={loading || indexing}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {!ragStatus?.canStartIndexing && enabled && !indexing && (
          <p className="text-sm text-muted-foreground">
            {ragStatus?.indexStatus?.status === "INDEXING"
              ? "Indexing is currently in progress. The status will update automatically when complete."
              : getReindexCooldownInfo().isOnCooldown
                ? `Full reindex is limited to once every 24 hours after a successful index. Next reindex available in ${getReindexCooldownInfo().remainingTime}.`
                : "Please wait before triggering another indexing operation."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
