import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  RefreshCw,
  ChevronsUpDown,
  ExternalLink,
} from "lucide-react";
import { getApiUrl } from "@/config/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════
   Types — matches the backend CommitNode-based API
   ══════════════════════════════════════════════════════════════ */

interface CommitData {
  hash: string;
  message: string | null;
  author: string | null;
  timestamp: string | null;
  parents: string[];
  analysisStatus: "NOT_ANALYZED" | "ANALYZED" | "FAILED";
  analysisId?: number | null;
  analysisResult?: string | null;
  analysisType?: string | null;
  prNumber?: number | null;
  sourceBranch?: string | null;
  targetBranch?: string | null;
  totalIssues?: number;
  highSeverity?: number;
  mediumSeverity?: number;
  lowSeverity?: number;
}

interface BranchData {
  name: string;
  headCommit: string | null;
  healthStatus: string | null;
  totalIssues: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
}

interface GraphApiData {
  commits: CommitData[];
  branches: BranchData[];
}

/* ══════════════════════════════════════════════════════════════
   Layout Constants
   ══════════════════════════════════════════════════════════════ */

const LANE_WIDTH = 20;
const ROW_HEIGHT = 28;
const NODE_RADIUS = 4;
const GRAPH_PAD_LEFT = 12;
const TOP_PADDING = 8;

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#F97316",
  "#14B8A6",
  "#6366F1",
  "#84CC16",
  "#D946EF",
  "#0EA5E9",
  "#F43F5E",
  "#A855F7",
  "#22D3EE",
  "#FB923C",
  "#4ADE80",
  "#E879F9",
  "#FACC15",
];

/* ══════════════════════════════════════════════════════════════
   Graph layout computation — wave-front column algorithm
   This is the standard algorithm used by gitk / tig / SourceTree:
   process commits top-to-bottom, maintain active "rails" that
   track which branch line passes through each column.
   ══════════════════════════════════════════════════════════════ */

interface Rail {
  targetHash: string;
  branchName: string;
}

interface GraphLayout {
  columns: Map<string, number>;
  branchOf: Map<string, string>;
  branchNames: string[];
  branchColors: Map<string, string>;
  maxCol: number;
}

function computeLayout(
  commits: CommitData[],
  branches: BranchData[],
): GraphLayout {
  const commitMap = new Map<string, CommitData>();
  commits.forEach((c) => commitMap.set(c.hash, c));

  // ── Step 1: Assign branches to commits via first-parent walks ──
  const branchOf = new Map<string, string>();

  // Count merge target frequency to prioritize base branches
  const mergeTargetFreq = new Map<string, number>();
  for (const c of commits) {
    if (c.parents.length > 1 && c.targetBranch) {
      mergeTargetFreq.set(
        c.targetBranch,
        (mergeTargetFreq.get(c.targetBranch) || 0) + 1,
      );
    }
  }

  // Sort: most merge-targeted first (base branches like main/develop)
  const sortedBranches = [...branches]
    .filter((b) => b.headCommit && commitMap.has(b.headCommit))
    .sort((a, b) => {
      const ma = mergeTargetFreq.get(a.name) || 0;
      const mb = mergeTargetFreq.get(b.name) || 0;
      if (ma !== mb) return mb - ma;
      return a.name.localeCompare(b.name);
    });

  // Walk from each branch HEAD through first-parents
  for (const branch of sortedBranches) {
    let hash: string | null = branch.headCommit;
    while (hash && commitMap.has(hash) && !branchOf.has(hash)) {
      branchOf.set(hash, branch.name);
      const commit = commitMap.get(hash)!;
      hash = commit.parents.length > 0 ? commit.parents[0] : null;
    }
  }

  // Walk second-parent chains for merge commits with sourceBranch info
  for (const c of commits) {
    if (c.parents.length > 1 && c.sourceBranch) {
      let hash: string | null = c.parents[1];
      while (hash && commitMap.has(hash) && !branchOf.has(hash)) {
        branchOf.set(hash, c.sourceBranch);
        const commit = commitMap.get(hash)!;
        hash = commit.parents.length > 0 ? commit.parents[0] : null;
      }
    }
  }

  // Try to derive branch from merge commit messages
  for (const c of commits) {
    if (!branchOf.has(c.hash) && c.message) {
      const m = c.message.match(/Merge (?:pull request|branch) .* from (\S+)/i);
      if (m) branchOf.set(c.hash, m[1]);
    }
  }

  // Remaining unassigned → __unknown__
  for (const c of commits) {
    if (!branchOf.has(c.hash)) branchOf.set(c.hash, "__unknown__");
  }

  // ── Step 2: Wave-front column assignment ──
  const rails: (Rail | null)[] = [];

  // Pre-seed rails with branch heads in priority order
  for (const branch of sortedBranches) {
    if (branch.headCommit && commitMap.has(branch.headCommit)) {
      rails.push({ targetHash: branch.headCommit, branchName: branch.name });
    }
  }

  const columns = new Map<string, number>();

  for (const commit of commits) {
    const hash = commit.hash;

    // Find which rail expects this commit
    let col = -1;
    for (let i = 0; i < rails.length; i++) {
      if (rails[i]?.targetHash === hash) {
        if (col === -1) {
          col = i;
        } else {
          rails[i] = null; // extra converging rail → free it
        }
      }
    }

    if (col === -1) {
      col = rails.findIndex((r) => r === null);
      if (col === -1) {
        col = rails.length;
        rails.push(null);
      }
    }

    while (rails.length <= col) rails.push(null);
    columns.set(hash, col);

    // Update rails for parents
    if (commit.parents.length === 0) {
      rails[col] = null;
    } else {
      const firstParent = commit.parents[0];
      if (commitMap.has(firstParent)) {
        rails[col] = {
          targetHash: firstParent,
          branchName:
            branchOf.get(hash) || rails[col]?.branchName || "__unknown__",
        };
      } else {
        rails[col] = null;
      }

      for (let p = 1; p < commit.parents.length; p++) {
        const parentHash = commit.parents[p];
        if (!commitMap.has(parentHash)) continue;
        const existing = rails.findIndex((r) => r?.targetHash === parentHash);
        if (existing === -1) {
          const bName =
            commit.sourceBranch ||
            branchOf.get(parentHash) ||
            `merge-${hash.substring(0, 7)}`;
          const freeSlot = rails.findIndex((r) => r === null);
          if (freeSlot !== -1) {
            rails[freeSlot] = { targetHash: parentHash, branchName: bName };
          } else {
            rails.push({ targetHash: parentHash, branchName: bName });
          }
        }
      }
    }
  }

  // ── Step 3: Branch names & colors ──
  const branchNameSet = new Set<string>();
  for (const name of branchOf.values()) branchNameSet.add(name);

  const allBranchNames = [...branchNameSet].sort((a, b) => {
    if (a === "__unknown__") return 1;
    if (b === "__unknown__") return -1;
    const ma = mergeTargetFreq.get(a) || 0;
    const mb = mergeTargetFreq.get(b) || 0;
    if (ma !== mb) return mb - ma;
    return a.localeCompare(b);
  });

  const branchColorMap = new Map<string, string>();
  allBranchNames.forEach((name, i) =>
    branchColorMap.set(name, COLORS[i % COLORS.length]),
  );

  const maxCol = columns.size > 0 ? Math.max(...columns.values()) : 0;

  return {
    columns,
    branchOf,
    branchNames: allBranchNames.filter((n) => n !== "__unknown__"),
    branchColors: branchColorMap,
    maxCol,
  };
}

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return new Date(ts).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

/* ══════════════════════════════════════════════════════════════
   Analysis dot (tiny inline indicator)
   ══════════════════════════════════════════════════════════════ */

const AnalysisDot = ({
  status,
  result,
}: {
  status: string;
  result?: string | null;
}) => {
  if (status === "ANALYZED") {
    if (result === "FAILED")
      return (
        <span
          className="inline-block w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"
          title="Issues found"
        />
      );
    if (result === "PASSED")
      return (
        <span
          className="inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"
          title="Clean"
        />
      );
    return (
      <span
        className="inline-block w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"
        title="Analyzed"
      />
    );
  }
  if (status === "FAILED")
    return (
      <span
        className="inline-block w-2 h-2 rounded-full bg-red-500 flex-shrink-0"
        title="Analysis failed"
      />
    );
  return null;
};

/* ══════════════════════════════════════════════════════════════
   Branch Filter Popover
   ══════════════════════════════════════════════════════════════ */

const BranchFilterPopover = ({
  branches,
  selected,
  onToggle,
  onSelectAll,
  onDeselectAll,
  colors,
}: {
  branches: BranchData[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  colors: Map<string, string>;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px]">
          <GitBranch className="w-3.5 h-3.5" />
          Branches
          <Badge
            variant="secondary"
            className="ml-1 px-1.5 py-0 text-[10px] rounded-full"
          >
            {selected.size}/{branches.length}
          </Badge>
          <ChevronsUpDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search branches…" />
          <div className="flex items-center gap-1 px-2 py-1.5 border-b">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={onSelectAll}
            >
              Select all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={onDeselectAll}
            >
              Clear
            </Button>
          </div>
          <CommandList className="max-h-[280px]">
            <CommandEmpty>No branches found.</CommandEmpty>
            <CommandGroup>
              {branches.map((b) => (
                <CommandItem
                  key={b.name}
                  value={b.name}
                  onSelect={() => onToggle(b.name)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Checkbox
                      checked={selected.has(b.name)}
                      className="h-3.5 w-3.5 pointer-events-none"
                    />
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colors.get(b.name) || "#888" }}
                    />
                    <span className="font-mono text-xs truncate flex-1">
                      {b.name}
                    </span>
                    {b.healthStatus === "HEALTHY" && (
                      <Shield className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    )}
                    {b.healthStatus === "STALE" && (
                      <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    )}
                    {b.totalIssues > 0 && (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {b.totalIssues}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

/* ══════════════════════════════════════════════════════════════
   Commit Detail Popover
   ══════════════════════════════════════════════════════════════ */

const CommitDetail = ({
  commit,
  branchName,
  color,
  analysisUrl,
}: {
  commit: CommitData;
  branchName: string;
  color: string;
  analysisUrl?: string | null;
}) => (
  <div className="px-3 py-2 rounded-lg border bg-popover text-popover-foreground shadow-lg text-xs whitespace-nowrap min-w-[280px]">
    <div className="flex items-center gap-2 mb-1">
      {commit.parents.length > 1 ? (
        <GitMerge className="w-3.5 h-3.5" style={{ color }} />
      ) : (
        <GitCommit className="w-3.5 h-3.5" style={{ color }} />
      )}
      <span className="font-mono font-semibold">
        {commit.hash.substring(0, 10)}
      </span>
      {commit.prNumber && (
        <span className="text-purple-500 font-medium">
          <GitPullRequest className="w-3 h-3 inline mr-0.5" />
          PR #{commit.prNumber}
        </span>
      )}
    </div>
    <p className="text-foreground truncate max-w-[340px] mb-1">
      {commit.message || "No message"}
    </p>
    <div className="flex items-center gap-2 text-muted-foreground">
      <span>{commit.author}</span>
      {commit.timestamp && <span>· {timeAgo(commit.timestamp)}</span>}
    </div>
    <div className="flex items-center gap-2 mt-1">
      <div className="flex items-center gap-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-mono text-muted-foreground">{branchName}</span>
      </div>
      {commit.sourceBranch && commit.targetBranch && (
        <span className="text-muted-foreground">
          {commit.sourceBranch} → {commit.targetBranch}
        </span>
      )}
    </div>
    {commit.analysisStatus === "ANALYZED" && (
      <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t">
        {commit.analysisResult === "PASSED" && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Clean
          </span>
        )}
        {commit.analysisResult === "FAILED" && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600">
            <AlertCircle className="w-2.5 h-2.5" />
            {commit.totalIssues} issue
            {(commit.totalIssues || 0) !== 1 ? "s" : ""}
            {(commit.highSeverity || 0) > 0 && (
              <span className="text-red-500 ml-0.5">
                ({commit.highSeverity} high)
              </span>
            )}
          </span>
        )}
      </div>
    )}
    {commit.analysisStatus === "FAILED" && (
      <div className="mt-1.5 pt-1.5 border-t">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-600">
          <XCircle className="w-2.5 h-2.5" />
          Analysis Failed
        </span>
      </div>
    )}
    {analysisUrl && commit.analysisStatus === "ANALYZED" && (
      <div className="mt-1.5 pt-1.5 border-t">
        <a
          href={analysisUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-2.5 h-2.5" />
          View Analysis{commit.analysisId ? ` #${commit.analysisId}` : ""}
        </a>
      </div>
    )}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */

export const GitGraphViewer = ({
  projectId,
  workspaceSlug,
  namespace,
}: {
  projectId: number;
  workspaceSlug?: string;
  namespace?: string;
}) => {
  const [data, setData] = useState<GraphApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(
    new Set(),
  );
  const [hoveredCommit, setHoveredCommit] = useState<string | null>(null);
  const [pinnedCommit, setPinnedCommit] = useState<string | null>(null);
  const hoverLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Hover helpers (debounced leave so tooltip stays while mouse travels to it) ── */
  const handleRowEnter = useCallback((hash: string) => {
    if (hoverLeaveTimer.current) {
      clearTimeout(hoverLeaveTimer.current);
      hoverLeaveTimer.current = null;
    }
    setHoveredCommit(hash);
  }, []);

  const handleRowLeave = useCallback(() => {
    hoverLeaveTimer.current = setTimeout(() => {
      setHoveredCommit(null);
      hoverLeaveTimer.current = null;
    }, 150);
  }, []);

  const handleTooltipEnter = useCallback(() => {
    if (hoverLeaveTimer.current) {
      clearTimeout(hoverLeaveTimer.current);
      hoverLeaveTimer.current = null;
    }
  }, []);

  const handleTooltipLeave = useCallback(() => {
    hoverLeaveTimer.current = setTimeout(() => {
      setHoveredCommit(null);
      hoverLeaveTimer.current = null;
    }, 150);
  }, []);

  // Cleanup timer on unmount
  useEffect(
    () => () => {
      if (hoverLeaveTimer.current) clearTimeout(hoverLeaveTimer.current);
    },
    [],
  );

  /* ── Fetch ── */
  const fetchGraph = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = getApiUrl(`/v1/projects/${projectId}/git-graph`);
      const token = localStorage.getItem("codecrow_token");
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
      const result: GraphApiData = await res.json();
      setData(result);
      setSelectedBranches(new Set(result.branches.map((b) => b.name)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  /* ── Full layout (for colors + branch list) ── */
  const fullLayout = useMemo(() => {
    if (!data || data.commits.length === 0) return null;
    return computeLayout(data.commits, data.branches);
  }, [data]);

  /* ── Filter commits by selected branches ── */
  const visibleCommits = useMemo(() => {
    if (!data || !fullLayout) return [];
    return data.commits.filter((c) => {
      const branch = fullLayout.branchOf.get(c.hash);
      if (!branch || branch === "__unknown__") return true;
      return selectedBranches.has(branch);
    });
  }, [data, fullLayout, selectedBranches]);

  /* ── Recompute layout for visible commits only ── */
  const layout = useMemo(() => {
    if (!data || visibleCommits.length === 0) return null;
    return computeLayout(visibleCommits, data.branches);
  }, [data, visibleCommits]);

  /* ── Row index lookup ── */
  const rowIndex = useMemo(() => {
    const map = new Map<string, number>();
    visibleCommits.forEach((c, i) => map.set(c.hash, i));
    return map;
  }, [visibleCommits]);

  /* ── Handlers ── */
  const toggleBranch = useCallback((name: string) => {
    setSelectedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (data) setSelectedBranches(new Set(data.branches.map((b) => b.name)));
  }, [data]);

  const deselectAll = useCallback(() => setSelectedBranches(new Set()), []);

  /* ── Loading / Error / Empty states ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg bg-muted/30">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground text-sm">
          Loading Git Graph…
        </span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-destructive/5 text-destructive p-4">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p className="font-medium text-sm">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchGraph}
          className="mt-3"
        >
          Retry
        </Button>
      </div>
    );
  }
  if (!data || data.commits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-muted/30 text-muted-foreground p-4">
        <GitBranch className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No commit graph data yet.</p>
        <p className="text-xs mt-1 opacity-60">
          Run a branch analysis to start building the commit graph.
        </p>
      </div>
    );
  }

  if (!layout || visibleCommits.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="border-b bg-muted/30 px-3 py-1.5 flex items-center gap-2">
          <BranchFilterPopover
            branches={data.branches}
            selected={selectedBranches}
            onToggle={toggleBranch}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            colors={fullLayout?.branchColors || new Map()}
          />
        </div>
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No commits for selected branches.
        </div>
      </div>
    );
  }

  /* ── Dimensions ── */
  const graphColW = (layout.maxCol + 1) * LANE_WIDTH + GRAPH_PAD_LEFT * 2;
  const svgHeight =
    TOP_PADDING + visibleCommits.length * ROW_HEIGHT + ROW_HEIGHT;
  const activeCommit = pinnedCommit || hoveredCommit;

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* ── Toolbar ── */}
      <div className="border-b bg-muted/30 px-3 py-1.5 flex items-center gap-2 flex-wrap">
        <BranchFilterPopover
          branches={data.branches}
          selected={selectedBranches}
          onToggle={toggleBranch}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          colors={layout.branchColors}
        />

        {/* Branch legend */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {layout.branchNames.slice(0, 8).map((name) => (
            <div
              key={name}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-mono text-muted-foreground"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: layout.branchColors.get(name) }}
              />
              {name.length > 20 ? name.slice(0, 18) + "…" : name}
            </div>
          ))}
          {layout.branchNames.length > 8 && (
            <span className="text-[10px] text-muted-foreground">
              +{layout.branchNames.length - 8}
            </span>
          )}
        </div>

        <span className="text-[10px] text-muted-foreground tabular-nums ml-2">
          {visibleCommits.length} commit{visibleCommits.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Graph area ── */}
      <ScrollArea className="relative" style={{ maxHeight: 600 }}>
        <div className="relative select-none" style={{ minHeight: svgHeight }}>
          {/* ── SVG layer: lines & dots ── */}
          <svg
            width={graphColW}
            height={svgHeight}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ zIndex: 1 }}
          >
            {/* ═══ Lines: commit → parent connections ═══
                These lines ARE the branches. No separate lane lines.
                Same column = straight vertical.
                Different column = smooth bezier S-curve. */}
            {visibleCommits.map((commit, rIdx) => {
              const col = layout.columns.get(commit.hash);
              if (col === undefined) return null;
              const x = GRAPH_PAD_LEFT + col * LANE_WIDTH + LANE_WIDTH / 2;
              const y = TOP_PADDING + rIdx * ROW_HEIGHT + ROW_HEIGHT / 2;

              return commit.parents.map((parentHash, pIdx) => {
                const pRow = rowIndex.get(parentHash);
                if (pRow === undefined) return null;
                const pCol = layout.columns.get(parentHash);
                if (pCol === undefined) return null;
                const px = GRAPH_PAD_LEFT + pCol * LANE_WIDTH + LANE_WIDTH / 2;
                const py = TOP_PADDING + pRow * ROW_HEIGHT + ROW_HEIGHT / 2;

                // First parent = branch continuation (this commit's branch color)
                // Merge parents = the merged branch's color
                const colorBranch =
                  pIdx === 0
                    ? layout.branchOf.get(commit.hash)
                    : layout.branchOf.get(parentHash);
                const lineColor =
                  layout.branchColors.get(colorBranch || "") || "#888";
                const isHl =
                  activeCommit === commit.hash || activeCommit === parentHash;

                if (x === px) {
                  return (
                    <line
                      key={`e-${commit.hash}-${parentHash}`}
                      x1={x}
                      y1={y}
                      x2={px}
                      y2={py}
                      stroke={lineColor}
                      strokeWidth={isHl ? 2.5 : 2}
                      strokeOpacity={isHl ? 1 : 0.65}
                    />
                  );
                }

                // S-curve: depart vertically, arrive vertically
                const midY = (y + py) / 2;
                return (
                  <path
                    key={`e-${commit.hash}-${parentHash}`}
                    d={`M ${x} ${y} C ${x} ${midY}, ${px} ${midY}, ${px} ${py}`}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={isHl ? 2.5 : 2}
                    strokeOpacity={isHl ? 1 : 0.65}
                  />
                );
              });
            })}

            {/* ═══ Commit dots ═══ */}
            {visibleCommits.map((commit, rIdx) => {
              const col = layout.columns.get(commit.hash);
              if (col === undefined) return null;
              const x = GRAPH_PAD_LEFT + col * LANE_WIDTH + LANE_WIDTH / 2;
              const y = TOP_PADDING + rIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
              const branch = layout.branchOf.get(commit.hash) || "__unknown__";
              const color = layout.branchColors.get(branch) || "#888";
              const isMerge = commit.parents.length > 1;
              const isActive = activeCommit === commit.hash;

              const isAnalyzedBad =
                commit.analysisStatus === "ANALYZED" &&
                commit.analysisResult === "FAILED";
              const isAnalysisFailed = commit.analysisStatus === "FAILED";

              const r = isMerge ? NODE_RADIUS + 2 : NODE_RADIUS;

              return (
                <g key={`d-${commit.hash}`}>
                  {isAnalyzedBad && (
                    <circle
                      cx={x}
                      cy={y}
                      r={r + 3}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth={1.5}
                      strokeOpacity={isActive ? 1 : 0.5}
                    />
                  )}
                  {isAnalysisFailed && (
                    <circle
                      cx={x}
                      cy={y}
                      r={r + 3}
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth={1.5}
                      strokeOpacity={isActive ? 1 : 0.5}
                      strokeDasharray="3 2"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={isActive ? r + 1 : r}
                    fill={color}
                    stroke="var(--background, #fff)"
                    strokeWidth={isMerge ? 2 : 1.5}
                  />
                  {isMerge && (
                    <circle
                      cx={x}
                      cy={y}
                      r={2}
                      fill="var(--background, #fff)"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* ── Interactive rows ── */}
          {visibleCommits.map((commit, rIdx) => {
            const top = TOP_PADDING + rIdx * ROW_HEIGHT;
            const isActive = activeCommit === commit.hash;
            const branch = layout.branchOf.get(commit.hash) || "__unknown__";
            const color = layout.branchColors.get(branch) || "#888";

            return (
              <div
                key={`r-${commit.hash}`}
                className={cn(
                  "absolute left-0 right-0 flex items-center cursor-pointer transition-colors duration-75",
                  isActive ? "bg-primary/[0.06]" : "hover:bg-muted/40",
                )}
                style={{ top, height: ROW_HEIGHT, zIndex: 2 }}
                onMouseEnter={() => handleRowEnter(commit.hash)}
                onMouseLeave={handleRowLeave}
                onClick={() =>
                  setPinnedCommit((prev) =>
                    prev === commit.hash ? null : commit.hash,
                  )
                }
              >
                {/* Spacer for graph SVG area */}
                <div className="flex-shrink-0" style={{ width: graphColW }} />

                {/* Commit info */}
                <div className="flex items-center gap-2 min-w-0 pr-3 flex-1">
                  <span className="font-mono text-[11px] text-muted-foreground/70 flex-shrink-0 w-[56px]">
                    {commit.hash.substring(0, 7)}
                  </span>

                  <AnalysisDot
                    status={commit.analysisStatus}
                    result={commit.analysisResult}
                  />

                  {commit.prNumber && (
                    <span className="text-[10px] text-purple-500 font-medium flex-shrink-0">
                      #{commit.prNumber}
                    </span>
                  )}

                  <span className="text-xs truncate min-w-0 flex-1 text-foreground/80">
                    {commit.message
                      ? commit.message.length > 72
                        ? commit.message.substring(0, 70) + "…"
                        : commit.message
                      : "—"}
                  </span>

                  <span className="text-[10px] text-muted-foreground/50 flex-shrink-0 ml-auto">
                    {commit.author}
                  </span>

                  {commit.timestamp && (
                    <span className="text-[10px] text-muted-foreground/40 flex-shrink-0 tabular-nums w-[40px] text-right">
                      {timeAgo(commit.timestamp)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* ── Floating detail popover ── */}
          {activeCommit &&
            (() => {
              const rIdx = rowIndex.get(activeCommit);
              if (rIdx === undefined) return null;
              const commit = visibleCommits[rIdx];
              if (!commit) return null;
              const branch = layout.branchOf.get(commit.hash) || "__unknown__";
              const color = layout.branchColors.get(branch) || "#888";

              // Detect if tooltip would be cropped at the bottom.
              // Approximate tooltip height ~120px; if row is in the last ~150px of the
              // visible area, flip the tooltip above the row instead of below.
              const TOOLTIP_HEIGHT = 140;
              const rowY = TOP_PADDING + rIdx * ROW_HEIGHT;
              const nearBottom = rowY + ROW_HEIGHT + TOOLTIP_HEIGHT > svgHeight;
              const top = nearBottom
                ? rowY - TOOLTIP_HEIGHT
                : rowY + ROW_HEIGHT;

              // Build analysis URL if workspace context is available
              const analysisUrl =
                workspaceSlug && namespace
                  ? `/dashboard/${workspaceSlug}/projects/${namespace}${commit.prNumber ? `?pr=${commit.prNumber}` : ""}`
                  : null;

              return (
                <div
                  className="absolute z-30 animate-in fade-in-0 duration-100"
                  style={{ top: Math.max(0, top), left: graphColW + 8 }}
                  onMouseEnter={handleTooltipEnter}
                  onMouseLeave={handleTooltipLeave}
                >
                  <CommitDetail
                    commit={commit}
                    branchName={branch}
                    color={color}
                    analysisUrl={analysisUrl}
                  />
                </div>
              );
            })()}
        </div>
      </ScrollArea>
    </div>
  );
};
