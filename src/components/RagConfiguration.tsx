import { useCallback, useState, useEffect, useRef } from "react";
import {
  Database,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  projectService,
  ProjectDTO,
  RagStatusResponse,
  RagBranchIndexStatusDTO,
  UpdateRagConfigRequest,
  RagIndexingProgressEvent,
  RagIndexingResult,
} from "@/api_service/project/projectService";
import {
  jobApi,
  type Job,
  type JobLog,
} from "@/api_service/job/jobApi";
import {
  getProjectFrameworkPreset,
  inferProjectFrameworkPreset,
  PROJECT_FRAMEWORK_PRESETS,
} from "@/config/projectFrameworkPresets";

interface LogEntry {
  id: string;
  jobId?: string;
  timestamp: Date;
  stage: string;
  message: string;
  type: "info" | "progress" | "complete" | "error";
}

interface BranchIndexProgress {
  indexedChunks?: number;
  estimatedChunks?: number;
  completedBatches?: number;
  totalBatches?: number;
  estimatedRemainingMs?: number;
}

interface RagConfigurationProps {
  workspaceSlug: string;
  project: ProjectDTO;
  onProjectUpdate?: (project: ProjectDTO) => void;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function getErrorStatus(error: unknown) {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return undefined;
  }
  return Number((error as { status: unknown }).status);
}

export default function RagConfiguration({
  workspaceSlug,
  project,
  onProjectUpdate,
}: RagConfigurationProps) {
  const { toast } = useToast();
  const [ragStatus, setRagStatus] = useState<RagStatusResponse | null>(null);
  const [branchIndexes, setBranchIndexes] = useState<RagBranchIndexStatusDTO[]>([]);
  const [branchProgress, setBranchProgress] = useState<Record<string, BranchIndexProgress>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [syncingScopes, setSyncingScopes] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState<string | null>(null);
  const [indexingError, setIndexingError] = useState<string | null>(null);
  const [activeJobIds, setActiveJobIds] = useState<string[]>([]);
  const activeJobIdsRef = useRef<Set<string>>(new Set());
  const handledTerminalJobIdsRef = useRef<Set<string>>(new Set());
  const completedJobIdRef = useRef<string | null>(null);
  const [completedJobIdToReconcile, setCompletedJobIdToReconcile] = useState<
    string | null
  >(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestJobSequenceRef = useRef<Record<string, number>>({});

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
  const [frameworkPresetId, setFrameworkPresetId] = useState(() =>
    inferProjectFrameworkPreset(
      project.ragConfig?.includePatterns,
      project.ragConfig?.excludePatterns,
    ),
  );

  // Multi-branch RAG state
  const [multiBranchEnabled, setMultiBranchEnabled] = useState(
    project.ragConfig?.multiBranchEnabled ?? false,
  );
  const [branchRetentionDays, setBranchRetentionDays] = useState(
    project.ragConfig?.branchRetentionDays ?? 30,
  );
  const [indexedBranches, setIndexedBranches] = useState(
    (project.ragConfig?.indexedBranches ?? []).join(", "),
  );
  const [transientBranchIndexesEnabled, setTransientBranchIndexesEnabled] =
    useState(project.ragConfig?.transientBranchIndexesEnabled ?? false);
  const [isMultiBranchOpen, setIsMultiBranchOpen] = useState(false);

  // Helper to add a log entry
  const addLog = (
    stage: string,
    message: string,
    type: LogEntry["type"] = "info",
  ) => {
    const entry: LogEntry = {
      id: `local-${++logIdCounter.current}`,
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

  const mapJobLog = useCallback((jobId: string, log: JobLog): LogEntry => {
    const type: LogEntry["type"] =
      log.level === "ERROR"
        ? "error"
        : log.step === "complete"
          ? "complete"
          : "progress";
    return {
      id: `job-${log.id}`,
      jobId,
      timestamp: new Date(log.timestamp),
      stage: log.step || "indexing",
      message: log.message,
      type,
    };
  }, []);

  const parseJobLogMetadata = useCallback((log: JobLog) => {
    if (!log.metadata) return undefined;
    try {
      const parsed = JSON.parse(log.metadata);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : undefined;
    } catch {
      return undefined;
    }
  }, []);

  const restoreBranchProgress = useCallback(
    (job: Job, jobLogs: JobLog[]) => {
      setBranchProgress((current) => {
        const next = { ...current };
        for (const log of jobLogs) {
          const metadata = parseJobLogMetadata(log);
          const branchName =
            (typeof metadata?.branch === "string" ? metadata.branch : undefined) ||
            job.branchName;
          if (!branchName || !metadata) continue;
          const previous = next[branchName] ?? {};
          next[branchName] = {
            ...previous,
            indexedChunks:
              typeof metadata.indexedChunks === "number"
                ? metadata.indexedChunks
                : previous.indexedChunks,
            estimatedChunks:
              typeof metadata.estimatedChunks === "number"
                ? metadata.estimatedChunks
                : previous.estimatedChunks,
            completedBatches:
              typeof metadata.completedBatches === "number"
                ? metadata.completedBatches
                : previous.completedBatches,
            totalBatches:
              typeof metadata.totalBatches === "number"
                ? metadata.totalBatches
                : previous.totalBatches,
            estimatedRemainingMs:
              typeof metadata.estimatedRemainingMs === "number"
                ? metadata.estimatedRemainingMs
                : previous.estimatedRemainingMs,
          };
        }
        return next;
      });
    },
    [parseJobLogMetadata],
  );

  const isTerminalJob = (job: Job) =>
    ["COMPLETED", "FAILED", "CANCELLED", "SKIPPED"].includes(job.status);

  const loadRagStatus = useCallback(async (silent = false) => {
    if (!project.namespace) return;

    try {
      if (!silent) setLoading(true);
      const status = await projectService.getRagStatus(
        workspaceSlug,
        project.namespace,
      );
      const configuredBranches = await projectService
        .getRagBranchIndexes(workspaceSlug, project.namespace)
        .catch((error) => {
          console.warn("Failed to load RAG branch index status:", error);
          return [];
        });
      setBranchIndexes(configuredBranches);

      // A completed durable job is authoritative: the backend marks the RAG
      // index complete before it marks the job complete. Do not let a stale or
      // cached transitional response regress the card after that handoff.
      if (
        completedJobIdRef.current &&
        status.indexStatus?.status !== "INDEXED"
      ) {
        return status;
      }

      setRagStatus(status);
      if (
        completedJobIdRef.current &&
        status.indexStatus?.status === "INDEXED"
      ) {
        completedJobIdRef.current = null;
        setCompletedJobIdToReconcile(null);
      }
      return status;
    } catch (error: unknown) {
      console.error("Failed to load RAG status:", error);
      if (getErrorStatus(error) !== 404) {
        toast({
          title: "Failed to load RAG status",
          description: getErrorMessage(
            error,
            "Could not retrieve RAG indexing status",
          ),
          variant: "destructive",
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [project.namespace, toast, workspaceSlug]);

  const applyTerminalJobState = useCallback(
    async (job: Job) => {
      if (handledTerminalJobIdsRef.current.has(job.id)) return;
      handledTerminalJobIdsRef.current.add(job.id);

      activeJobIdsRef.current.delete(job.id);
      const remainingJobIds = Array.from(activeJobIdsRef.current);
      const stillIndexing = remainingJobIds.length > 0;
      setActiveJobIds(remainingJobIds);
      setIndexing(stillIndexing);
      setIndexingProgress(
        stillIndexing
          ? `${remainingJobIds.length} RAG branch job${remainingJobIds.length === 1 ? "" : "s"} still running...`
          : null,
      );
      setSseConnected(stillIndexing);
      if (!stillIndexing) {
        abortControllerRef.current = null;
      }

      if (job.status === "COMPLETED") {
        const primaryBranch =
          project.mainBranch || project.ragConfig?.branch || branch.trim();
        const completedPrimary =
          !job.branchName || !primaryBranch || job.branchName === primaryBranch;
        if (completedPrimary) {
          completedJobIdRef.current = job.id;
          setCompletedJobIdToReconcile(job.id);
          setRagStatus((current) => {
            if (!current?.indexStatus) return current;
            const completedAt = job.completedAt || new Date().toISOString();
            return {
              ...current,
              isIndexed: true,
              canStartIndexing: true,
              indexStatus: {
                ...current.indexStatus,
                status: "INDEXED",
                lastIndexedAt: completedAt,
                updatedAt: completedAt,
                errorMessage: null,
              },
            };
          });
        }
        setIndexingError(null);
        toast({
          title: "Indexing Complete",
          description: job.branchName
            ? `The RAG index for '${job.branchName}' is ready.`
            : "The RAG index is ready and live updates are complete.",
        });
      } else if (job.status === "FAILED") {
        const message = job.errorMessage || "RAG indexing failed";
        setIndexingError(message);
        toast({
          title: "Indexing Failed",
          description: message,
          variant: "destructive",
        });
      }
      await loadRagStatus(job.status === "COMPLETED");
    },
    [branch, loadRagStatus, project.mainBranch, project.ragConfig?.branch, toast],
  );

  const refreshActiveJob = useCallback(
    async (jobId: string, replaceLogs = false) => {
      if (!project.namespace) return;

      const [job, response] = await Promise.all([
        jobApi.getJob(workspaceSlug, project.namespace, jobId),
        jobApi.getJobLogs(
          workspaceSlug,
          project.namespace,
          jobId,
          replaceLogs
            ? undefined
            : latestJobSequenceRef.current[jobId] || undefined,
        ),
      ]);

      const incoming = response.logs.map((log) => mapJobLog(job.id, log));
      latestJobSequenceRef.current[jobId] = Math.max(
        latestJobSequenceRef.current[jobId] || 0,
        response.latestSequence || 0,
      );
      setLogs((current) => {
        const retained = replaceLogs
          ? current.filter((entry) => entry.jobId !== job.id)
          : current;
        const knownIds = new Set(retained.map((entry) => entry.id));
        return [...retained, ...incoming.filter((entry) => !knownIds.has(entry.id))]
          .sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
      });
      restoreBranchProgress(job, response.logs);

      // Keep the project-level Index Status card synchronized while the
      // durable job and its log are being polled.
      await loadRagStatus(true);

      if (!isTerminalJob(job)) {
        activeJobIdsRef.current.add(job.id);
        setActiveJobIds(Array.from(activeJobIdsRef.current));
        setIndexing(true);
        setSseConnected(true);
        setIsLogWindowOpen(true);
        setIndexingError(null);
        setIndexingProgress(
          incoming.at(-1)?.message ||
            job.currentStep ||
            "RAG indexing is running...",
        );
      } else {
        await applyTerminalJobState(job);
      }
    },
    [
      applyTerminalJobState,
      loadRagStatus,
      mapJobLog,
      project.namespace,
      restoreBranchProgress,
      workspaceSlug,
    ],
  );

  const resumeRagJobs = useCallback(async () => {
    if (!project.namespace) return;
    try {
      const activeJobs = await jobApi.getActiveJobs(
        workspaceSlug,
        project.namespace,
      );
      const ragJobs = activeJobs.filter((job) =>
        ["RAG_INITIAL_INDEX", "RAG_INCREMENTAL_INDEX"].includes(job.jobType),
      );
      if (ragJobs.length > 0) {
        const jobIds = ragJobs.map((job) => job.id);
        activeJobIdsRef.current = new Set(jobIds);
        setActiveJobIds(jobIds);
        setIndexing(true);
        setSseConnected(true);
        setIsLogWindowOpen(true);
        setIndexingProgress(
          `Restored ${ragJobs.length} active RAG branch job${ragJobs.length === 1 ? "" : "s"}...`,
        );
        latestJobSequenceRef.current = {};
        await Promise.all(ragJobs.map((job) => refreshActiveJob(job.id, true)));
      }
    } catch (error) {
      console.warn("Could not restore active RAG jobs and logs:", error);
    }
  }, [project.namespace, refreshActiveJob, workspaceSlug]);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    activeJobIdsRef.current = new Set();
    handledTerminalJobIdsRef.current = new Set();
    completedJobIdRef.current = null;
    latestJobSequenceRef.current = {};
    setActiveJobIds([]);
    setCompletedJobIdToReconcile(null);
    setLogs([]);
    setIndexing(false);
    setIndexingProgress(null);
    loadRagStatus();
    resumeRagJobs();
  }, [loadRagStatus, project.namespace, resumeRagJobs, workspaceSlug]);

  useEffect(() => {
    if (activeJobIds.length === 0) return;
    const pollInterval = window.setInterval(() => {
      Promise.all(activeJobIds.map((jobId) => refreshActiveJob(jobId))).catch((error) => {
        console.warn("Could not refresh RAG job progress:", error);
        setSseConnected(false);
      });
    }, 1500);
    return () => window.clearInterval(pollInterval);
  }, [activeJobIds, refreshActiveJob]);

  // Project status persistence and the terminal Job response can become
  // observable a fraction of a second apart. Continue reconciling after the
  // job poll stops so the Index Status card reaches the authoritative state
  // without requiring a page reload.
  useEffect(() => {
    if (!completedJobIdToReconcile) return;
    const pollInterval = window.setInterval(() => {
      loadRagStatus(true);
    }, 1500);
    return () => window.clearInterval(pollInterval);
  }, [completedJobIdToReconcile, loadRagStatus]);

  // The status row is a fallback while the durable job is being discovered.
  // This covers the brief interval between marking INDEXING and exposing the job.
  useEffect(() => {
    const hasBuildingBranch = branchIndexes.some((index) =>
      ["PENDING", "BUILDING"].includes(index.status),
    );
    if (
      (!["INDEXING", "UPDATING"].includes(
        ragStatus?.indexStatus?.status ?? "",
      ) && !hasBuildingBranch) ||
      activeJobIds.length > 0
    ) return;
    setIndexing(true);
    setIndexingProgress("Restoring live indexing progress...");
    const pollInterval = window.setInterval(() => {
      resumeRagJobs();
      loadRagStatus();
    }, 3000);
    return () => window.clearInterval(pollInterval);
  }, [activeJobIds.length, branchIndexes, loadRagStatus, ragStatus?.indexStatus?.status, resumeRagJobs]);

  useEffect(() => {
    // Update local state when project changes
    setEnabled(project.ragConfig?.enabled ?? false);
    setBranch(project.ragConfig?.branch ?? "");
    setIncludePatterns(project.ragConfig?.includePatterns ?? []);
    setExcludePatterns(project.ragConfig?.excludePatterns ?? []);
    setFrameworkPresetId(
      inferProjectFrameworkPreset(
        project.ragConfig?.includePatterns,
        project.ragConfig?.excludePatterns,
      ),
    );
    // Multi-branch settings
    setMultiBranchEnabled(project.ragConfig?.multiBranchEnabled ?? false);
    setBranchRetentionDays(project.ragConfig?.branchRetentionDays ?? 30);
    setIndexedBranches((project.ragConfig?.indexedBranches ?? []).join(", "));
    setTransientBranchIndexesEnabled(
      project.ragConfig?.transientBranchIndexesEnabled ?? false,
    );
  }, [project.ragConfig]);

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
        indexedBranches: multiBranchEnabled
          ? indexedBranches
              .split(",")
              .map((value) => value.trim())
              .filter((value, index, values) =>
                Boolean(value) && values.indexOf(value) === index,
              ) || null
          : null,
        transientBranchIndexesEnabled:
          multiBranchEnabled && transientBranchIndexesEnabled ? true : null,
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
    } catch (error: unknown) {
      toast({
        title: "Failed to update RAG configuration",
        description: getErrorMessage(error, "Could not update RAG settings"),
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleScopeSync = async (direction: "FROM_RAG" | "TO_RAG") => {
    if (!project.namespace) return;
    setSyncingScopes(true);
    try {
      if (direction === "FROM_RAG") {
        await projectService.updateRagConfig(workspaceSlug, project.namespace, {
          enabled,
          branch: branch.trim() || null,
          includePatterns: includePatterns.length > 0 ? includePatterns : null,
          excludePatterns: excludePatterns.length > 0 ? excludePatterns : null,
          multiBranchEnabled: multiBranchEnabled || null,
          branchRetentionDays: branchRetentionDays || null,
        });
      }
      const result = await projectService.syncAnalysisScope(
        workspaceSlug, project.namespace, direction,
      );
      if (result.ragConfig) {
        setIncludePatterns(result.ragConfig.includePatterns ?? []);
        setExcludePatterns(result.ragConfig.excludePatterns ?? []);
        setFrameworkPresetId(
          inferProjectFrameworkPreset(
            result.ragConfig.includePatterns,
            result.ragConfig.excludePatterns,
          ),
        );
        onProjectUpdate?.({ ...project, ragConfig: result.ragConfig });
      }
      toast({
        title: "Scopes synchronized",
        description: direction === "FROM_RAG"
          ? "RAG patterns were copied to PR and branch analysis."
          : "Analysis patterns were copied to RAG indexing.",
      });
    } catch (error: unknown) {
      toast({
        title: "Scope synchronization failed",
        description: getErrorMessage(error, "Unable to synchronize scopes."),
        variant: "destructive",
      });
    } finally {
      setSyncingScopes(false);
    }
  };

  const handleAddIncludePattern = () => {
    const pattern = newIncludePattern.trim();
    if (pattern && !includePatterns.includes(pattern)) {
      setFrameworkPresetId("generic");
      setIncludePatterns([...includePatterns, pattern]);
      setNewIncludePattern("");
    }
  };

  const handleRemoveIncludePattern = (pattern: string) => {
    setFrameworkPresetId("generic");
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
      setFrameworkPresetId("generic");
      setExcludePatterns([...excludePatterns, pattern]);
      setNewPattern("");
    }
  };

  const handleRemovePattern = (pattern: string) => {
    setFrameworkPresetId("generic");
    setExcludePatterns(excludePatterns.filter((p) => p !== pattern));
  };

  const handleFrameworkPresetChange = (presetId: string) => {
    const preset = getProjectFrameworkPreset(presetId);
    setFrameworkPresetId(preset.id);
    setIncludePatterns([...preset.includePatterns]);
    setExcludePatterns([...preset.excludePatterns]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPattern();
    }
  };

  const handleTriggerIndexing = async (
    targetBranch: string | null = null,
    allConfiguredBranches = false,
  ) => {
    if (!project.namespace) return;

    if (indexing) return;

    completedJobIdRef.current = null;
    handledTerminalJobIdsRef.current = new Set();
    activeJobIdsRef.current = new Set();
    setActiveJobIds([]);
    setCompletedJobIdToReconcile(null);

    // Clear previous logs and start fresh
    setLogs([]);
    setIndexing(true);
    setIndexingProgress("Starting indexing...");
    setIndexingError(null);
    setSseConnected(true);
    setIsLogWindowOpen(true);
    const requestedBranch = targetBranch ?? (branch.trim() || null);
    setBranchProgress((current) => {
      if (allConfiguredBranches) return {};
      return requestedBranch ? { ...current, [requestedBranch]: {} } : current;
    });
    setBranchIndexes((current) =>
      current.map((index) =>
        allConfiguredBranches || index.branchName === requestedBranch
          ? { ...index, status: "BUILDING", errorMessage: null }
          : index,
      ),
    );
    addLog(
      "system",
      allConfiguredBranches
        ? "Connecting to indexing service for all configured branches..."
        : `Connecting to indexing service for ${requestedBranch || "the primary"} branch...`,
      "info",
    );

    const handleProgress = (event: RagIndexingProgressEvent) => {
      setIndexingProgress(event.message || `${event.stage}: Processing...`);
      if (event.branch) {
        setBranchProgress((current) => ({
          ...current,
          [event.branch!]: {
            ...current[event.branch!],
            indexedChunks: event.indexedChunks ?? current[event.branch!]?.indexedChunks,
            estimatedChunks: event.estimatedChunks ?? current[event.branch!]?.estimatedChunks,
            completedBatches: event.completedBatches ?? current[event.branch!]?.completedBatches,
            totalBatches: event.totalBatches ?? current[event.branch!]?.totalBatches,
            estimatedRemainingMs: event.estimatedRemainingMs ?? current[event.branch!]?.estimatedRemainingMs,
          },
        }));
      }
      addLog(
        event.stage || "progress",
        event.message || "Processing...",
        "progress",
      );
    };

    const handleComplete = (result: RagIndexingResult) => {
      abortControllerRef.current = null;

      if (result.status === "queued") {
        setIndexing(true);
        setIndexingProgress(result.message || "RAG indexing queued...");
        addLog(
          "queued",
          result.message || "RAG indexing queued in the background",
          "progress",
        );
        if (result.jobId) {
          latestJobSequenceRef.current[result.jobId] = 0;
          activeJobIdsRef.current.add(result.jobId);
          setActiveJobIds(Array.from(activeJobIdsRef.current));
          refreshActiveJob(result.jobId, true).catch((error) => {
            console.warn("Could not attach to queued RAG job:", error);
            setSseConnected(false);
          });
        } else {
          setSseConnected(false);
          resumeRagJobs();
        }
        return;
      }

      setIndexing(false);
      setIndexingProgress(null);
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
      abortControllerRef.current = null;
      setSseConnected(false);

      if (activeJobIdsRef.current.size > 0) {
        // The trigger stream only acknowledges queue acceptance. Its browser
        // connection can close while the durable project job keeps running.
        setIndexing(true);
        setIndexingProgress("Reconnecting to persisted RAG job progress...");
        setIndexingError(null);
        return;
      }

      setIndexing(false);
      setIndexingProgress(null);
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
      requestedBranch,
      handleProgress,
      handleComplete,
      handleError,
      allConfiguredBranches,
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

  const getBranchStatusBadge = (status: RagBranchIndexStatusDTO["status"]) => {
    switch (status) {
      case "READY":
        return <Badge className="bg-green-500">Ready</Badge>;
      case "PENDING":
      case "BUILDING":
        return <Badge className="bg-blue-500">Building</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Not indexed</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const formatRemainingTime = (milliseconds?: number) => {
    if (milliseconds === undefined || milliseconds < 0) return null;
    const seconds = Math.max(0, Math.round(milliseconds / 1000));
    if (seconds < 60) return `~${seconds}s remaining`;
    return `~${Math.floor(seconds / 60)}m ${seconds % 60}s remaining`;
  };

  const branchProgressPercent = (progress?: BranchIndexProgress) => {
    if (!progress) return 0;
    if (progress.estimatedChunks && progress.estimatedChunks > 0) {
      return Math.min(100, (100 * (progress.indexedChunks ?? 0)) / progress.estimatedChunks);
    }
    if (progress.totalBatches && progress.totalBatches > 0) {
      return (100 * (progress.completedBatches ?? 0)) / progress.totalBatches;
    }
    return 0;
  };

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  };

  const hasChanges =
    enabled !== (project.ragConfig?.enabled ?? false) ||
    branch.trim() !== (project.ragConfig?.branch ?? "") ||
    !arraysEqual(includePatterns, project.ragConfig?.includePatterns ?? []) ||
    !arraysEqual(excludePatterns, project.ragConfig?.excludePatterns ?? []) ||
    multiBranchEnabled !== (project.ragConfig?.multiBranchEnabled ?? false) ||
    branchRetentionDays !== (project.ragConfig?.branchRetentionDays ?? 30) ||
    indexedBranches.trim() !==
      (project.ragConfig?.indexedBranches ?? []).join(", ") ||
    transientBranchIndexesEnabled !==
      (project.ragConfig?.transientBranchIndexesEnabled ?? false);

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
        <div
          className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
            enabled
              ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
              : "border-border bg-muted/20"
          }`}
        >
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

        <div className="space-y-2 rounded-lg border p-4">
          <Label htmlFor="rag-framework-preset">Framework preset</Label>
          <Select
            value={frameworkPresetId}
            onValueChange={handleFrameworkPresetChange}
            disabled={updating || !enabled}
          >
            <SelectTrigger id="rag-framework-preset">
              <SelectValue placeholder="Select a framework preset" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_FRAMEWORK_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {getProjectFrameworkPreset(frameworkPresetId).description} Applying
            a preset replaces the include and exclude patterns below; you can
            customize them before saving.
          </p>
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

        <div className="rounded-lg border p-4 space-y-3">
          <div>
            <Label>Synchronize with PR and Branch Analysis</Label>
            <p className="text-sm text-muted-foreground">
              Copy include and exclude patterns in either direction. Other RAG settings remain unchanged.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => handleScopeSync("FROM_RAG")} disabled={syncingScopes}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncingScopes ? "animate-spin" : ""}`} />RAG → Analysis
            </Button>
            <Button type="button" variant="outline" onClick={() => handleScopeSync("TO_RAG")} disabled={syncingScopes}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncingScopes ? "animate-spin" : ""}`} />Analysis → RAG
            </Button>
          </div>
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
                  <strong>Multi-Branch Indexing</strong> keeps an independent,
                  revision-pinned index for each retained target branch. A PR
                  against <code>master</code> queries the master generation; a
                  PR against <code>develop</code> queries develop. Source changes
                  are added as an isolated PR overlay.
                </AlertDescription>
              </Alert>

              {/* Enable Multi-Branch Indexing */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="multi-branch-enabled">
                    Enable Multi-Branch Indexing
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Keep exact indexes for the primary branch and selected
                    analysis targets
                  </p>
                </div>
                <Switch
                  id="multi-branch-enabled"
                  checked={multiBranchEnabled}
                  onCheckedChange={setMultiBranchEnabled}
                  disabled={updating || !enabled}
                />
              </div>

              {/* Retained branches */}
              {multiBranchEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="indexed-branches">Retained target branches</Label>
                  <Input
                    id="indexed-branches"
                    value={indexedBranches}
                    onChange={(event) => setIndexedBranches(event.target.value)}
                    placeholder="develop, release/next"
                    disabled={updating || !enabled}
                  />
                  <p className="text-sm text-muted-foreground">
                    Comma-separated exact branch names, excluding the primary
                    branch above. Leaving this empty preserves legacy Branch
                    Push Pattern behavior for existing projects.
                  </p>
                </div>
              )}

              {multiBranchEnabled && (
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="transient-branch-indexes">
                      Temporary indexes for other PR targets
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Build a revision-pinned target snapshot when an analyzed PR
                      targets a branch that is not retained. Branch pushes do not
                      make it durable.
                    </p>
                  </div>
                  <Switch
                    id="transient-branch-indexes"
                    checked={transientBranchIndexesEnabled}
                    onCheckedChange={setTransientBranchIndexesEnabled}
                    disabled={updating || !enabled}
                  />
                </div>
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
                  Automatically clean up inactive temporary PR-target indexes
                  after this many days. Retained branches stay available until
                  their branch is deleted or removed from the project.
                </p>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {enabled && multiBranchEnabled && (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 font-medium">
                  <Layers className="h-4 w-4" />
                  Configured branch indexes
                </div>
                <p className="text-sm text-muted-foreground">
                  Each row is an independently queryable RAG snapshot. Refresh
                  creates a new exact revision for that branch.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTriggerIndexing(null, true)}
                disabled={updating || indexing || hasChanges || branchIndexes.length === 0}
              >
                {indexing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh all
              </Button>
            </div>

            {hasChanges && (
              <p className="text-sm text-muted-foreground">
                Save the branch configuration before starting an index build.
              </p>
            )}

            <div className="space-y-2">
              {branchIndexes.map((index) => (
                <div
                  key={`${index.role}-${index.branchName}`}
                  className="grid gap-2 rounded-md border p-3 text-sm md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="truncate rounded bg-muted px-1.5 py-0.5 text-xs">
                        {index.branchName}
                      </code>
                      <Badge variant="outline">{index.role === "PRIMARY" ? "Primary" : "Retained"}</Badge>
                      {getBranchStatusBadge(index.status)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Revision: {index.activeRevision ? index.activeRevision.slice(0, 12) : "—"}
                      {" · "}
                      Updated: {formatDate(index.lastUpdatedAt)}
                      {index.fileCount !== null && index.chunkCount !== null
                        ? ` · ${index.fileCount} files / ${index.chunkCount} chunks`
                        : ""}
                    </div>
                    {index.errorMessage && (
                      <p className="mt-1 text-xs text-destructive">{index.errorMessage}</p>
                    )}
                    {branchProgress[index.branchName] && index.status === "BUILDING" && (
                      <div className="mt-2 space-y-1">
                        <Progress value={branchProgressPercent(branchProgress[index.branchName])} className="h-1.5" />
                        <p className="text-xs text-muted-foreground">
                          {branchProgress[index.branchName].estimatedChunks
                            ? `${branchProgress[index.branchName].indexedChunks ?? 0} / ~${branchProgress[index.branchName].estimatedChunks} chunks`
                            : `${branchProgress[index.branchName].completedBatches ?? 0} / ${branchProgress[index.branchName].totalBatches ?? "?"} batches`}
                          {branchProgress[index.branchName].totalBatches
                            ? ` · batch ${branchProgress[index.branchName].completedBatches ?? 0}/${branchProgress[index.branchName].totalBatches}`
                            : ""}
                          {formatRemainingTime(branchProgress[index.branchName].estimatedRemainingMs)
                            ? ` · ${formatRemainingTime(branchProgress[index.branchName].estimatedRemainingMs)}`
                            : ""}
                        </p>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTriggerIndexing(index.branchName)}
                    disabled={updating || indexing || hasChanges || index.status === "BUILDING" || index.status === "PENDING"}
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    {index.status === "NOT_INDEXED" ? "Build" : "Refresh"}
                  </Button>
                </div>
              ))}
              {branchIndexes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Save a primary branch and at least one retained target branch to manage their indexes here.
                </p>
              )}
            </div>
          </div>
        )}

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
                <span className="text-muted-foreground">Codebase:</span>
                <span className="ml-2">
                  {ragStatus.indexStatus.totalFilesIndexed ?? "—"} files (
                  {ragStatus.indexStatus.chunkCount ?? "—"} chunks)
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {ragStatus.indexStatus.status === "INDEXING" ||
                  ragStatus.indexStatus.status === "UPDATING"
                    ? "Last activity:"
                    : "Last Indexed:"}
                </span>
                <span className="ml-2">
                  {formatDate(
                    ragStatus.indexStatus.status === "INDEXING" ||
                      ragStatus.indexStatus.status === "UPDATING"
                      ? ragStatus.indexStatus.updatedAt
                      : ragStatus.indexStatus.lastIndexedAt,
                  )}
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
          (["INDEXING", "UPDATING"].includes(
            ragStatus?.indexStatus?.status ?? "",
          ) && !sseConnected)) && (
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
                        <span className="text-xs">Live</span>
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
                  {/* Transient warning while reconnecting to the persisted job. */}
                  {!sseConnected &&
                    ["INDEXING", "UPDATING"].includes(
                      ragStatus?.indexStatus?.status ?? "",
                    ) && (
                      <Alert className="mx-3 mb-2 bg-amber-500/10 border-amber-500/30">
                        <WifiOff className="h-4 w-4 text-amber-500" />
                        <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs">
                          <strong>Reconnecting.</strong> Indexing is still
                          running in the background. CodeCrow is restoring the
                          persisted job log and will continue from the last
                          recorded event.
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
                            className={`flex gap-2 ${log.type === "error"
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

          <Button
            variant="outline"
            onClick={handleTriggerIndexing}
            disabled={!enabled || indexing || !ragStatus?.canStartIndexing}
          >
            {indexing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Indexing…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Trigger Indexing
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadRagStatus()}
            disabled={loading || indexing}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {!ragStatus?.canStartIndexing && enabled && !indexing && (
          <p className="text-sm text-muted-foreground">
            {ragStatus?.indexStatus?.status === "INDEXING"
              ? "Indexing is currently in progress. The status will update automatically when complete."
              : "Please wait before triggering another indexing operation."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
