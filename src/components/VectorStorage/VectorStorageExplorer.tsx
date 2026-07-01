import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import forceAtlas2 from "graphology-layout-forceatlas2";
import {
  Code2,
  Database,
  FileCode,
  Filter,
  GitBranch,
  GitPullRequest,
  Layers,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer2,
  Network,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Split,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import {
  projectService,
  VectorStorageEdge,
  VectorStorageFilters,
  VectorStorageNode,
  VectorStorageOverview,
} from "@/api_service/project/projectService";

interface VectorStorageExplorerProps {
  workspaceSlug: string;
  namespace: string;
  initialBranch?: string | null;
  initialPrNumber?: number | null;
}

type SigmaNodeAttributes = {
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  kind: string;
  raw: VectorStorageNode;
  labelColor?: string;
  forceLabel?: boolean;
  highlighted?: boolean;
  zIndex?: number;
};

type SigmaEdgeAttributes = {
  label: string;
  size: number;
  weight: number;
  color: string;
  kind: string;
  raw: VectorStorageEdge;
  hidden?: boolean;
};

type SigmaGraph = Graph<SigmaNodeAttributes, SigmaEdgeAttributes>;

const NODE_PALETTE = ["#2563eb", "#16a34a", "#db2777", "#0891b2", "#ea580c", "#7c3aed"];

const NODE_KIND_STYLE: Record<string, { color: string; label: string }> = {
  file: { color: "#2563eb", label: "Files" },
  symbol: { color: "#06b6d4", label: "Symbols" },
  parent_class: { color: "#8b5cf6", label: "Classes" },
  class: { color: "#7c3aed", label: "Classes" },
  method: { color: "#16a34a", label: "Methods" },
  function: { color: "#10b981", label: "Functions" },
  import: { color: "#f59e0b", label: "Imports" },
  external_type: { color: "#dc2626", label: "External types" },
  pr_chunk: { color: "#e11d48", label: "PR chunks" },
  code_chunk: { color: "#0284c7", label: "Chunks" },
};

const NODE_LEGEND_ITEMS = [
  { label: "Files", color: NODE_KIND_STYLE.file.color },
  { label: "Chunks", color: NODE_KIND_STYLE.code_chunk.color },
  { label: "Symbols", color: NODE_KIND_STYLE.symbol.color },
  { label: "Classes", color: NODE_KIND_STYLE.class.color },
  { label: "Methods", color: NODE_KIND_STYLE.method.color },
  { label: "Imports", color: NODE_KIND_STYLE.import.color },
  { label: "External types", color: NODE_KIND_STYLE.external_type.color },
  { label: "PR chunks", color: NODE_KIND_STYLE.pr_chunk.color },
];

const EDGE_STYLE: Record<string, { color: string; label: string; size: number }> = {
  file_contains: {
    color: "rgba(148, 163, 184, 0.28)",
    label: "file contains",
    size: 1.05,
  },
  file_sequence: {
    color: "rgba(71, 85, 105, 0.26)",
    label: "file order",
    size: 0.55,
  },
  same_symbol: {
    color: "rgba(96, 165, 250, 0.42)",
    label: "same symbol",
    size: 0.9,
  },
  same_parent: {
    color: "rgba(192, 132, 252, 0.4)",
    label: "same parent",
    size: 0.9,
  },
  imports: {
    color: "rgba(245, 158, 11, 0.78)",
    label: "imports",
    size: 1.2,
  },
  calls: {
    color: "rgba(34, 197, 94, 0.72)",
    label: "calls",
    size: 1.28,
  },
  referenced_type: {
    color: "rgba(14, 165, 233, 0.74)",
    label: "type ref",
    size: 1.18,
  },
  extends: {
    color: "rgba(239, 68, 68, 0.78)",
    label: "extends",
    size: 1.45,
  },
  implements: {
    color: "rgba(217, 70, 239, 0.72)",
    label: "implements",
    size: 1.35,
  },
  metadata_reference: {
    color: "rgba(251, 191, 36, 0.5)",
    label: "metadata reference",
    size: 0.95,
  },
};

const DEFAULT_FILTERS: VectorStorageFilters = {
  includePr: true,
};
const DEFAULT_GRAPH_LIMIT = 160;
const MAX_GRAPH_PAGE_SIZE = 5000;
const DENSE_GRAPH_THRESHOLD = 1500;
const HUGE_GRAPH_THRESHOLD = 12000;
const MAX_SYNC_LAYOUT_NODES = 1200;

type ResolvedGraphTheme = {
  isDark: boolean;
  labelColor: string;
  activeLabelColor: string;
  inactiveNodeColor: string;
  inactiveEdgeColor: string;
  defaultEdgeColor: string;
};

function getResolvedGraphTheme(): ResolvedGraphTheme {
  const root = typeof document === "undefined" ? null : document.documentElement;
  const isDark = !!root?.classList.contains("dark");
  return isDark
    ? {
        isDark: true,
        labelColor: "#e5e7eb",
        activeLabelColor: "#0f172a",
        inactiveNodeColor: "rgba(148, 163, 184, 0.5)",
        inactiveEdgeColor: "rgba(94, 121, 150, 0.24)",
        defaultEdgeColor: "rgba(148, 163, 184, 0.3)",
      }
    : {
        isDark: false,
        labelColor: "#0f172a",
        activeLabelColor: "#0f172a",
        inactiveNodeColor: "rgba(71, 85, 105, 0.46)",
        inactiveEdgeColor: "rgba(71, 85, 105, 0.2)",
        defaultEdgeColor: "rgba(71, 85, 105, 0.32)",
      };
}

function hashIndex(value: string, modulo: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % modulo;
}

function colorForNode(node: VectorStorageNode) {
  const style = NODE_KIND_STYLE[node.kind];
  if (style) return style.color;
  return NODE_PALETTE[hashIndex(node.group || node.language || node.id, NODE_PALETTE.length)];
}

function graphClusterKey(node: VectorStorageNode) {
  if (node.path) return `${node.branch || ""}:${node.path}`;
  if (node.kind === "symbol" || node.kind === "parent_class") {
    return `${node.kind}:${node.title}`;
  }
  return node.group || node.language || node.kind || "default";
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null) return "0";
  return new Intl.NumberFormat().format(value);
}

function shortPath(path?: string | null, maxParts = 3) {
  if (!path) return "Unknown file";
  const parts = path.split("/");
  if (parts.length <= maxParts + 1) return path;
  return `${parts[0]}/.../${parts.slice(-maxParts).join("/")}`;
}

function nodeSubtitle(node: VectorStorageNode) {
  if (node.virtual) return NODE_KIND_STYLE[node.kind]?.label || node.kind || "Context";
  const type = node.kind || node.language || "Vector point";
  const location =
    node.startLine && node.path
      ? `${shortPath(node.path, 2)}:${node.startLine}`
      : shortPath(node.path, 2);
  return location ? `${type} in ${location}` : type;
}

function metricValue(value: unknown) {
  if (Array.isArray(value)) return value.slice(0, 12).join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value, null, 2);
  return String(value);
}

function edgeLabel(kind?: string) {
  return EDGE_STYLE[kind || ""]?.label || kind || "related";
}

function compactNodeTitle(node?: VectorStorageNode) {
  if (!node) return "Unknown point";
  if (node.title) return node.title;
  if (node.path) return shortPath(node.path, 2);
  return node.id;
}

function mergeNodes(
  current: VectorStorageNode[],
  incoming: VectorStorageNode[],
) {
  const byId = new Map<string, VectorStorageNode>();
  current.forEach((node) => byId.set(node.id, node));
  incoming.forEach((node) =>
    byId.set(node.id, { ...(byId.get(node.id) || {}), ...node }),
  );
  return Array.from(byId.values());
}

function mergeEdges(
  current: VectorStorageEdge[],
  incoming: VectorStorageEdge[],
) {
  const byId = new Map<string, VectorStorageEdge>();
  current.forEach((edge) => byId.set(edge.id, edge));
  incoming.forEach((edge) => byId.set(edge.id, edge));
  return Array.from(byId.values());
}

function initialPosition(
  node: VectorStorageNode,
  index: number,
  total: number,
  cached?: { x: number; y: number },
) {
  if (cached && Number.isFinite(cached.x) && Number.isFinite(cached.y)) {
    return cached;
  }
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const clusterSeed = graphClusterKey(node);
  const clusterIndex = hashIndex(clusterSeed, 8192);
  const clusterAngle = clusterIndex * goldenAngle;
  const clusterRadius =
    18 + Math.sqrt(clusterIndex / 8192) * Math.max(92, Math.sqrt(total) * 14);
  const localIndex = hashIndex(`${node.id}:${index}`, 2048);
  const localAngle = localIndex * goldenAngle;
  const localRadius = node.kind === "file"
    ? 0
    : 5 + Math.sqrt(localIndex % 144) * (node.virtual ? 0.8 : 1.15);
  return {
    x: Math.cos(clusterAngle) * clusterRadius + Math.cos(localAngle) * localRadius,
    y: Math.sin(clusterAngle) * clusterRadius + Math.sin(localAngle) * localRadius,
  };
}

function sizeForNode(node: VectorStorageNode, degree: number) {
  const metricBoost = node.metricCount ? Math.log2(node.metricCount + 1) : 0;
  const degreeBoost = Math.sqrt(Math.max(degree, 0)) * 0.85;
  if (node.kind === "file") return Math.min(11.5, 5.1 + metricBoost * 0.5 + degreeBoost * 0.38);
  if (node.kind === "symbol" || node.kind === "parent_class") {
    return node.virtual
      ? Math.min(7.4, 3.1 + metricBoost * 0.24 + degreeBoost * 0.24)
      : Math.min(10, 4.6 + metricBoost * 0.42 + degreeBoost * 0.32);
  }
  if (node.virtual) return Math.min(7.5, 3.2 + metricBoost * 0.24 + degreeBoost * 0.26);
  return Math.min(8.5, 3.2 + degreeBoost * 0.5 + (node.primaryName ? 0.8 : 0));
}

function buildSigmaGraph(
  nodes: VectorStorageNode[],
  edges: VectorStorageEdge[],
  positions: Map<string, { x: number; y: number }>,
) {
  const graph = new Graph<SigmaNodeAttributes, SigmaEdgeAttributes>({
    type: "undirected",
    multi: true,
    allowSelfLoops: false,
  });
  const nodeIds = new Set(nodes.map((node) => node.id));
  const degreeById = new Map<string, number>();

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target) || edge.source === edge.target) {
      return;
    }
    degreeById.set(edge.source, (degreeById.get(edge.source) || 0) + 1);
    degreeById.set(edge.target, (degreeById.get(edge.target) || 0) + 1);
  });

  nodes.forEach((node, index) => {
    const position = initialPosition(node, index, nodes.length, positions.get(node.id));
    const degree = degreeById.get(node.id) || 0;
    graph.addNode(node.id, {
      label: node.title || "Vector point",
      x: position.x,
      y: position.y,
      size: sizeForNode(node, degree),
      color: colorForNode(node),
      kind: node.kind,
      raw: node,
      forceLabel: node.virtual && degree > 3,
      zIndex: node.virtual ? 3 : 1,
    });
  });

  edges.forEach((edge) => {
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target) || edge.source === edge.target) {
      return;
    }
    if (graph.hasEdge(edge.id)) return;
    const style = EDGE_STYLE[edge.kind] || {
      color: "rgba(148, 163, 184, 0.28)",
      label: edge.kind || "related",
      size: 0.9,
    };
    graph.addUndirectedEdgeWithKey(edge.id, edge.source, edge.target, {
      label: style.label,
      size: style.size,
      weight: Math.max(0.1, edge.weight || 1),
      color: style.color,
      kind: edge.kind,
      raw: edge,
    });
  });

  const iterations = graph.order > 420 ? 6 : graph.order > 260 ? 10 : 18;
  if (graph.order > 1 && graph.size > 0 && graph.order <= MAX_SYNC_LAYOUT_NODES) {
    try {
      forceAtlas2.assign(graph, {
        iterations,
        getEdgeWeight: "weight",
        settings: {
          ...forceAtlas2.inferSettings(graph.order),
          barnesHutOptimize: graph.order > 180,
          adjustSizes: true,
          edgeWeightInfluence: 0.65,
          gravity: 0.18,
          scalingRatio: graph.order > 280 ? 22 : 15,
          slowDown: 14,
        },
      });
    } catch {
      // Sigma requires valid finite coordinates; keep the seeded radial layout if FA2 fails.
    }
  }

  sanitizeGraphPositions(graph);

  return graph;
}

function sanitizeGraphPositions(graph: SigmaGraph) {
  const total = Math.max(graph.order, 1);
  let fallbackIndex = 0;

  graph.forEachNode((node, attributes) => {
    const hasValidPosition =
      Number.isFinite(attributes.x) && Number.isFinite(attributes.y);
    const hasValidSize = Number.isFinite(attributes.size) && attributes.size > 0;

    if (hasValidPosition && hasValidSize) return;

    const angle = (Math.PI * 2 * fallbackIndex) / total;
    const ring = 24 + (fallbackIndex % 9) * 3;
    fallbackIndex += 1;

    graph.mergeNodeAttributes(node, {
      x: hasValidPosition ? attributes.x : Math.cos(angle) * ring,
      y: hasValidPosition ? attributes.y : Math.sin(angle) * ring,
      size: hasValidSize ? attributes.size : 5,
    });
  });
}

export function VectorStorageExplorer({
  workspaceSlug,
  namespace,
  initialBranch,
  initialPrNumber,
}: VectorStorageExplorerProps) {
  const { theme } = useTheme();
  const graphSectionRef = useRef<HTMLElement | null>(null);
  const graphHostRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<Sigma<SigmaNodeAttributes, SigmaEdgeAttributes> | null>(null);
  const graphRef = useRef<SigmaGraph | null>(null);
  const layoutTimerRef = useRef<number | null>(null);
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const filtersRef = useRef<VectorStorageFilters>({
    ...DEFAULT_FILTERS,
    branches: initialBranch ? [initialBranch] : [],
    prNumber: initialPrNumber || null,
  });
  const cursorRef = useRef<string | null>(null);
  const limitRef = useRef(DEFAULT_GRAPH_LIMIT);

  const [overview, setOverview] = useState<VectorStorageOverview | null>(null);
  const [nodes, setNodes] = useState<VectorStorageNode[]>([]);
  const [edges, setEdges] = useState<VectorStorageEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<VectorStorageNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<VectorStorageFilters>(filtersRef.current);
  const [limit, setLimit] = useState(DEFAULT_GRAPH_LIMIT);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [loadingNode, setLoadingNode] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [layoutRunning, setLayoutRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [graphTheme, setGraphTheme] = useState<ResolvedGraphTheme>(() => getResolvedGraphTheme());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateTheme = () => setGraphTheme(getResolvedGraphTheme());
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [theme]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    limitRef.current = limit;
  }, [limit]);

  const selectedBranch = filters.branches?.[0] || "__all__";
  const selectedLanguage = filters.languages?.[0] || "__all__";
  const realNodeCount = useMemo(
    () => nodes.filter((node) => !node.virtual).length,
    [nodes],
  );
  const virtualNodeCount = nodes.length - realNodeCount;
  const denseGraph = nodes.length >= DENSE_GRAPH_THRESHOLD;
  const hugeGraph = nodes.length >= HUGE_GRAPH_THRESHOLD;

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await projectService.getVectorStorageOverview(
        workspaceSlug,
        namespace,
      );
      setOverview(data);
      if (!data.available) {
        setError(data.reason || "Vector storage is not available");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load vector storage overview");
    } finally {
      setLoadingOverview(false);
    }
  }, [workspaceSlug, namespace]);

  const loadGraph = useCallback(
    async (
      append = false,
      overrideFilters?: VectorStorageFilters,
      overrideCursor?: string | null,
    ) => {
      const activeFilters = overrideFilters || filtersRef.current;
      const activeCursor = append ? overrideCursor || cursorRef.current : null;
      setLoadingGraph(true);
      setError(null);
      try {
        const response = await projectService.getVectorStorageGraph(
          workspaceSlug,
          namespace,
          {
            filters: activeFilters,
            limit: limitRef.current,
            cursor: activeCursor,
            scanLimit:
              activeFilters.path ||
              activeFilters.fileQuery ||
              activeFilters.semanticQuery ||
              activeFilters.prNumber
                ? Math.max(12000, limitRef.current * 8)
                : Math.max(8000, limitRef.current * 3),
          },
        );

        if (!response.available) {
          setNodes([]);
          setEdges([]);
          setSelectedNode(null);
          setCursor(null);
          setError(response.reason || "Vector storage is not available");
          return;
        }

        setNodes((prev) =>
          append ? mergeNodes(prev, response.nodes || []) : response.nodes || [],
        );
        setEdges((prev) =>
          append ? mergeEdges(prev, response.edges || []) : response.edges || [],
        );
        setCursor(response.nextCursor || null);
        if (!append) setSelectedNode(null);
      } catch (err: any) {
        setError(err.message || "Failed to load vector graph");
      } finally {
        setLoadingGraph(false);
      }
    },
    [namespace, workspaceSlug],
  );

  const loadPoint = useCallback(
    async (node: VectorStorageNode, mergeNeighborhood = false) => {
      if (node.virtual) return;
      setLoadingNode(true);
      try {
        const response = await projectService.getVectorStoragePoint(
          workspaceSlug,
          namespace,
          node.id,
          { filters: filtersRef.current, neighborLimit: 120 },
        );
        if (response.node) {
          setSelectedNode(response.node);
          if (mergeNeighborhood) {
            const incomingNodes = [
              response.node,
              ...(response.neighbors || []),
            ];
            setNodes((prev) => mergeNodes(prev, incomingNodes));
            setEdges((prev) => mergeEdges(prev, response.edges || []));
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load vector point");
      } finally {
        setLoadingNode(false);
      }
    },
    [namespace, workspaceSlug],
  );

  const applyFilters = useCallback(
    (nextFilters = filtersRef.current) => {
      setFilters(nextFilters);
      setCursor(null);
      void loadGraph(false, nextFilters, null);
    },
    [loadGraph],
  );

  const resetFilters = useCallback(() => {
    const next: VectorStorageFilters = {
      ...DEFAULT_FILTERS,
      branches: initialBranch ? [initialBranch] : [],
      prNumber: initialPrNumber || null,
    };
    applyFilters(next);
  }, [applyFilters, initialBranch, initialPrNumber]);

  const loadAllAvailable = useCallback(async () => {
    if (!cursorRef.current || loadingGraph || loadingAll) return;
    setLoadingAll(true);
    setError(null);
    try {
      let nextCursor = cursorRef.current;
      let safetyCounter = 0;
      while (nextCursor && safetyCounter < 80) {
        safetyCounter += 1;
        const response = await projectService.getVectorStorageGraph(
          workspaceSlug,
          namespace,
          {
            filters: filtersRef.current,
            limit: MAX_GRAPH_PAGE_SIZE,
            cursor: nextCursor,
            scanLimit: MAX_GRAPH_PAGE_SIZE * 3,
          },
        );
        if (!response.available) {
          setError(response.reason || "Vector storage is not available");
          break;
        }
        setNodes((prev) => mergeNodes(prev, response.nodes || []));
        setEdges((prev) => mergeEdges(prev, response.edges || []));
        nextCursor = response.nextCursor || null;
        setCursor(nextCursor);
        cursorRef.current = nextCursor;
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }
      if (safetyCounter >= 80 && nextCursor) {
        setError("Stopped after 80 graph pages. Use Load More to continue.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load remaining vector graph pages");
    } finally {
      setLoadingAll(false);
    }
  }, [loadingAll, loadingGraph, namespace, workspaceSlug]);

  const toggleFullscreen = useCallback(async () => {
    const element = graphSectionRef.current;
    if (!element) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } else if (element.requestFullscreen) {
        await element.requestFullscreen();
        setIsFullscreen(true);
      } else {
        setIsFullscreen((value) => !value);
      }
    } catch {
      setIsFullscreen((value) => !value);
    }
    window.setTimeout(() => {
      sigmaRef.current?.resize();
      sigmaRef.current?.getCamera().animatedReset({ duration: 240 });
    }, 120);
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(document.fullscreenElement === graphSectionRef.current);
      window.setTimeout(() => sigmaRef.current?.resize(), 80);
    };
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const storePositions = useCallback((graph: SigmaGraph | null) => {
    if (!graph) return;
    graph.forEachNode((node, attributes) => {
      if (!Number.isFinite(attributes.x) || !Number.isFinite(attributes.y)) {
        return;
      }
      positionsRef.current.set(node, { x: attributes.x, y: attributes.y });
    });
  }, []);

  const stopLayout = useCallback(() => {
    if (layoutTimerRef.current) {
      window.clearTimeout(layoutTimerRef.current);
      layoutTimerRef.current = null;
    }
    const graph = graphRef.current;
    if (graph) sanitizeGraphPositions(graph);
    storePositions(graph);
    sigmaRef.current?.refresh();
    sigmaRef.current?.getCamera().animatedReset({ duration: 260 });
    setLayoutRunning(false);
  }, [storePositions]);

  const runLayout = useCallback((duration = 2200) => {
    const graph = graphRef.current;
    const renderer = sigmaRef.current;
    if (!graph || !renderer || graph.order < 2 || graph.size === 0) return;
    if (graph.order > MAX_SYNC_LAYOUT_NODES) {
      sanitizeGraphPositions(graph);
      storePositions(graph);
      renderer.refresh();
      renderer.getCamera().animatedReset({ duration: 220 });
      setLayoutRunning(false);
      return;
    }
    if (layoutTimerRef.current) window.clearTimeout(layoutTimerRef.current);
    setLayoutRunning(true);
    layoutTimerRef.current = window.setTimeout(() => {
      layoutTimerRef.current = null;
      try {
        forceAtlas2.assign(graph, {
          iterations: graph.order > 420 ? 10 : graph.order > 260 ? 14 : 20,
          getEdgeWeight: "weight",
          settings: {
            ...forceAtlas2.inferSettings(graph.order),
            adjustSizes: true,
            barnesHutOptimize: graph.order > 180,
            edgeWeightInfluence: 0.65,
            gravity: 0.18,
            scalingRatio: graph.order > 300 ? 22 : 15,
            slowDown: 14,
          },
        });
      } catch {
        // Keep the current valid positions when FA2 cannot settle this graph.
      }
      sanitizeGraphPositions(graph);
      storePositions(graph);
      renderer.refresh();
      renderer.getCamera().animatedReset({ duration: 260 });
      setLayoutRunning(false);
    }, Math.min(duration, 160));
  }, [storePositions]);

  const focusNode = useCallback((nodeId?: string | null) => {
    const graph = graphRef.current;
    const renderer = sigmaRef.current;
    if (!nodeId || !graph || !renderer || !graph.hasNode(nodeId)) return;
    sanitizeGraphPositions(graph);
    const attributes = graph.getNodeAttributes(nodeId);
    if (!Number.isFinite(attributes.x) || !Number.isFinite(attributes.y)) return;
    renderer.getCamera().animate(
      { x: attributes.x, y: attributes.y, ratio: 0.42 },
      { duration: 320 },
    );
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    const nextFilters: VectorStorageFilters = {
      ...DEFAULT_FILTERS,
      branches: initialBranch ? [initialBranch] : [],
      prNumber: initialPrNumber || null,
    };
    setFilters(nextFilters);
    setCursor(null);
    void loadGraph(false, nextFilters, null);
  }, [initialBranch, initialPrNumber, loadGraph]);

  useEffect(() => {
    const container = graphHostRef.current;
    if (!container) return;

    stopLayout();
    sigmaRef.current?.kill();
    sigmaRef.current = null;

    const graph = buildSigmaGraph(nodes, edges, positionsRef.current);
    graphRef.current = graph;

    if (graph.order === 0) return;

    let draggedNode: string | null = null;
    let dragMoved = false;
    const renderer = new Sigma<SigmaNodeAttributes, SigmaEdgeAttributes>(
      graph,
      container,
      {
        allowInvalidContainer: true,
        autoCenter: true,
        autoRescale: true,
        defaultEdgeType: "line",
        defaultNodeColor: "#6ee7b7",
        defaultEdgeColor: graphTheme.defaultEdgeColor,
        enableEdgeEvents: false,
        hideEdgesOnMove: graph.order > 700,
        hideLabelsOnMove: true,
        itemSizesReference: "screen",
        labelColor: { attribute: "labelColor", color: graphTheme.labelColor },
        labelDensity: hugeGraph ? 0 : denseGraph ? 0.015 : 0.07,
        labelFont: "Inter, ui-sans-serif, system-ui",
        labelRenderedSizeThreshold: hugeGraph ? 999 : denseGraph ? 18 : graph.order > 280 ? 14 : 10,
        labelSize: denseGraph ? 10 : 12,
        minCameraRatio: 0.02,
        maxCameraRatio: 8,
        minEdgeThickness: denseGraph ? 0.2 : 0.4,
        renderEdgeLabels: false,
        renderLabels: !hugeGraph,
        stagePadding: 44,
        zIndex: true,
      },
    );
    sigmaRef.current = renderer;

    renderer.on("enterNode", ({ node }) => setHoveredNodeId(node));
    renderer.on("leaveNode", () => setHoveredNodeId(null));
    renderer.on("clickNode", ({ node, event }) => {
      event.preventSigmaDefault();
      if (dragMoved) {
        dragMoved = false;
        return;
      }
      const raw = graph.getNodeAttribute(node, "raw");
      setSelectedNode(raw);
      if (!raw.virtual) void loadPoint(raw, false);
    });
    renderer.on("clickStage", () => {
      setSelectedNode(null);
      setHoveredNodeId(null);
    });
    renderer.on("downNode", ({ node, event }) => {
      draggedNode = node;
      dragMoved = false;
      graph.setNodeAttribute(node, "highlighted", true);
      renderer.getCamera().disable();
      event.preventSigmaDefault();
    });

    const mouse = renderer.getMouseCaptor();
    mouse.on("mousemovebody", (event) => {
      if (!draggedNode) return;
      const position = renderer.viewportToGraph(event);
      graph.setNodeAttribute(draggedNode, "x", position.x);
      graph.setNodeAttribute(draggedNode, "y", position.y);
      positionsRef.current.set(draggedNode, position);
      dragMoved = true;
      event.preventSigmaDefault();
      renderer.refresh({ partialGraph: { nodes: [draggedNode] }, skipIndexation: true });
    });
    mouse.on("mouseup", () => {
      if (!draggedNode) return;
      graph.setNodeAttribute(draggedNode, "highlighted", false);
      draggedNode = null;
      renderer.getCamera().enable();
    });
    mouse.on("mouseleave", () => {
      if (!draggedNode) return;
      graph.setNodeAttribute(draggedNode, "highlighted", false);
      draggedNode = null;
      renderer.getCamera().enable();
    });

    runLayout(graph.order > 420 ? 2400 : 1900);

    return () => {
      sanitizeGraphPositions(graph);
      storePositions(graph);
      if (layoutTimerRef.current) {
        window.clearTimeout(layoutTimerRef.current);
        layoutTimerRef.current = null;
      }
      renderer.kill();
      if (sigmaRef.current === renderer) sigmaRef.current = null;
    };
  }, [denseGraph, edges, focusNode, graphTheme.defaultEdgeColor, graphTheme.labelColor, hugeGraph, loadPoint, nodes, runLayout, stopLayout, storePositions]);

  useEffect(() => {
    const renderer = sigmaRef.current;
    const graph = graphRef.current;
    if (!renderer || !graph) return;

    const activeNode = selectedNode?.id || hoveredNodeId;
    const neighbors = new Set<string>();
    if (activeNode && graph.hasNode(activeNode)) {
      graph.forEachNeighbor(activeNode, (neighbor) => neighbors.add(neighbor));
    }

    renderer.setSettings({
      nodeReducer: (node, data) => {
        const active = !!activeNode;
        const isActive = node === activeNode;
        const isNeighbor = neighbors.has(node);
        const graphAttributes = graph.getNodeAttributes(node);
        const baseSize =
          Number.isFinite(data.size) && data.size > 0 ? data.size : graphAttributes.size || 5;
        const reduced: SigmaNodeAttributes = {
          ...data,
          x: Number.isFinite(data.x) ? data.x : graphAttributes.x,
          y: Number.isFinite(data.y) ? data.y : graphAttributes.y,
          size: hugeGraph ? Math.min(baseSize, graphAttributes.raw.virtual ? 4.2 : 2.8) : baseSize,
          labelColor: graphTheme.labelColor,
        };

        if (!Number.isFinite(reduced.x) || !Number.isFinite(reduced.y)) {
          const fallback = initialPosition(graphAttributes.raw, 0, graph.order);
          reduced.x = fallback.x;
          reduced.y = fallback.y;
        }

        if (active && !isActive && !isNeighbor) {
          reduced.color = graphTheme.inactiveNodeColor;
          reduced.size = Math.max(2.2, reduced.size * 0.82);
          reduced.label = "";
          reduced.zIndex = 0;
        } else if (denseGraph && !isActive && !isNeighbor) {
          reduced.label = "";
          reduced.forceLabel = false;
        }

        if (isNeighbor) {
          reduced.size = Math.max(reduced.size * 1.35, 4);
          reduced.zIndex = 4;
          reduced.forceLabel = graphAttributes.raw.virtual || baseSize > 8;
        }

        if (isActive) {
          reduced.color = "#ff7a00";
          reduced.labelColor = graphTheme.activeLabelColor;
          reduced.size = Math.max(reduced.size * 1.8, 7);
          reduced.forceLabel = true;
          reduced.highlighted = true;
          reduced.zIndex = 8;
        }

        return reduced;
      },
      edgeReducer: (edge, data) => {
        const reduced: SigmaEdgeAttributes = { ...data };
        if (!activeNode) {
          if (hugeGraph) {
            reduced.hidden = true;
          } else if (denseGraph && data.kind === "file_sequence") {
            reduced.hidden = true;
          }
          return reduced;
        }
        const [source, target] = graph.extremities(edge);
        const touchesActive = source === activeNode || target === activeNode;
        const inNeighborhood =
          touchesActive ||
          (neighbors.has(source) && neighbors.has(target));

        if (!inNeighborhood) {
          if (denseGraph) {
            reduced.hidden = true;
            return reduced;
          }
          reduced.color = graphTheme.inactiveEdgeColor;
          reduced.size = 0.45;
          return reduced;
        }

        reduced.color = data.color;
        reduced.size = data.size * (touchesActive ? 1.7 : 1.1);
        return reduced;
      },
    });
    renderer.refresh();
  }, [denseGraph, edges.length, graphTheme.activeLabelColor, graphTheme.inactiveEdgeColor, graphTheme.inactiveNodeColor, graphTheme.labelColor, hoveredNodeId, hugeGraph, nodes.length, selectedNode?.id]);

  const metricItems = [
    {
      label: "Indexed points",
      value: formatNumber(overview?.totalPoints),
      icon: Database,
    },
    {
      label: "Graph nodes",
      value: formatNumber(nodes.length),
      icon: Network,
    },
    {
      label: "Relations",
      value: formatNumber(edges.length),
      icon: Split,
    },
    {
      label: "Files",
      value: formatNumber(overview?.files?.length),
      icon: FileCode,
    },
  ];

  const selectedMetadata = selectedNode?.metadata
    ? Object.entries(selectedNode.metadata).filter(([, value]) => value !== null && value !== "")
    : [];

  const activeFilterCount = [
    filters.branches?.length,
    filters.languages?.length,
    filters.path ? 1 : 0,
    filters.fileQuery ? 1 : 0,
    filters.semanticQuery ? 1 : 0,
    filters.prNumber ? 1 : 0,
    filters.includePr === false ? 1 : 0,
  ].reduce((sum, value) => sum + (value || 0), 0);

  const filterToNode = useCallback(() => {
    if (!selectedNode) return;
    if (selectedNode.kind === "file" && selectedNode.path) {
      applyFilters({
        ...filtersRef.current,
        path: selectedNode.path,
        fileQuery: "",
      });
      return;
    }
    if ((selectedNode.kind === "symbol" || selectedNode.kind === "parent_class") && selectedNode.title) {
      applyFilters({
        ...filtersRef.current,
        semanticQuery: selectedNode.title,
      });
    }
  }, [applyFilters, selectedNode]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card/70 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Vector Storage</h2>
              {overview?.sampled && (
                <Badge variant="outline" className="text-[11px]">
                  sampled
                </Badge>
              )}
              {layoutRunning && (
                <Badge variant="secondary" className="gap-1 text-[11px]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  settling
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{overview?.collection || "Project vector collection"}</span>
              {activeFilterCount > 0 && (
                <Badge variant="outline" className="text-[11px]">
                  {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:min-w-[640px]">
            {metricItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="min-w-[128px] rounded-md border bg-background/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                  <div className="mt-1 text-xl font-semibold">{item.value}</div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setError(null)}
              className="text-destructive hover:bg-destructive/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="relative">
        {filtersOpen && (
          <div className={cn("absolute inset-0 z-50", isFullscreen && "fixed z-[60]")}>
            <button
              type="button"
              aria-label="Close vector filters"
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={() => setFiltersOpen(false)}
            />
            <aside className="absolute bottom-4 left-4 top-4 flex w-[min(380px,calc(100vw-2rem))] min-w-0 flex-col overflow-y-auto rounded-lg border bg-card p-4 text-card-foreground shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <Filter className="h-4 w-4 text-primary" />
              Filters
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={resetFilters}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset filters</TooltipContent>
              </Tooltip>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close vector filters"
                onClick={() => setFiltersOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select
                value={selectedBranch}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    branches: value === "__all__" ? [] : [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All branches</SelectItem>
                  {(overview?.branches || []).map((branch) => (
                    <SelectItem key={String(branch.value)} value={String(branch.value)}>
                      {branch.value} ({branch.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={selectedLanguage}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    languages: value === "__all__" ? [] : [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All languages</SelectItem>
                  {(overview?.languages || []).map((language) => (
                    <SelectItem key={String(language.value)} value={String(language.value)}>
                      {language.value} ({language.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vector-file-filter">File contains</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="vector-file-filter"
                  value={filters.fileQuery || ""}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      fileQuery: event.target.value,
                      path: undefined,
                    }))
                  }
                  className="pl-9"
                  placeholder="src/service"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vector-symbol-filter">Symbol or metadata</Label>
              <Input
                id="vector-symbol-filter"
                value={filters.semanticQuery || ""}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    semanticQuery: event.target.value,
                  }))
                }
                placeholder="Class, function, import"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vector-pr-filter">Pull request</Label>
              <div className="relative">
                <GitPullRequest className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="vector-pr-filter"
                  type="number"
                  min={1}
                  value={filters.prNumber || ""}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      prNumber: event.target.value
                        ? Number(event.target.value)
                        : null,
                    }))
                  }
                  className="pl-9"
                  placeholder="Any PR"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 rounded-md border bg-background/50 px-3 py-2 text-sm">
              <Checkbox
                checked={filters.includePr !== false}
                onCheckedChange={(checked) =>
                  setFilters((prev) => ({ ...prev, includePr: checked === true }))
                }
              />
              Include PR-indexed chunks
            </label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Page size</Label>
                <span className="text-xs text-muted-foreground">{limit}</span>
              </div>
              <Slider
                value={[limit]}
                min={80}
                max={MAX_GRAPH_PAGE_SIZE}
                step={limit < 1000 ? 20 : 100}
                onValueChange={(value) => setLimit(value[0])}
              />
              <div className="grid grid-cols-4 gap-1.5">
                {[160, 500, 2000, MAX_GRAPH_PAGE_SIZE].map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant={limit === size ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setLimit(size)}
                  >
                    {size >= 1000 ? `${size / 1000}k` : size}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                applyFilters();
                setFiltersOpen(false);
              }}
              disabled={loadingGraph}
            >
              {loadingGraph ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Filter className="h-4 w-4" />
              )}
              Apply Filters
            </Button>

            <div className="border-t pt-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <FileCode className="h-4 w-4 text-muted-foreground" />
                Top Files
              </div>
              <ScrollArea className="h-44 pr-2">
                <div className="space-y-1">
                  {loadingOverview ? (
                    <div className="text-sm text-muted-foreground">Loading files...</div>
                  ) : (
                    (overview?.files || []).slice(0, 26).map((file) => {
                      const value = String(file.value);
                      return (
                        <button
                          key={value}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted",
                            filters.path === value && "bg-primary/10 text-primary",
                          )}
                          onClick={() =>
                            applyFilters({
                              ...filtersRef.current,
                              path: value,
                              fileQuery: "",
                            })
                          }
                        >
                          <span className="truncate">{shortPath(value)}</span>
                          <span className="ml-2 text-muted-foreground">{file.count}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="border-t pt-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                Top Symbols
              </div>
              <ScrollArea className="h-36 pr-2">
                <div className="flex flex-wrap gap-1.5">
                  {(overview?.semanticNames || []).slice(0, 34).map((symbol) => {
                    const value = String(symbol.value);
                    return (
                      <button
                        key={value}
                        className={cn(
                          "rounded-full border px-2 py-1 text-xs hover:bg-muted",
                          filters.semanticQuery === value && "border-primary text-primary",
                        )}
                        onClick={() =>
                          applyFilters({
                            ...filtersRef.current,
                            semanticQuery: value,
                          })
                        }
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
            </aside>
          </div>
        )}

        <section
          ref={graphSectionRef}
          data-vector-storage-graph="true"
          className={cn(
            "relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm dark:border-white/10 dark:bg-[#080b10]",
            isFullscreen && "fixed inset-0 z-50 rounded-none border-0",
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.1)_1px,transparent_1px)] [background-size:28px_28px] dark:bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.12)_1px,transparent_1px)]" />
          <div className="absolute inset-0 bg-white/70 dark:bg-[rgba(8,11,16,0.78)]" />

          <div className={cn("relative z-10 flex min-h-[720px] flex-col", isFullscreen && "h-screen min-h-screen")}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/92 px-4 py-3 text-slate-900 dark:border-white/10 dark:bg-[rgba(13,17,24,0.92)] dark:text-slate-100">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <MousePointer2 className="h-4 w-4 text-primary" />
                <span>{formatNumber(realNodeCount)} points</span>
                <span className="text-slate-400 dark:text-slate-500">/</span>
                <span>{formatNumber(virtualNodeCount)} context nodes</span>
                <span className="text-slate-400 dark:text-slate-500">/</span>
                <span>{formatNumber(edges.length)} relations</span>
                {cursor && (
                  <Badge variant="outline" className="border-slate-300 text-slate-700 dark:border-white/20 dark:text-slate-200">
                    more available
                  </Badge>
                )}
                {denseGraph && (
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-700 dark:border-cyan-400/30 dark:text-cyan-100">
                    dense mode
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltersOpen(true)}
                  className="border-slate-300 bg-white/75 text-slate-900 hover:bg-white dark:border-white/20 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="ml-1 h-5 px-1.5 text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Zoom in"
                      onClick={() => sigmaRef.current?.getCamera().animatedZoom({ duration: 220 })}
                      className="text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom in</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Zoom out"
                      onClick={() => sigmaRef.current?.getCamera().animatedUnzoom({ duration: 220 })}
                      className="text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom out</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Reset graph camera"
                      onClick={() => sigmaRef.current?.getCamera().animatedReset({ duration: 300 })}
                      className="text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset camera</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={isFullscreen ? "Exit fullscreen graph" : "Fullscreen graph"}
                      onClick={toggleFullscreen}
                      className="text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Settle graph layout"
                      onClick={() => runLayout(1800)}
                      disabled={layoutRunning || nodes.length === 0}
                      className="text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
                    >
                      <RefreshCw className={cn("h-4 w-4", layoutRunning && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Settle layout</TooltipContent>
                </Tooltip>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadGraph(false)}
                  disabled={loadingGraph}
                  className="text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
                >
                  <RefreshCw className={cn("h-4 w-4", loadingGraph && "animate-spin")} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!cursor || loadingGraph || loadingAll}
                  onClick={() => loadGraph(true, filters, cursor)}
                  className="border-slate-300 bg-white/75 text-slate-900 hover:bg-white dark:border-white/20 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                >
                  <Layers className="h-4 w-4" />
                  Load More
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!cursor || loadingGraph || loadingAll}
                  onClick={loadAllAvailable}
                  className="border-slate-300 bg-white/75 text-slate-900 hover:bg-white dark:border-white/20 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                >
                  {loadingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Layers className="h-4 w-4" />
                  )}
                  Load All
                </Button>
              </div>
            </div>

            <div className="relative flex-1">
              <div ref={graphHostRef} className="absolute inset-0" />

              {(loadingGraph || loadingAll) && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 text-slate-700 dark:bg-[rgba(8,11,16,0.60)] dark:text-slate-200">
                  <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-white/10 dark:bg-[#111827]">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    {loadingAll ? "Loading graph pages" : "Loading graph"}
                  </div>
                </div>
              )}

              {!loadingGraph && nodes.length === 0 && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-6 text-center text-slate-700 dark:text-slate-300">
                  <div className="max-w-sm rounded-md border border-slate-200 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-[#111827]">
                    <Database className="mx-auto mb-3 h-8 w-8 text-slate-400 dark:text-slate-500" />
                    <div className="font-medium">No vector points found</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                      No matching indexed chunks for the current selection.
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 z-20 flex max-w-[calc(100%-2rem)] flex-wrap gap-2 rounded-md border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[rgba(13,17,24,0.88)] dark:text-slate-300">
                {NODE_LEGEND_ITEMS.map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>
                ))}
                <span className="hidden h-4 w-px bg-slate-200 dark:bg-white/15 sm:inline-block" />
                {Object.entries(EDGE_STYLE).map(([kind, style]) => (
                  <span key={kind} className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-5 rounded-full"
                      style={{ backgroundColor: style.color }}
                    />
                    {style.label}
                  </span>
                ))}
              </div>

              {selectedNode && (
                <aside className="absolute bottom-4 right-4 top-4 z-30 flex w-[min(480px,calc(100%-2rem))] min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/95 text-slate-900 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[rgba(17,24,39,0.94)] dark:text-slate-100">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Split className="h-4 w-4 text-primary" />
                        <div className="text-sm font-medium">Point Inspector</div>
                      </div>
                      <h3 className="mt-3 truncate text-base font-semibold">
                        {selectedNode.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {nodeSubtitle(selectedNode)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setSelectedNode(null)}
                      className="shrink-0 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <ScrollArea className="min-h-0 flex-1">
                    <div className="space-y-4 p-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{selectedNode.kind}</Badge>
                        {selectedNode.virtual && (
                          <Badge variant="outline" className="border-slate-300 text-slate-700 dark:border-white/20 dark:text-slate-200">
                            context
                          </Badge>
                        )}
                        {selectedNode.prNumber && (
                          <Badge className="shrink-0">PR #{selectedNode.prNumber}</Badge>
                        )}
                        {selectedNode.metricCount !== undefined && (
                          <Badge variant="outline" className="border-slate-300 text-slate-700 dark:border-white/20 dark:text-slate-200">
                            {formatNumber(selectedNode.metricCount)} points
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="text-slate-500 dark:text-slate-400">Branch</div>
                          <div className="mt-1 truncate font-medium">
                            {selectedNode.branch || "-"}
                          </div>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="text-slate-500 dark:text-slate-400">Language</div>
                          <div className="mt-1 truncate font-medium">
                            {selectedNode.language || selectedNode.filetype || "-"}
                          </div>
                        </div>
                        <div className="col-span-2 rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="text-slate-500 dark:text-slate-400">File</div>
                          <div className="mt-1 break-all font-medium">
                            {selectedNode.path || "-"}
                          </div>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="text-slate-500 dark:text-slate-400">Lines</div>
                          <div className="mt-1 font-medium">
                            {selectedNode.startLine || "-"}
                            {selectedNode.endLine ? `-${selectedNode.endLine}` : ""}
                          </div>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="text-slate-500 dark:text-slate-400">Chunk</div>
                          <div className="mt-1 font-medium">
                            {selectedNode.chunkIndex ?? selectedNode.subChunkIndex ?? "-"}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/10"
                          onClick={() => focusNode(selectedNode.id)}
                        >
                          <MousePointer2 className="h-4 w-4" />
                          Focus
                        </Button>
                        {(selectedNode.kind === "file" ||
                          selectedNode.kind === "symbol" ||
                          selectedNode.kind === "parent_class") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/10"
                            onClick={filterToNode}
                          >
                            <Filter className="h-4 w-4" />
                            Filter
                          </Button>
                        )}
                        {!selectedNode.virtual && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/10"
                            onClick={() => loadPoint(selectedNode, true)}
                            disabled={loadingNode}
                          >
                            {loadingNode ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Network className="h-4 w-4" />
                            )}
                            Expand
                          </Button>
                        )}
                      </div>

                      {selectedNode.signature && (
                        <div>
                          <div className="mb-2 text-sm font-medium">Signature</div>
                          <pre className="max-h-40 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-800 [overflow-wrap:anywhere] dark:border-white/10 dark:bg-black/30 dark:text-slate-200">
                            {selectedNode.signature}
                          </pre>
                        </div>
                      )}

                      {(selectedNode.semanticNames || []).length > 0 && (
                        <div>
                          <div className="mb-2 text-sm font-medium">Symbols</div>
                          <div className="flex flex-wrap gap-1.5">
                            {(selectedNode.semanticNames || []).slice(0, 24).map((name) => (
                              <Badge
                                key={name}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() =>
                                  applyFilters({
                                    ...filtersRef.current,
                                    semanticQuery: name,
                                  })
                                }
                              >
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="mb-2 text-sm font-medium">Content Preview</div>
                        <pre className="max-h-72 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-800 [overflow-wrap:anywhere] dark:border-white/10 dark:bg-black/30 dark:text-slate-200">
                          {selectedNode.text || selectedNode.preview || "No preview available"}
                        </pre>
                      </div>

                      {selectedMetadata.length > 0 && (
                        <div>
                          <div className="mb-2 text-sm font-medium">Metadata</div>
                          <div className="space-y-1.5">
                            {selectedMetadata.slice(0, 42).map(([key, value]) => (
                              <div
                                key={key}
                                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-white/[0.04]"
                              >
                                <div className="font-medium text-slate-500 dark:text-slate-400">{key}</div>
                                <div className="mt-1 whitespace-pre-wrap break-words text-slate-800 [overflow-wrap:anywhere] dark:text-slate-200">
                                  {metricValue(value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </aside>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
