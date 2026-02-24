import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  useParams,
  useSearchParams,
  Link,
  useNavigate,
} from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  analysisService,
  type AnalysisFilesResponse,
  type AnalysisFileEntry,
  type FileViewResponse,
  type InlineIssue,
  type SourceAvailabilityResponse,
} from "@/api_service/analysis/analysisService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  FileText,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Code2,
  FolderOpen,
  Folder,
  ChevronLeft,
  GitBranch,
  GitPullRequest,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/components/ThemeProvider";
import { getCategoryInfo } from "@/config/issueCategories";
import { cn } from "@/lib/utils";
import { useWorkspaceRoutes } from "@/hooks/useWorkspaceRoutes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Language detection ──────────────────────────────────────────────

function detectLanguage(filepath: string): string {
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
    zsh: "bash",
    md: "markdown",
    dockerfile: "docker",
    tf: "hcl",
    gradle: "groovy",
    groovy: "groovy",
  };
  return langMap[ext] || "text";
}

// ── Severity helpers ────────────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
  info: 3,
};

function SeverityIcon({
  severity,
  className,
}: {
  severity: string;
  className?: string;
}) {
  const s = severity.toLowerCase();
  if (s === "high")
    return (
      <AlertCircle className={cn("h-3.5 w-3.5 text-red-500", className)} />
    );
  if (s === "medium")
    return (
      <AlertTriangle className={cn("h-3.5 w-3.5 text-yellow-500", className)} />
    );
  if (s === "low")
    return <Info className={cn("h-3.5 w-3.5 text-green-500", className)} />;
  return <Info className={cn("h-3.5 w-3.5 text-blue-400", className)} />;
}

function severityBadgeClass(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "high")
    return "bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-300";
  if (s === "medium")
    return "bg-yellow-200 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300";
  if (s === "low")
    return "bg-green-200 text-green-800 dark:bg-green-900/60 dark:text-green-300";
  return "bg-blue-200 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300";
}

function severityLineClass(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "high") return "bg-red-500/15 dark:bg-red-500/10";
  if (s === "medium") return "bg-yellow-500/15 dark:bg-yellow-500/10";
  if (s === "low") return "bg-green-500/10 dark:bg-green-500/8";
  return "bg-blue-500/10 dark:bg-blue-500/8";
}

function severityGutterClass(severity: string): string {
  const s = severity.toLowerCase();
  if (s === "high") return "border-l-2 border-red-500";
  if (s === "medium") return "border-l-2 border-yellow-500";
  if (s === "low") return "border-l-2 border-green-500";
  return "border-l-2 border-blue-400";
}

// ── File Tree Data Structures ───────────────────────────────────────

interface FileTreeNode {
  name: string;
  fullPath: string;
  isDirectory: boolean;
  children: FileTreeNode[];
  file?: AnalysisFileEntry;
  // Aggregated issue counts for directories
  issueCount: number;
  highCount: number;
  mediumCount: number;
}

/**
 * Build a hierarchical file tree from flat file entries.
 * Optimized: single-pass tree construction + path compression for single-child dirs.
 */
function buildFileTree(files: AnalysisFileEntry[]): FileTreeNode[] {
  const root: FileTreeNode = {
    name: "",
    fullPath: "",
    isDirectory: true,
    children: [],
    issueCount: 0,
    highCount: 0,
    mediumCount: 0,
  };

  // Build tree from flat paths in a single pass using a Map for O(1) lookups
  const dirMap = new Map<string, FileTreeNode>();
  dirMap.set("", root);

  const getOrCreateDir = (dirPath: string): FileTreeNode => {
    if (dirMap.has(dirPath)) return dirMap.get(dirPath)!;
    const parts = dirPath.split("/");
    const name = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join("/");
    const parent = getOrCreateDir(parentPath);
    const node: FileTreeNode = {
      name,
      fullPath: dirPath,
      isDirectory: true,
      children: [],
      issueCount: 0,
      highCount: 0,
      mediumCount: 0,
    };
    parent.children.push(node);
    dirMap.set(dirPath, node);
    return node;
  };

  for (const file of files) {
    const parts = file.filePath.split("/");
    const fileName = parts[parts.length - 1];
    const dirPath = parts.slice(0, -1).join("/");
    const parentDir = dirPath ? getOrCreateDir(dirPath) : root;

    const fileNode: FileTreeNode = {
      name: fileName,
      fullPath: file.filePath,
      isDirectory: false,
      children: [],
      file,
      issueCount: file.issueCount,
      highCount: file.highCount,
      mediumCount: file.mediumCount,
    };
    parentDir.children.push(fileNode);
  }

  // Propagate issue counts up the tree (bottom-up via post-order)
  const propagateCounts = (node: FileTreeNode): void => {
    if (!node.isDirectory) return;
    node.issueCount = 0;
    node.highCount = 0;
    node.mediumCount = 0;
    for (const child of node.children) {
      propagateCounts(child);
      node.issueCount += child.issueCount;
      node.highCount += child.highCount;
      node.mediumCount += child.mediumCount;
    }
  };
  propagateCounts(root);

  // Sort: directories first (alphabetical), then files (alphabetical)
  const sortTree = (node: FileTreeNode): void => {
    node.children.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortTree);
  };
  sortTree(root);

  // Compress single-child directory chains (e.g. src/main/java → "src/main/java")
  const compressTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes.map((node) => {
      if (!node.isDirectory) return node;
      // Compress: while a dir has exactly 1 child that's also a dir, merge names
      let current = node;
      while (current.children.length === 1 && current.children[0].isDirectory) {
        const child = current.children[0];
        current = {
          ...child,
          name: `${current.name}/${child.name}`,
        };
      }
      current.children = compressTree(current.children);
      return current;
    });
  };

  return compressTree(root.children);
}

// ── File Tree Component ─────────────────────────────────────────────

interface FileTreeItemProps {
  node: FileTreeNode;
  depth: number;
  selectedFile: string | null;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
  onSelectFile: (filePath: string) => void;
  activeIssueId: number | null;
  fileView: FileViewResponse | null;
  fileLoading: boolean;
  onIssueClick: (filePath: string, issue: InlineIssue) => void;
}

function FileTreeItem({
  node,
  depth,
  selectedFile,
  expandedDirs,
  onToggleDir,
  onSelectFile,
  activeIssueId,
  fileView,
  fileLoading,
  onIssueClick,
}: FileTreeItemProps) {
  const isExpanded = expandedDirs.has(node.fullPath);
  const paddingLeft = depth * 12;

  if (node.isDirectory) {
    return (
      <div>
        <button
          onClick={() => onToggleDir(node.fullPath)}
          className="w-full flex items-center gap-1 py-1 px-1.5 rounded text-left text-xs text-foreground/80 hover:bg-muted/60 transition-colors"
          style={{ paddingLeft }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-500/80" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-amber-500/60" />
          )}
          <span className="truncate flex-1 min-w-0">{node.name}</span>
          {node.issueCount > 0 && (
            <IssueBadges
              issueCount={node.issueCount}
              highCount={node.highCount}
              mediumCount={node.mediumCount}
            />
          )}
        </button>
        {isExpanded && (
          <div>
            {node.children.map((child) => (
              <FileTreeItem
                key={child.fullPath}
                node={child}
                depth={depth + 1}
                selectedFile={selectedFile}
                expandedDirs={expandedDirs}
                onToggleDir={onToggleDir}
                onSelectFile={onSelectFile}
                activeIssueId={activeIssueId}
                fileView={fileView}
                fileLoading={fileLoading}
                onIssueClick={onIssueClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File node
  const isSelected = selectedFile === node.fullPath;
  const hasIssues = node.issueCount > 0;
  // Issues are shown when the file is selected (always expanded for active file)
  const isIssuesExpanded = isSelected && hasIssues;

  return (
    <div>
      <button
        onClick={() => {
          onSelectFile(node.fullPath);
        }}
        className={cn(
          "w-full flex items-center gap-1 py-1 px-1.5 rounded text-left text-xs transition-colors",
          isSelected
            ? "bg-primary/10 text-primary font-medium"
            : "text-foreground/80 hover:bg-muted/60",
        )}
        style={{ paddingLeft }}
      >
        <span className="w-3 shrink-0" />
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate flex-1 min-w-0">{node.name}</span>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {node.fullPath}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {hasIssues && (
          <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
            ({node.issueCount})
          </span>
        )}
        {hasIssues && (
          <IssueBadges
            issueCount={node.issueCount}
            highCount={node.highCount}
            mediumCount={node.mediumCount}
          />
        )}
      </button>

      {/* Expanded inline issues for selected file */}
      {isIssuesExpanded && (
        <div
          className="border-l border-border/40 space-y-0.5 py-1"
          style={{ marginLeft: paddingLeft + 16, paddingLeft: 8 }}
        >
          {fileLoading ? (
            <div className="px-2 py-1">
              <span className="text-[10px] text-muted-foreground/60 animate-pulse">
                Loading issues…
              </span>
            </div>
          ) : fileView && fileView.issues.length > 0 ? (
            fileView.issues
              .sort(
                (a, b) =>
                  (SEVERITY_ORDER[a.severity.toLowerCase()] ?? 9) -
                  (SEVERITY_ORDER[b.severity.toLowerCase()] ?? 9),
              )
              .map((issue) => (
                <button
                  key={issue.issueId}
                  onClick={() => onIssueClick(node.fullPath, issue)}
                  className={cn(
                    "w-full flex items-start gap-1.5 px-2 py-1.5 rounded text-left text-[11px] transition-colors",
                    activeIssueId === issue.issueId
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <SeverityIcon
                    severity={issue.severity}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="line-clamp-2 leading-relaxed">
                      {issue.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 mt-0.5 block">
                      Line {issue.lineNumber}
                    </span>
                  </div>
                  {issue.resolved && (
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                  )}
                </button>
              ))
          ) : (
            <span className="text-[10px] text-muted-foreground/60 px-2">
              {node.issueCount} issue{node.issueCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function IssueBadges({
  issueCount,
  highCount,
  mediumCount,
}: {
  issueCount: number;
  highCount: number;
  mediumCount: number;
}) {
  const lowCount = issueCount - highCount - mediumCount;
  return (
    <div className="flex items-center gap-0.5 shrink-0 ml-auto">
      {highCount > 0 && (
        <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold">
          {highCount}
        </span>
      )}
      {mediumCount > 0 && (
        <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold">
          {mediumCount}
        </span>
      )}
      {lowCount > 0 && (
        <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
          {lowCount}
        </span>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────

// ── Component Props ─────────────────────────────────────────────────

export interface SourceViewProps {
  /** 'analysis' (default) uses analysisId from URL; 'pr' uses prNumber from URL; 'branch' uses branchName from URL */
  mode?: "analysis" | "pr" | "branch";
}

export default function AnalysisSourceView({
  mode = "analysis",
}: SourceViewProps) {
  const { namespace, analysisId, prNumber, branchName } = useParams<{
    namespace: string;
    analysisId: string;
    prNumber: string;
    branchName: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { theme } = useTheme();
  const routes = useWorkspaceRoutes();

  const decodedBranch = branchName ? decodeURIComponent(branchName) : "";

  // State
  const [filesData, setFilesData] = useState<AnalysisFilesResponse | null>(
    null,
  );
  const [fileView, setFileView] = useState<FileViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [activeIssueId, setActiveIssueId] = useState<number | null>(null);

  // Drag-resize sidebar
  const isResizing = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Source availability for the branch/PR selector
  const [sourceAvailability, setSourceAvailability] =
    useState<SourceAvailabilityResponse | null>(null);

  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const issueRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const selectedFile = searchParams.get("file");
  const highlightIssueId = searchParams.get("issueId")
    ? parseInt(searchParams.get("issueId")!)
    : null;

  // ── Data Loading ──────────────────────────────────────────────────

  const loadFiles = useCallback(async () => {
    if (!currentWorkspace || !namespace) return;

    // Determine what to load based on mode
    if (mode === "pr") {
      if (!prNumber) return;
    } else if (mode === "branch") {
      if (!decodedBranch) return;
    } else {
      if (!analysisId) return;
    }

    try {
      setLoading(true);
      let data: AnalysisFilesResponse;

      if (mode === "pr") {
        data = await analysisService.getPrFiles(
          currentWorkspace.slug,
          namespace,
          prNumber!,
        );
      } else if (mode === "branch") {
        data = await analysisService.getBranchFiles(
          currentWorkspace.slug,
          namespace,
          decodedBranch,
        );
      } else {
        data = await analysisService.getAnalysisFiles(
          currentWorkspace.slug,
          namespace,
          analysisId!,
        );
      }
      setFilesData(data);

      // Auto-expand directories that contain files with issues
      const expanded = new Set<string>();
      data.files.forEach((f) => {
        if (f.issueCount > 0) {
          // Expand all parent directories of files with issues
          const parts = f.filePath.split("/");
          let path = "";
          for (let i = 0; i < parts.length - 1; i++) {
            path = path ? `${path}/${parts[i]}` : parts[i];
            expanded.add(path);
          }
          // Also auto-expand the file's issue list
          expanded.add(`file:${f.filePath}`);
        }
      });
      setExpandedDirs(expanded);

      // If a file is specified in URL, load it; otherwise load first file with issues
      const targetFile =
        selectedFile ||
        data.files.find((f) => f.issueCount > 0)?.filePath ||
        data.files[0]?.filePath;
      if (targetFile) {
        loadFileView(targetFile);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load analysis files",
        description: error.message || "Could not load file list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, namespace, analysisId, prNumber, decodedBranch, mode]);

  const loadFileView = useCallback(
    async (filePath: string) => {
      if (!currentWorkspace || !namespace) return;

      if (mode === "pr") {
        if (!prNumber) return;
      } else if (mode === "branch") {
        if (!decodedBranch) return;
      } else {
        if (!analysisId) return;
      }

      try {
        setFileLoading(true);
        setFileView(null);
        setActiveIssueId(null);

        // Update URL immediately so sidebar highlights the selected file
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("file", filePath);
            next.delete("issueId");
            return next;
          },
          { replace: true },
        );

        let data: FileViewResponse;

        if (mode === "pr") {
          data = await analysisService.getPrFileView(
            currentWorkspace.slug,
            namespace,
            prNumber!,
            filePath,
          );
        } else if (mode === "branch") {
          data = await analysisService.getBranchFileView(
            currentWorkspace.slug,
            namespace,
            decodedBranch,
            filePath,
          );
        } else {
          data = await analysisService.getFileView(
            currentWorkspace.slug,
            namespace,
            analysisId!,
            filePath,
          );
        }
        setFileView(data);
      } catch (error: any) {
        toast({
          title: "Failed to load file",
          description: error.message || `Could not load ${filePath}`,
          variant: "destructive",
        });
      } finally {
        setFileLoading(false);
      }
    },
    [currentWorkspace, namespace, analysisId, prNumber, decodedBranch, mode],
  );

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Load source availability for the branch/PR selector
  useEffect(() => {
    if (!currentWorkspace || !namespace) return;
    analysisService
      .getSourceAvailability(currentWorkspace.slug, namespace)
      .then(setSourceAvailability)
      .catch(() => {
        /* non-critical */
      });
  }, [currentWorkspace, namespace]);

  // Sidebar drag-resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !sidebarRef.current) return;
      e.preventDefault();
      const sidebarLeft = sidebarRef.current.getBoundingClientRect().left;
      const newWidth = Math.max(200, Math.min(600, e.clientX - sidebarLeft));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  // Scroll to highlighted issue after file loads
  useEffect(() => {
    if (!fileView || !highlightIssueId) return;
    const issue = fileView.issues.find((i) => i.issueId === highlightIssueId);
    if (issue) {
      setActiveIssueId(highlightIssueId);
      // Slight delay for DOM to paint
      setTimeout(() => scrollToLine(issue.lineNumber), 150);
    }
  }, [fileView, highlightIssueId]);

  // ── Scroll helpers ────────────────────────────────────────────────

  const scrollToLine = (lineNumber: number) => {
    const el = lineRefs.current.get(lineNumber);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleIssueClick = (issue: InlineIssue) => {
    // If clicking issue in same file, just scroll
    if (fileView && fileView.filePath === getFileForIssue(issue)) {
      setActiveIssueId(issue.issueId);
      scrollToLine(issue.lineNumber);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("issueId", String(issue.issueId));
          return next;
        },
        { replace: true },
      );
    }
  };

  const handleSidebarIssueClick = (filePath: string, issue: InlineIssue) => {
    if (fileView?.filePath === filePath) {
      // Same file — just scroll to line
      setActiveIssueId(issue.issueId);
      scrollToLine(issue.lineNumber);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("issueId", String(issue.issueId));
          return next;
        },
        { replace: true },
      );
    } else {
      // Different file — load it, then we'll scroll via highlightIssueId
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("file", filePath);
          next.set("issueId", String(issue.issueId));
          return next;
        },
        { replace: true },
      );
      loadFileView(filePath);
    }
  };

  const getFileForIssue = (_issue: InlineIssue): string => {
    return fileView?.filePath || "";
  };

  // ── Build issue lookup by line ────────────────────────────────────

  const issuesByLine = useMemo(() => {
    if (!fileView) return new Map<number, InlineIssue[]>();
    const map = new Map<number, InlineIssue[]>();
    fileView.issues.forEach((issue) => {
      const existing = map.get(issue.lineNumber) || [];
      existing.push(issue);
      map.set(issue.lineNumber, existing);
    });
    return map;
  }, [fileView]);

  // ── Build file tree ───────────────────────────────────────────────

  const fileTree = useMemo(() => {
    if (!filesData) return [];
    return buildFileTree(filesData.files);
  }, [filesData]);

  const handleToggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  // ── File name helpers ─────────────────────────────────────────────

  const getFileName = (filePath: string) => {
    const parts = filePath.split(/[/\\]/);
    return parts[parts.length - 1];
  };

  const getDirPath = (filePath: string) => {
    const parts = filePath.split(/[/\\]/);
    if (parts.length <= 1) return "";
    return parts.slice(0, -1).join("/");
  };

  // ── Source selector handler ────────────────────────────────────────

  const handleSourceSwitch = useCallback(
    (value: string) => {
      if (!namespace) return;
      if (value.startsWith("branch:")) {
        const branch = value.substring(7);
        navigate(routes.branchSourceView(namespace, branch));
      } else if (value.startsWith("pr:")) {
        const pr = value.substring(3);
        navigate(routes.prSourceView(namespace, Number(pr)));
      }
    },
    [namespace, navigate, routes],
  );

  const currentSelectorValue = useMemo(() => {
    if (mode === "branch" && decodedBranch) return `branch:${decodedBranch}`;
    if (mode === "pr" && prNumber) return `pr:${prNumber}`;
    return "";
  }, [mode, decodedBranch, prNumber]);

  /** Build a back link that preserves branch/PR context for the dashboard */
  const backLink = useMemo(() => {
    const base = routes.projectDetail(namespace!);
    if (mode === "branch" && decodedBranch) {
      return `${base}?branch=${encodeURIComponent(decodedBranch)}&subTab=source`;
    }
    // For PR mode we don't have the database prId, so just return base
    return base;
  }, [namespace, mode, decodedBranch, routes]);

  // ── Loading state ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex gap-4 h-[calc(100vh-200px)]">
          <Skeleton className="w-80 h-full" />
          <Skeleton className="flex-1 h-full" />
        </div>
      </div>
    );
  }

  if (!filesData || filesData.files.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to={backLink} onClick={(e) => {
            if (e.ctrlKey || e.metaKey || e.button === 1) return;
            e.preventDefault();
            navigate(-1);
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Code2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            No Source Files Available
          </h2>
          <p className="text-muted-foreground text-sm max-w-md">
            Source files are stored when an analysis runs. This analysis may not
            have source file data available yet.
          </p>
        </div>
      </div>
    );
  }

  const totalIssues = filesData.files.reduce((sum, f) => sum + f.issueCount, 0);
  const totalHigh = filesData.files.reduce((sum, f) => sum + f.highCount, 0);
  const totalMedium = filesData.files.reduce(
    (sum, f) => sum + f.mediumCount,
    0,
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to={backLink} onClick={(e) => {
              if (e.ctrlKey || e.metaKey || e.button === 1) return;
              e.preventDefault();
              navigate(-1);
            }}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2 text-sm">
            <Code2 className="h-4 w-4 text-primary" />
            <span className="font-semibold">Source Viewer</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {mode === "branch" ? (
                <>
                  <GitBranch className="h-3 w-3 mr-1 inline" />
                  {decodedBranch}
                </>
              ) : mode === "pr" ? (
                `PR #${prNumber}`
              ) : (
                `Analysis #${analysisId}`
              )}
            </Badge>
            {filesData?.commitHash && (
              <Badge variant="secondary" className="text-[10px] font-mono">
                {filesData.commitHash.substring(0, 8)}
              </Badge>
            )}
            {filesData?.prVersion && (
              <Badge variant="secondary" className="text-[10px]">
                v{filesData.prVersion}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Branch/PR selector — only for branch and pr modes with availability data */}
          {sourceAvailability &&
            (mode === "branch" || mode === "pr") &&
            (sourceAvailability.branches.length > 0 ||
              sourceAvailability.prNumbers.length > 0) && (
              <Select
                value={currentSelectorValue}
                onValueChange={handleSourceSwitch}
              >
                <SelectTrigger className="w-[240px] h-8 text-xs">
                  <SelectValue placeholder="Switch source..." />
                </SelectTrigger>
                <SelectContent>
                  {sourceAvailability.branches.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Branches
                      </div>
                      {sourceAvailability.branches.map((branch) => (
                        <SelectItem
                          key={`branch:${branch}`}
                          value={`branch:${branch}`}
                          className="text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="truncate">{branch}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {sourceAvailability.prNumbers.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                        Pull Requests
                      </div>
                      {sourceAvailability.prNumbers.map((pr) => (
                        <SelectItem
                          key={`pr:${pr}`}
                          value={`pr:${pr}`}
                          className="text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <GitPullRequest className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span>PR #{pr}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {filesData.files.length} files · {totalIssues} issues
            </span>
            {totalHigh > 0 && (
              <Badge className="bg-red-200 text-red-800 dark:bg-red-900/60 dark:text-red-300 text-[10px]">
                {totalHigh} high
              </Badge>
            )}
            {totalMedium > 0 && (
              <Badge className="bg-yellow-200 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300 text-[10px]">
                {totalMedium} medium
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — File tree + issues */}
        <div
          ref={sidebarRef}
          className={cn(
            "bg-card/40 flex flex-col shrink-0 relative",
            sidebarCollapsed ? "w-10" : "",
          )}
          style={sidebarCollapsed ? undefined : { width: sidebarWidth }}
        >
          {/* Sidebar toggle */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/30 min-h-[36px]">
            {!sidebarCollapsed && (
              <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase pl-1">
                Files
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          {!sidebarCollapsed && (
            <ScrollArea className="flex-1">
              <div className="p-1.5 space-y-0.5">
                {fileTree.map((node) => (
                  <FileTreeItem
                    key={node.fullPath}
                    node={node}
                    depth={0}
                    selectedFile={selectedFile}
                    expandedDirs={expandedDirs}
                    onToggleDir={handleToggleDir}
                    onSelectFile={(filePath) => loadFileView(filePath)}
                    activeIssueId={activeIssueId}
                    fileView={fileView}
                    fileLoading={fileLoading}
                    onIssueClick={handleSidebarIssueClick}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
          {/* Resize drag handle */}
          {!sidebarCollapsed && (
            <div
              onMouseDown={startResizing}
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10 border-r border-border/50"
            />
          )}
        </div>

        {/* Main code panel */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* File header */}
          {fileView && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 bg-muted/30 shrink-0 text-xs">
              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">
                {getDirPath(fileView.filePath)}
                {getDirPath(fileView.filePath) && "/"}
              </span>
              <span className="font-semibold">
                {getFileName(fileView.filePath)}
              </span>
              <span className="text-muted-foreground/50 ml-auto shrink-0">
                {fileView.lineCount} lines
              </span>
              {fileView.issues.length > 0 && (
                <>
                  <Separator orientation="vertical" className="h-3" />
                  <span className="text-muted-foreground/50">
                    {fileView.issues.length} issue
                    {fileView.issues.length !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Code content */}
          <ScrollArea className="flex-1">
            {fileLoading ? (
              <div className="p-4 space-y-2">
                {[...Array(30)].map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-5 w-full"
                    style={{ width: `${50 + Math.random() * 50}%` }}
                  />
                ))}
              </div>
            ) : fileView ? (
              <SourceCodeRenderer
                fileView={fileView}
                issuesByLine={issuesByLine}
                activeIssueId={activeIssueId}
                setActiveIssueId={setActiveIssueId}
                lineRefs={lineRefs}
                issueRefs={issueRefs}
                theme={theme}
                namespace={namespace!}
                routes={routes}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <FileText className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Select a file from the sidebar to view its source code
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// ── Source Code Renderer (SonarQube-style) ──────────────────────────

interface SourceCodeRendererProps {
  fileView: FileViewResponse;
  issuesByLine: Map<number, InlineIssue[]>;
  activeIssueId: number | null;
  setActiveIssueId: (id: number | null) => void;
  lineRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  issueRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
  theme: string;
  namespace: string;
  routes: ReturnType<typeof useWorkspaceRoutes>;
}

function SourceCodeRenderer({
  fileView,
  issuesByLine,
  activeIssueId,
  setActiveIssueId,
  lineRefs,
  issueRefs,
  theme,
  namespace,
  routes,
}: SourceCodeRendererProps) {
  const language = detectLanguage(fileView.filePath);
  const lines = fileView.content.split("\n");

  // Clear refs on re-render
  useEffect(() => {
    lineRefs.current.clear();
    issueRefs.current.clear();
  }, [fileView.filePath]);

  return (
    <div className="font-mono text-[13px] leading-[1.6]">
      {lines.map((lineContent, idx) => {
        const lineNumber = idx + 1;
        const lineIssues = issuesByLine.get(lineNumber);
        const hasIssue = !!lineIssues && lineIssues.length > 0;

        // Find the highest severity for this line
        const highestSeverity = lineIssues
          ? lineIssues.reduce((prev, curr) => {
              const prevOrder =
                SEVERITY_ORDER[prev.severity.toLowerCase()] ?? 9;
              const currOrder =
                SEVERITY_ORDER[curr.severity.toLowerCase()] ?? 9;
              return currOrder < prevOrder ? curr : prev;
            }).severity
          : null;

        return (
          <div key={lineNumber}>
            {/* Code line */}
            <div
              ref={(el) => {
                if (el) lineRefs.current.set(lineNumber, el);
              }}
              className={cn(
                "flex group",
                hasIssue && highestSeverity
                  ? `${severityLineClass(highestSeverity)} ${severityGutterClass(highestSeverity)}`
                  : "border-l-2 border-transparent",
              )}
            >
              {/* Line number */}
              <button
                className={cn(
                  "w-14 text-right pr-4 select-none shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors",
                  hasIssue && "text-muted-foreground/60 font-medium",
                )}
                onClick={() => {
                  if (lineIssues && lineIssues.length > 0) {
                    const issue = lineIssues[0];
                    setActiveIssueId(
                      activeIssueId === issue.issueId ? null : issue.issueId,
                    );
                  }
                }}
              >
                {lineNumber}
              </button>

              {/* Issue indicator gutter */}
              <div className="w-6 shrink-0 flex items-center justify-center">
                {hasIssue && highestSeverity && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            if (lineIssues) {
                              setActiveIssueId(
                                activeIssueId === lineIssues[0].issueId
                                  ? null
                                  : lineIssues[0].issueId,
                              );
                            }
                          }}
                        >
                          <SeverityIcon severity={highestSeverity} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs max-w-sm">
                        {lineIssues!.map((i) => (
                          <div key={i.issueId} className="py-0.5">
                            <span className="font-semibold">
                              [{i.severity.toUpperCase()}]
                            </span>{" "}
                            {i.title}
                          </div>
                        ))}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {/* Code content */}
              <div className="flex-1 min-w-0 overflow-x-auto">
                <SyntaxHighlighter
                  language={language}
                  style={theme === "dark" ? vscDarkPlus : vs}
                  wrapLongLines={false}
                  customStyle={{
                    margin: 0,
                    padding: "0 0.75rem 0 0",
                    background: "transparent",
                    fontSize: "inherit",
                    lineHeight: "inherit",
                    border: "none",
                  }}
                  codeTagProps={{
                    style: { fontFamily: "inherit" },
                  }}
                  PreTag="span"
                >
                  {lineContent || " "}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* Inline issue annotations (SonarQube-style cards below the line) */}
            {lineIssues?.map((issue) => (
              <div
                key={issue.issueId}
                ref={(el) => {
                  if (el) issueRefs.current.set(issue.issueId, el);
                }}
                className={cn(
                  "ml-14 mr-4 my-1 rounded-md border transition-all duration-200 overflow-hidden cursor-pointer",
                  activeIssueId === issue.issueId
                    ? "border-primary/50 shadow-md ring-1 ring-primary/20"
                    : "border-border/60 shadow-sm hover:border-border",
                  issue.resolved && "opacity-60",
                )}
                onClick={() =>
                  setActiveIssueId(
                    activeIssueId === issue.issueId ? null : issue.issueId,
                  )
                }
              >
                {/* Issue header */}
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs",
                    activeIssueId === issue.issueId
                      ? "bg-primary/5"
                      : "bg-muted/40",
                  )}
                >
                  {activeIssueId === issue.issueId ? (
                    <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                  <SeverityIcon severity={issue.severity} />
                  <Badge
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      severityBadgeClass(issue.severity),
                    )}
                  >
                    {issue.severity.toUpperCase()}
                  </Badge>
                  {issue.category && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        getCategoryInfo(issue.category).color,
                        getCategoryInfo(issue.category).bgColor,
                        getCategoryInfo(issue.category).borderColor,
                      )}
                    >
                      {getCategoryInfo(issue.category).label}
                    </Badge>
                  )}
                  {issue.resolved && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] px-1.5 py-0">
                      Resolved
                    </Badge>
                  )}
                  {issue.trackingConfidence && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 text-muted-foreground"
                    >
                      {issue.trackingConfidence}
                    </Badge>
                  )}
                  {activeIssueId !== issue.issueId && (
                    <span className="truncate text-muted-foreground/70 text-[11px] min-w-0">
                      {issue.title}
                    </span>
                  )}
                  <Link
                    to={routes.issueDetail(namespace, String(issue.issueId))}
                    className="ml-auto shrink-0 text-[10px] text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    #{issue.issueId}
                  </Link>
                </div>

                {/* Issue body — shown when active */}
                {activeIssueId === issue.issueId && (
                  <div className="px-3 py-2 border-t border-border/30 bg-background text-xs space-y-2">
                    <p className="font-medium text-foreground leading-relaxed">
                      {issue.title}
                    </p>
                    {issue.reason && (
                      <p className="text-muted-foreground leading-relaxed">
                        {issue.reason}
                      </p>
                    )}
                    {issue.suggestedFixDescription && (
                      <div className="pt-1 border-t border-border/20">
                        <span className="text-muted-foreground/70 text-[10px] uppercase tracking-wider font-semibold">
                          Suggested Fix
                        </span>
                        <p className="text-muted-foreground mt-1 leading-relaxed">
                          {issue.suggestedFixDescription}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
      {/* Bottom padding */}
      <div className="h-32" />
    </div>
  );
}
