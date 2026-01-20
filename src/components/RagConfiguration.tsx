import { useState, useEffect, useRef } from "react";
import { Database, Play, Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw, Square, Plus, X, Info, GitBranch, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  RagIndexingResult
} from "@/api_service/project/projectService";

interface RagConfigurationProps {
  workspaceSlug: string;
  project: ProjectDTO;
  onProjectUpdate?: (project: ProjectDTO) => void;
}

export default function RagConfiguration({
  workspaceSlug,
  project,
  onProjectUpdate
}: RagConfigurationProps) {
  const { toast } = useToast();
  const [ragStatus, setRagStatus] = useState<RagStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Local form state
  const [enabled, setEnabled] = useState(project.ragConfig?.enabled ?? false);
  const [branch, setBranch] = useState(project.ragConfig?.branch ?? "");
  const [excludePatterns, setExcludePatterns] = useState<string[]>(project.ragConfig?.excludePatterns ?? []);
  const [newPattern, setNewPattern] = useState("");
  
  // Delta (hierarchical) RAG state
  const [deltaEnabled, setDeltaEnabled] = useState(project.ragConfig?.deltaEnabled ?? false);
  const [deltaRetentionDays, setDeltaRetentionDays] = useState(project.ragConfig?.deltaRetentionDays ?? 30);
  const [isDeltaOpen, setIsDeltaOpen] = useState(false);

  useEffect(() => {
    loadRagStatus();
  }, [workspaceSlug, project.namespace]);

  // Poll for status updates when indexing is in progress (detected from backend status)
  // Also set local indexing state based on backend status
  useEffect(() => {
    if (ragStatus?.indexStatus?.status === 'INDEXING') {
      // Show that indexing is in progress (possibly from another session or before page reload)
      if (!indexing) {
        setIndexingProgress("Indexing in progress...");
      }
      
      const pollInterval = setInterval(() => {
        loadRagStatus();
      }, 5000); // Poll every 5 seconds
      
      return () => clearInterval(pollInterval);
    } else {
      // If backend says not indexing but we have local progress shown, clear it
      if (indexingProgress === "Indexing in progress..." && !indexing) {
        setIndexingProgress(null);
      }
    }
  }, [ragStatus?.indexStatus?.status, indexing]);

  useEffect(() => {
    // Update local state when project changes
    setEnabled(project.ragConfig?.enabled ?? false);
    setBranch(project.ragConfig?.branch ?? "");
    setExcludePatterns(project.ragConfig?.excludePatterns ?? []);
    // Delta settings
    setDeltaEnabled(project.ragConfig?.deltaEnabled ?? false);
    setDeltaRetentionDays(project.ragConfig?.deltaRetentionDays ?? 30);
  }, [project.ragConfig]);

  // Helper to check if reindex is allowed (24h cooldown after successful index)
  const getReindexCooldownInfo = (): { isOnCooldown: boolean; remainingTime: string | null } => {
    if (!ragStatus?.indexStatus) {
      return { isOnCooldown: false, remainingTime: null };
    }
    
    const status = ragStatus.indexStatus.status;
    const lastIndexedAt = ragStatus.indexStatus.lastIndexedAt;
    
    // Only apply cooldown if the last index was successful
    if (status !== 'INDEXED' || !lastIndexedAt) {
      return { isOnCooldown: false, remainingTime: null };
    }
    
    const lastIndexDate = new Date(lastIndexedAt);
    const now = new Date();
    const hoursSinceLastIndex = (now.getTime() - lastIndexDate.getTime()) / (1000 * 60 * 60);
    const cooldownHours = 24;
    
    if (hoursSinceLastIndex < cooldownHours) {
      const remainingHours = Math.ceil(cooldownHours - hoursSinceLastIndex);
      const remainingTime = remainingHours > 1 
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
      const status = await projectService.getRagStatus(workspaceSlug, project.namespace);
      setRagStatus(status);
    } catch (error: any) {
      console.error("Failed to load RAG status:", error);
      // Don't show error toast for 404 - just means RAG not yet set up
      if (error.status !== 404) {
        toast({
          title: "Failed to load RAG status",
          description: error.message || "Could not retrieve RAG indexing status",
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
        excludePatterns: excludePatterns.length > 0 ? excludePatterns : null,
        // Delta settings
        deltaEnabled: deltaEnabled || null,
        deltaRetentionDays: deltaRetentionDays || null,
      };
      
      const updatedProject = await projectService.updateRagConfig(
        workspaceSlug,
        project.namespace,
        request
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

  const handleAddPattern = () => {
    const pattern = newPattern.trim();
    if (pattern && !excludePatterns.includes(pattern)) {
      setExcludePatterns([...excludePatterns, pattern]);
      setNewPattern("");
    }
  };

  const handleRemovePattern = (pattern: string) => {
    setExcludePatterns(excludePatterns.filter(p => p !== pattern));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
      toast({
        title: "Indexing Cancelled",
        description: "RAG indexing operation was cancelled",
      });
      return;
    }

    setIndexing(true);
    setIndexingProgress("Starting indexing...");

    const handleProgress = (event: RagIndexingProgressEvent) => {
      setIndexingProgress(event.message || `${event.stage}: Processing...`);
    };

    const handleComplete = (result: RagIndexingResult) => {
      setIndexing(false);
      setIndexingProgress(null);
      abortControllerRef.current = null;

      if (result.status === 'completed') {
        toast({
          title: "Indexing Complete",
          description: result.message || `Successfully indexed ${result.filesIndexed || 0} files`,
        });
        // Refresh status
        loadRagStatus();
      } else if (result.status === 'skipped') {
        toast({
          title: "Indexing Skipped",
          description: result.message,
        });
      } else if (result.status === 'locked') {
        toast({
          title: "Indexing In Progress",
          description: result.message || "Another indexing operation is already in progress",
          variant: "destructive",
        });
      }
    };

    const handleError = (error: string) => {
      setIndexing(false);
      setIndexingProgress(null);
      abortControllerRef.current = null;

      if (error === 'Indexing cancelled') {
        return; // Don't show toast for user-cancelled operations
      }

      // Check for rate limiting message
      const isRateLimited = error.toLowerCase().includes('wait') && error.toLowerCase().includes('seconds');
      
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
      handleError
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
        return <Badge variant="default" className="bg-green-500">Indexed</Badge>;
      case "INDEXING":
        return <Badge variant="default" className="bg-blue-500">Indexing...</Badge>;
      case "UPDATING":
        return <Badge variant="default" className="bg-yellow-500">Updating...</Badge>;
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

  const hasChanges = enabled !== (project.ragConfig?.enabled ?? false) ||
    !arraysEqual(excludePatterns, project.ragConfig?.excludePatterns ?? []) ||
    deltaEnabled !== (project.ragConfig?.deltaEnabled ?? false) ||
    deltaRetentionDays !== (project.ragConfig?.deltaRetentionDays ?? 30);

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
          Configure RAG (Retrieval-Augmented Generation) indexing for enhanced AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Free Plan Info Banner */}
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
            <p>
              <strong>Free Plan:</strong> RAG indexing supports up to <strong>70,000 chunks</strong> and <strong>40,000 files</strong> per branch.
            </p>
            <p>
              <strong>Tip:</strong> Use <em>exclude patterns</em> below to skip large or unnecessary directories such as:
            </p>
            <ul className="list-disc list-inside ml-2 text-xs space-y-0.5">
              <li><code className="bg-muted px-1 rounded">node_modules/**</code>, <code className="bg-muted px-1 rounded">vendor/**</code> - package dependencies</li>
              <li><code className="bg-muted px-1 rounded">dist/**</code>, <code className="bg-muted px-1 rounded">build/**</code>, <code className="bg-muted px-1 rounded">target/**</code> - build outputs</li>
              <li><code className="bg-muted px-1 rounded">*.generated.*</code>, <code className="bg-muted px-1 rounded">*.min.js</code> - generated files</li>
              <li><code className="bg-muted px-1 rounded">.venv/**</code>, <code className="bg-muted px-1 rounded">__pycache__/**</code> - Python environments</li>
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
              <code>{project.mainBranch || project.ragConfig?.branch || 'main'}</code>
            </div>
            <a 
              href="?tab=branches"
              className="text-sm text-primary hover:underline whitespace-nowrap"
            >
              Change in Branches →
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            RAG indexing uses the project's main branch. To change this, go to the <strong>Branches</strong> tab.
          </p>
        </div>

        {/* Exclude Patterns Configuration */}
        <div className="space-y-2">
          <Label>Exclude Patterns</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Add patterns to exclude large or unnecessary directories from indexing. 
            Supports glob patterns (e.g., <code className="text-xs bg-muted px-1 rounded">vendor/**</code>, <code className="text-xs bg-muted px-1 rounded">*.generated.ts</code>).
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
              Consider excluding: <code className="bg-muted px-1 rounded">node_modules/**</code>, <code className="bg-muted px-1 rounded">vendor/**</code>, <code className="bg-muted px-1 rounded">dist/**</code>, <code className="bg-muted px-1 rounded">.venv/**</code>
            </p>
          )}
        </div>

        {/* Delta (Hierarchical) RAG Configuration */}
        <Collapsible open={isDeltaOpen} onOpenChange={setIsDeltaOpen}>
          <div className="rounded-lg border p-4 bg-muted/20">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="font-medium">Delta Indexes (Advanced)</span>
                <Badge variant="outline" className="text-xs">Beta</Badge>
              </div>
              <GitBranch className={`h-4 w-4 transition-transform ${isDeltaOpen ? 'rotate-90' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pt-4 space-y-4">
              <Alert className="bg-amber-500/10 border-amber-500/30">
                <Info className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
                  <strong>Delta Indexes</strong> create lightweight indexes for branches containing only the differences from the main branch.
                  This improves code review accuracy by providing branch-specific context instead of full codebase context.
                </AlertDescription>
              </Alert>

              {/* Enable Delta Indexing */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="delta-enabled">Enable Delta Indexes</Label>
                  <p className="text-sm text-muted-foreground">
                    Create separate indexes for branches matching your Branch Push Patterns
                  </p>
                </div>
                <Switch
                  id="delta-enabled"
                  checked={deltaEnabled}
                  onCheckedChange={setDeltaEnabled}
                  disabled={updating || !enabled}
                />
              </div>

              {/* Delta Branch Info */}
              {deltaEnabled && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Delta indexes will be created for branches matching your <strong>Branch Push Patterns</strong> configured in the Branches tab.
                    This ensures delta indexes are aligned with your branch analysis settings.
                  </AlertDescription>
                </Alert>
              )}

              {/* Delta Retention Days */}
              <div className="space-y-2">
                <Label htmlFor="delta-retention">Delta Index Retention (days)</Label>
                <Input
                  id="delta-retention"
                  type="number"
                  min="1"
                  max="365"
                  value={deltaRetentionDays}
                  onChange={(e) => setDeltaRetentionDays(parseInt(e.target.value) || 30)}
                  disabled={updating || !enabled || !deltaEnabled}
                  className="w-24"
                />
                <p className="text-sm text-muted-foreground">
                  Automatically clean up delta indexes older than this many days.
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
                  {ragStatus.indexStatus.indexedCommitHash?.substring(0, 8) || "—"}
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
        {ragStatus?.indexStatus && (ragStatus.indexStatus.failedIncrementalCount ?? 0) >= 5 && (
          <div className="rounded-lg border border-amber-500 p-4 bg-amber-50 dark:bg-amber-950/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Multiple Incremental Update Failures Detected
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  There have been {ragStatus.indexStatus.failedIncrementalCount} failed incremental RAG updates. 
                  This may indicate issues with the repository structure or file patterns. 
                  Consider triggering a full reindex to resolve potential index inconsistencies.
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
              <span className="text-blue-700 dark:text-blue-300">{indexingProgress}</span>
            </div>
          </div>
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
                disabled={!enabled || (!ragStatus?.canStartIndexing && !indexing) || cooldownInfo.isOnCooldown}
                title={cooldownInfo.isOnCooldown 
                  ? `Reindex available in ${cooldownInfo.remainingTime}` 
                  : undefined}
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
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {!ragStatus?.canStartIndexing && enabled && !indexing && (
          <p className="text-sm text-muted-foreground">
            {ragStatus?.indexStatus?.status === 'INDEXING' 
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
