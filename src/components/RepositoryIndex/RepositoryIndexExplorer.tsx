import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Graph from "graphology";
import { buildFileMap, edgeCurvatures, directedLayout, pointFilters, relationFacet, traceDistances } from "./repositoryGraph";
import Sigma from "sigma";
import { EdgeCurvedArrowProgram } from "@sigma/edge-curve";
import {
  EdgeArrowProgram,
  type NodeHoverDrawingFunction,
} from "sigma/rendering";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Code2,
  Database,
  FileCode,
  Filter,
  GitBranch,
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
  Waypoints,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  RepositoryIndexEdge,
  RepositoryIndexFilters,
  RepositoryIndexNode,
  RepositoryIndexOverview,
} from "@/api_service/project/projectService";

interface RepositoryIndexExplorerProps {
  workspaceSlug: string;
  namespace: string;
  initialBranch?: string | null;
}

type SigmaNodeAttributes = {
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  kind: string;
  raw: RepositoryIndexNode;
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
  raw: RepositoryIndexEdge;
  hidden?: boolean;
  type?: string;
  curvature?: number;
};

type GraphViewMode = "files" | "symbols";

type GraphCoverage = {
  projection?: "files" | "symbols";
  eligibleRelations?: number;
  returnedRelations?: number;
  relationsTruncated?: boolean;
};

type SigmaGraph = Graph<SigmaNodeAttributes, SigmaEdgeAttributes>;

type MetadataRecord = Record<string, unknown>;

// Colors identify a small set of structural roles, consistently across files.
const NODE_KIND_STYLE: Record<string, { color: string; label: string }> = Object.fromEntries([
  ["file", "module", "namespace"].map(kind => [kind, { color: "#3b82f6", label: "Files / modules" }]),
  ["class", "interface", "record", "struct", "trait", "enum", "type"].map(kind => [kind, { color: "#a855f7", label: "Types" }]),
  ["method", "function", "constructor"].map(kind => [kind, { color: "#10b981", label: "Callables" }]),
  ["property", "field", "variable", "constant", "entity"].map(kind => [kind, { color: "#94a3b8", label: "Other symbols" }]),
].flat());

const EDGE_COLOR: Record<string, string> = {
  dependency: "#3b82f6", contains: "#94a3b8", imports: "#38bdf8", calls: "#10b981",
  references: "#38bdf8", extends: "#a855f7", implements: "#a855f7",
};

const DEFAULT_FILTERS: RepositoryIndexFilters = {};
const DEFAULT_GRAPH_LIMIT = 160;
const MAX_GRAPH_PAGE_SIZE = 5000;
const OVERVIEW_GRAPH_THRESHOLD = 320;
const DENSE_GRAPH_THRESHOLD = 500;
const HUGE_GRAPH_THRESHOLD = 12000;
const RELATION_BROWSER_PAGE_SIZE = 100;
const LAYOUT_ERROR = "Layout could not finish. The graph is still available; use Rebuild relationship layout to retry.";

function relationFamily(edge: RepositoryIndexEdge) {
  const value = `${edge.kind || ""} ${edge.label || ""}`.toLocaleLowerCase();
  if (value.includes("contain") || value.includes("parent") || value.includes("child")) {
    return "contains";
  }
  if (value.includes("call") || value.includes("dispatch") || value.includes("handler")) {
    return "calls";
  }
  if (value.includes("import") || value.includes("require") || value.includes("depend")) {
    return "imports";
  }
  if (value.includes("extend") || value.includes("inherit") || value.includes("override")) {
    return "extends";
  }
  if (value.includes("implement") || value.includes("contract")) {
    return "implements";
  }
  if (value.includes("reference") || value.includes("type") || value.includes("use")) {
    return "references";
  }
  return "related";
}

const POINT_DETAIL_METADATA_KEYS = new Set([
  "workspace",
  "project",
  "branch",
  "path",
  "commit",
  "language",
  "filetype",
  "start_line",
  "end_line",
  "chunk_index",
  "symbol_names",
  "primary_name",
  "parent_class",
  "full_path",
  "namespace",
  "signature",
  "indexed_at",
]);

const PROVENANCE_METADATA_KEYS = new Set([
  "plugin_ids",
  "plugin_fingerprint",
  "plugin_descriptor_fingerprint",
  "plugin_implementation_fingerprint",
  "index_representation_fingerprint",
]);

type ResolvedGraphTheme = {
  isDark: boolean;
  labelColor: string;
  activeLabelColor: string;
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
        inactiveEdgeColor: "#596b82",
        defaultEdgeColor: "rgba(148, 163, 184, 0.3)",
      }
    : {
        isDark: false,
        labelColor: "#0f172a",
        activeLabelColor: "#0f172a",
        inactiveEdgeColor: "#9aa9bb",
        defaultEdgeColor: "rgba(71, 85, 105, 0.32)",
      };
}

const drawRepositoryIndexNodeHover: NodeHoverDrawingFunction<SigmaNodeAttributes, SigmaEdgeAttributes> = (
  context,
  data,
  settings,
) => {
  const label = typeof data.label === "string" ? data.label : "";
  const size = settings.labelSize;
  const font = settings.labelFont;
  const weight = settings.labelWeight;
  const padding = 3;

  context.save();
  context.font = `${weight} ${size}px ${font}`;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 8;
  context.shadowColor = "rgba(15, 23, 42, 0.28)";
  context.fillStyle = "#ffffff";

  if (label) {
    const textWidth = context.measureText(label).width;
    const boxWidth = Math.round(textWidth + 8);
    const boxHeight = Math.round(size + padding * 2);
    const radius = Math.max(data.size, size / 2) + padding;
    const angle = Math.asin(Math.min(0.98, boxHeight / 2 / radius));
    const xDelta = Math.sqrt(Math.max(0, radius ** 2 - (boxHeight / 2) ** 2));

    context.beginPath();
    context.moveTo(data.x + xDelta, data.y + boxHeight / 2);
    context.lineTo(data.x + radius + boxWidth, data.y + boxHeight / 2);
    context.lineTo(data.x + radius + boxWidth, data.y - boxHeight / 2);
    context.lineTo(data.x + xDelta, data.y - boxHeight / 2);
    context.arc(data.x, data.y, radius, angle, -angle);
    context.closePath();
    context.fill();
  } else {
    context.beginPath();
    context.arc(data.x, data.y, data.size + padding, 0, Math.PI * 2);
    context.closePath();
    context.fill();
  }

  context.shadowBlur = 0;
  context.fillStyle = "#0f172a";
  if (label) {
    context.fillText(label, data.x + data.size + 6, data.y + size / 3);
  }
  context.restore();
};

function colorForNode(node: RepositoryIndexNode) {
  if (node.virtual && node.recordType !== "file_aggregate") return "#94a3b8";
  return NODE_KIND_STYLE[node.kind]?.color || "#94a3b8";
}

function edgeVisualStyle(edge: RepositoryIndexEdge) {
  const weight = Number.isFinite(edge.weight) ? Math.max(0.1, edge.weight || 1) : 1;
  const family = relationFamily(edge);
  return {
    color:
      EDGE_COLOR[family] ||
      "#94a3b8",
    label: edge.label || metadataLabel(edge.kind || "related"),
    size: Math.min(2.4, 1 + Math.log2(weight + 1) * 0.32),
  };
}

function colorWithOpacity(color: string | undefined, opacity: number) {
  if (!color) return `rgba(148, 163, 184, ${opacity})`;

  const value = color.trim();
  if (value.startsWith("#")) {
    const rawHex = value.slice(1);
    const hex =
      rawHex.length === 3
        ? rawHex
            .split("")
            .map((part) => `${part}${part}`)
            .join("")
        : rawHex.slice(0, 6);

    if (hex.length === 6) {
      const red = Number.parseInt(hex.slice(0, 2), 16);
      const green = Number.parseInt(hex.slice(2, 4), 16);
      const blue = Number.parseInt(hex.slice(4, 6), 16);
      if ([red, green, blue].every(Number.isFinite)) {
        return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
      }
    }
  }

  const rgbMatch = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const [red, green, blue] = rgbMatch[1].split(",").map((part) => part.trim());
    if (red && green && blue) {
      return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
    }
  }

  return value;
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

function nodeSubtitle(node: RepositoryIndexNode) {
  const type = node.kind || node.language || "Repository index point";
  const location =
    node.startLine && node.path
      ? `${shortPath(node.path, 2)}:${node.startLine}`
      : shortPath(node.path, 2);
  return location ? `${type} in ${location}` : type;
}

function isMetadataRecord(value: unknown): value is MetadataRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function metadataLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function metricValue(value: unknown) {
  if (Array.isArray(value)) {
    const visible = value.slice(0, 12);
    if (visible.every((item) => item === null || typeof item !== "object")) {
      return visible.map((item) => String(item)).join(", ");
    }
    return JSON.stringify(visible, null, 2);
  }
  if (isMetadataRecord(value)) return JSON.stringify(value, null, 2);
  return String(value);
}

function hasMetadataValue(value: unknown) {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function compactNodeTitle(node?: RepositoryIndexNode) {
  if (!node) return "Unknown point";
  if (node.title) return node.title;
  if (node.path) return shortPath(node.path, 2);
  return node.id;
}

function mergeNodes(
  current: RepositoryIndexNode[],
  incoming: RepositoryIndexNode[],
) {
  const byId = new Map<string, RepositoryIndexNode>();
  current.forEach((node) => byId.set(node.id, node));
  incoming.forEach((node) =>
    byId.set(node.id, { ...(byId.get(node.id) || {}), ...node }),
  );
  return Array.from(byId.values());
}

function mergeEdges(
  current: RepositoryIndexEdge[],
  incoming: RepositoryIndexEdge[],
) {
  const byId = new Map<string, RepositoryIndexEdge>();
  current.forEach((edge) => byId.set(edge.id, edge));
  incoming.forEach((edge) => byId.set(edge.id, edge));
  return Array.from(byId.values());
}

function initialPosition(
  index: number,
  cached?: { x: number; y: number },
  seeded?: { x: number; y: number },
) {
  if (cached && Number.isFinite(cached.x) && Number.isFinite(cached.y)) {
    return cached;
  }
  if (seeded && Number.isFinite(seeded.x) && Number.isFinite(seeded.y)) {
    return seeded;
  }
  const angle = index * Math.PI * (3 - Math.sqrt(5));
  const radius = Math.sqrt(index + 1) * 24;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

function sizeForNode(node: RepositoryIndexNode, degree: number, graphOrder: number) {
  if (node.recordType === "file_aggregate") return 6;
  const degreeBoost = Math.sqrt(Math.max(degree, 0));
  const smallGraphBoost = graphOrder <= 40 ? 1.16 : graphOrder <= 180 ? 1.06 : 1;
  if (node.recordType === "structural_file" || node.kind === "file") {
    return Math.min(17, (8.4 + degreeBoost * 0.82) * smallGraphBoost);
  }
  return Math.min(11.5, (5.5 + degreeBoost * 0.68) * smallGraphBoost);
}

function cappedDenseNodeSize(node: RepositoryIndexNode, baseSize: number, graphOrder: number) {
  if (graphOrder >= HUGE_GRAPH_THRESHOLD) {
    if (node.kind === "file") return Math.min(baseSize, 1.7);
    return Math.min(baseSize, 1.25);
  }
  if (graphOrder >= 6000) {
    if (node.kind === "file") return Math.min(baseSize, 2.75);
    return Math.min(baseSize, 2.45);
  }
  if (graphOrder >= 3000) {
    if (node.kind === "file") return Math.min(baseSize, 3.5);
    return Math.min(baseSize, 3);
  }
  if (graphOrder >= DENSE_GRAPH_THRESHOLD) {
    if (node.kind === "file") return Math.min(baseSize, 2.8);
    return Math.min(baseSize, 2.3);
  }
  if (graphOrder >= OVERVIEW_GRAPH_THRESHOLD) {
    if (node.kind === "file") return Math.min(baseSize, 6);
    return Math.min(baseSize, 4.8);
  }
  return baseSize;
}

function buildSigmaGraph(
  nodes: RepositoryIndexNode[],
  edges: RepositoryIndexEdge[],
  positions: Map<string, { x: number; y: number }>,
  mapMode = false,
) {
  const graph = new Graph<SigmaNodeAttributes, SigmaEdgeAttributes>({
    type: "directed",
    multi: true,
    allowSelfLoops: false,
  });
  const nodeIds = new Set(nodes.map((node) => node.id));
  const degreeById = new Map<string, number>();
  const layoutPositions = nodes.length <= 180 ? directedLayout(nodes, edges) : new Map<string, { x: number; y: number }>();
  const curvatures = edgeCurvatures(edges);

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target) || edge.source === edge.target) {
      return;
    }
    degreeById.set(edge.source, (degreeById.get(edge.source) || 0) + 1);
    degreeById.set(edge.target, (degreeById.get(edge.target) || 0) + 1);
  });

  nodes.forEach((node, index) => {
    const position = initialPosition(
      index,
      positions.get(node.id),
      layoutPositions.get(node.id),
    );
    const degree = degreeById.get(node.id) || 0;
    graph.addNode(node.id, {
      label: node.title || "Repository index point",
      x: position.x,
      y: position.y,
      size: sizeForNode(node, degree, nodes.length),
      color: colorForNode(node),
      kind: node.kind,
      raw: node,
      forceLabel: mapMode && nodes.length <= 60,
      zIndex: 1,
    });
  });

  edges.forEach((edge) => {
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target) || edge.source === edge.target) {
      return;
    }
    if (graph.hasEdge(edge.id)) return;
    const style = edgeVisualStyle(edge);
    graph.addDirectedEdgeWithKey(edge.id, edge.source, edge.target, {
      label: style.label,
      size: style.size,
      weight: 1,
      color: style.color,
      kind: edge.kind,
      raw: edge,
      type: curvatures.get(edge.id) ? "curvedArrow" : "arrow",
      curvature: curvatures.get(edge.id) || 0,
    });
  });

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

export function RepositoryIndexExplorer({
  workspaceSlug,
  namespace,
  initialBranch,
}: RepositoryIndexExplorerProps) {
  const { theme } = useTheme();
  const graphSectionRef = useRef<HTMLDivElement | null>(null);
  const graphHostRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<Sigma<SigmaNodeAttributes, SigmaEdgeAttributes> | null>(null);
  const graphRef = useRef<SigmaGraph | null>(null);
  const layoutWorkerRef = useRef<Worker | null>(null);
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const scopeRequestRef = useRef(0);
  const pointRequestRef = useRef(0);
  const overviewRequestRef = useRef(0);
  const loadedGraphRef = useRef({ nodes: [] as RepositoryIndexNode[], edges: [] as RepositoryIndexEdge[] });
  const layoutTopologyRef = useRef<{
    nodes: RepositoryIndexNode[];
    edges: RepositoryIndexEdge[];
  } | null>(null);
  const filtersRef = useRef<RepositoryIndexFilters>({
    ...DEFAULT_FILTERS,
    branches: initialBranch ? [initialBranch] : [],
  });
  const cursorRef = useRef<string | null>(null);
  const limitRef = useRef(DEFAULT_GRAPH_LIMIT);

  const [overview, setOverview] = useState<RepositoryIndexOverview | null>(null);
  const [nodes, setNodes] = useState<RepositoryIndexNode[]>([]);
  const [edges, setEdges] = useState<RepositoryIndexEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<RepositoryIndexNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<RepositoryIndexEdge | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [graphView, setGraphView] = useState<GraphViewMode>("files");
  const graphViewRef = useRef<GraphViewMode>("files");
  const cancelAllRef = useRef(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [neighborhoodRoot, setNeighborhoodRoot] = useState<string | null>(null);
  const [showDisconnected, setShowDisconnected] = useState(false);
  const [showExternalEndpoints, setShowExternalEndpoints] = useState(false);
  const [hiddenRelationFacets, setHiddenRelationFacets] = useState<Set<string>>(() => new Set());
  const [graphCoverage, setGraphCoverage] = useState<GraphCoverage>({});
  const [filters, setFilters] = useState<RepositoryIndexFilters>(filtersRef.current);
  const [limit, setLimit] = useState(DEFAULT_GRAPH_LIMIT);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [loadingCompleteMap, setLoadingCompleteMap] = useState(false);
  const [loadingNode, setLoadingNode] = useState(false);
  const [expansionMessage, setExpansionMessage] = useState<string | null>(null);
  const [traceDepth, setTraceDepth] = useState(1);
  const [nodeQuery, setNodeQuery] = useState("");
  const [loadingAll, setLoadingAll] = useState(false);
  const [layoutRunning, setLayoutRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [relationBrowserOpen, setRelationBrowserOpen] = useState(false);
  const [relationBrowserPage, setRelationBrowserPage] = useState(0);
  const [relationBrowserQuery, setRelationBrowserQuery] = useState("");
  const [relationBrowserFacet, setRelationBrowserFacet] = useState("__all__");
  const [relationBrowserPair, setRelationBrowserPair] = useState<{
    sourcePath?: string | null;
    targetPath?: string | null;
  } | null>(null);
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
    loadedGraphRef.current = { nodes, edges };
  }, [nodes, edges]);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    limitRef.current = limit;
  }, [limit]);

  const selectedBranch = filters.branches?.[0] || overview?.selectedBranch || "";
  const selectedLanguage = filters.languages?.[0] || "__all__";
  const relationFacets = useMemo(() => {
    const counts = new Map<string, { edge: RepositoryIndexEdge; count: number }>();
    edges.forEach((edge) => {
      const facet = relationFacet(edge);
      const current = counts.get(facet);
      if (current) current.count += 1;
      else counts.set(facet, { edge, count: 1 });
    });
    const inventory = overview?.relationLabels?.length
      ? overview.relationLabels
      : overview?.relationKinds || [];
    inventory.forEach((item) => {
      const label = String(item.value || "related");
      const facet = label.trim().toLocaleLowerCase();
      const current = counts.get(facet);
      counts.set(facet, {
        edge: current?.edge || {
          id: `inventory:${facet}`,
          source: "",
          target: "",
          kind: label,
          label,
        },
        count: item.count,
      });
    });
    return Array.from(counts.entries())
      .map(([facet, value]) => ({ facet, ...value }))
      .sort((left, right) => right.count - left.count || left.facet.localeCompare(right.facet));
  }, [edges, overview?.relationKinds, overview?.relationLabels]);
  const fileMap = useMemo(() => buildFileMap(nodes, edges), [edges, nodes]);
  const fileMapProjection = useMemo(() => {
    if (showExternalEndpoints) return fileMap;
    const fileNodeIds = new Set(fileMap.nodes.filter((node) => !!node.path).map((node) => node.id));
    return {
      nodes: fileMap.nodes.filter((node) => fileNodeIds.has(node.id)),
      edges: fileMap.edges.filter((edge) => fileNodeIds.has(edge.source) && fileNodeIds.has(edge.target)),
      internalRelations: fileMap.internalRelations,
    };
  }, [fileMap, showExternalEndpoints]);
  const hiddenExternalRelationCount = useMemo(() => {
    if (showExternalEndpoints) return 0;
    const visibleIds = new Set(fileMapProjection.nodes.map((node) => node.id));
    return fileMap.edges.reduce((total, edge) => {
      if (visibleIds.has(edge.source) && visibleIds.has(edge.target)) return total;
      return total + Number(edge.metadata?.aggregateCount || 1);
    }, 0);
  }, [fileMap.edges, fileMapProjection.nodes, showExternalEndpoints]);
  const mapMode = graphView === "files";
  const graphProjection = useMemo(
    () => mapMode ? fileMapProjection : { nodes, edges, internalRelations: 0 },
    [fileMapProjection, edges, mapMode, nodes],
  );
  const relationFilteredEdges = useMemo(
    () => graphProjection.edges.filter(edge => !hiddenRelationFacets.has(relationFacet(edge))),
    [graphProjection.edges, hiddenRelationFacets],
  );
  const representedRelations = graphCoverage.projection === "files" ? graphCoverage.returnedRelations || 0 : edges.length;
  const connectedNodeIds = useMemo(
    () => new Set(relationFilteredEdges.flatMap((edge) => [edge.source, edge.target])),
    [relationFilteredEdges],
  );
  const neighborhood = useMemo(
    () => neighborhoodRoot ? traceDistances(graphProjection.nodes, relationFilteredEdges, neighborhoodRoot, traceDepth) : null,
    [graphProjection.nodes, relationFilteredEdges, neighborhoodRoot, traceDepth],
  );
  const renderedNodes = useMemo(
    () => graphProjection.nodes.filter(node => neighborhood
      ? neighborhood.has(node.id)
      : showDisconnected || connectedNodeIds.has(node.id)),
    [connectedNodeIds, graphProjection.nodes, neighborhood, showDisconnected],
  );
  const matchingNodes = useMemo(() => {
    const query = nodeQuery.trim().toLocaleLowerCase();
    return query ? (mapMode ? fileMapProjection.nodes : nodes).filter(node => `${node.title} ${node.path || ""}`.toLocaleLowerCase().includes(query)).slice(0, 12) : [];
  }, [fileMapProjection.nodes, mapMode, nodeQuery, nodes]);
  const renderedEdges = useMemo(() => relationFilteredEdges.filter(edge => edge.source !== edge.target &&
    (!neighborhood || (neighborhood.has(edge.source) && neighborhood.has(edge.target)))), [neighborhood, relationFilteredEdges]);
  const selfRelationCount = relationFilteredEdges.filter(edge => edge.source === edge.target).length;
  const nodeById = useMemo(
    () => new Map(graphProjection.nodes.map((node) => [node.id, node])),
    [graphProjection.nodes],
  );
  const rawNodeById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );
  const denseGraph = renderedNodes.length >= DENSE_GRAPH_THRESHOLD;
  const hugeGraph = renderedNodes.length >= HUGE_GRAPH_THRESHOLD;

  const loadOverview = useCallback(async (branch?: string | null) => {
    const request = ++overviewRequestRef.current;
    setLoadingOverview(true);
    try {
      const data = await projectService.getRepositoryIndexOverview(
        workspaceSlug,
        namespace,
        branch,
      );
      if (request !== overviewRequestRef.current) return;
      setOverview(data);
      if (!branch && data.selectedBranch) {
        const nextFilters = {
          ...filtersRef.current,
          branches: [data.selectedBranch],
        };
        filtersRef.current = nextFilters;
        setFilters(nextFilters);
      }
      if (!data.available) {
        setError(data.reason || "Repository index is not available");
      }
    } catch (error: unknown) {
      if (request === overviewRequestRef.current) setError(errorMessage(error, "Failed to load repository index overview"));
    } finally {
      if (request === overviewRequestRef.current) setLoadingOverview(false);
    }
  }, [workspaceSlug, namespace]);

  const loadGraph = useCallback(
    async (
      append = false,
      overrideFilters?: RepositoryIndexFilters,
      overrideCursor?: string | null,
    ) => {
      const request = ++scopeRequestRef.current;
      ++pointRequestRef.current;
      setLoadingNode(false);
      setLoadingAll(false);
      setExpansionMessage(null);
      const activeFilters = overrideFilters || filtersRef.current;
      if (!append) {
        setNeighborhoodRoot(null);
        filtersRef.current = activeFilters;
        positionsRef.current.clear();
        setSelectedNode(null);
        setSelectedEdge(null);
        setNodes([]);
        setEdges([]);
        setCursor(null);
        cursorRef.current = null;
      }
      const activeCursor = append ? overrideCursor || cursorRef.current : null;
      setLoadingGraph(true);
      setError(null);
      const wantsMap = graphViewRef.current === "files";
      setLoadingCompleteMap(wantsMap);
      let mapFinished = false;
      if (wantsMap && !append) {
        // Render a small preview while the complete projection is built on a
        // cold generation. A cached map usually wins and discards this preview.
        void projectService.getRepositoryIndexGraph(workspaceSlug, namespace, {
          filters: activeFilters, limit: DEFAULT_GRAPH_LIMIT, projection: "symbols",
        }).then(preview => {
          if (mapFinished || request !== scopeRequestRef.current || !preview.available) return;
          setNodes(preview.nodes || []);
          setEdges(preview.edges || []);
          setGraphCoverage({ returnedRelations: preview.returnedRelations, relationsTruncated: true });
          setLoadingGraph(false);
        }).catch(() => { /* The complete-map request reports a failure if needed. */ });
      }
      try {
        const response = await projectService.getRepositoryIndexGraph(
          workspaceSlug,
          namespace,
          {
            filters: activeFilters,
            projection: graphViewRef.current,
            limit: limitRef.current,
            cursor: activeCursor,
            scanLimit:
              activeFilters.path ||
              activeFilters.fileQuery ||
              activeFilters.textQuery
                ? Math.max(12000, limitRef.current * 8)
                : Math.max(8000, limitRef.current * 3),
          },
        );

        if (request !== scopeRequestRef.current) return;
        if (!response.available) {
          setNodes([]);
          setEdges([]);
          setSelectedNode(null);
          setCursor(null);
          setGraphCoverage({});
          setError(response.reason || "Repository index is not available");
          return;
        }

        if (!append) positionsRef.current.clear();
        setNodes((prev) =>
          append ? mergeNodes(prev, response.nodes || []) : response.nodes || [],
        );
        setEdges((prev) =>
          append ? mergeEdges(prev, response.edges || []) : response.edges || [],
        );
        cursorRef.current = response.nextCursor || null;
        setCursor(cursorRef.current);
        setGraphCoverage({
          projection: response.projection,
          eligibleRelations: response.eligibleRelations,
          returnedRelations: response.returnedRelations,
          relationsTruncated: response.relationsTruncated,
        });
        if (!append) {
          setSelectedNode(null);
          setSelectedEdge(null);
        }
      } catch (error: unknown) {
        if (request === scopeRequestRef.current) setError(errorMessage(error, "Failed to load repository index graph"));
      } finally {
        mapFinished = true;
        if (request === scopeRequestRef.current) { setLoadingGraph(false); setLoadingCompleteMap(false); }
      }
    },
    [namespace, workspaceSlug],
  );

  const loadPoint = useCallback(
    async (node: RepositoryIndexNode, mergeNeighborhood = false) => {
      const request = ++pointRequestRef.current;
      const scope = scopeRequestRef.current;
      setExpansionMessage(null);
      setLoadingNode(false);
      if (node.virtual) {
        setSelectedNode(node);
        return;
      }
      setLoadingNode(true);
      setError(null);
      try {
        const response = await projectService.getRepositoryIndexPoint(
          workspaceSlug, namespace, node.id,
          { filters: pointFilters(node, filtersRef.current.branches), neighborLimit: 160 },
        );
        if (request !== pointRequestRef.current || scope !== scopeRequestRef.current) return;
        if (response.available === false || !response.node) {
          setError(response.reason || "This indexed symbol is unavailable. Refresh the graph to load the current generation.");
          return;
        }
        setSelectedNode(response.node);
        if (mergeNeighborhood) {
          const incomingNodes = [response.node, ...(response.neighbors || [])];
          const current = loadedGraphRef.current;
          const nodeIds = new Set(current.nodes.map(item => item.id));
          const edgeIds = new Set(current.edges.map(item => item.id));
          const addedNodes = incomingNodes.filter(item => !nodeIds.has(item.id)).length;
          const addedEdges = (response.edges || []).filter(item => !edgeIds.has(item.id)).length;
          setNodes(prev => mergeNodes(prev, incomingNodes));
          setEdges(prev => mergeEdges(prev, response.edges || []));
          setExpansionMessage(
            `${addedNodes} new records · ${addedEdges} new relations. ` +
            (response.relationsTruncated
              ? "This neighborhood is limited to 160 neighbors. Load more graph pages or open the file to explore the remaining relations."
              : "Select a connected symbol and expand it to continue along the graph."),
          );
        }
      } catch (error: unknown) {
        if (request === pointRequestRef.current && scope === scopeRequestRef.current) {
          setError(errorMessage(error, "Failed to load repository index point"));
        }
      } finally {
        if (request === pointRequestRef.current && scope === scopeRequestRef.current) setLoadingNode(false);
      }
    },
    [namespace, workspaceSlug],
  );

  const applyFilters = useCallback(
    (nextFilters = filters) => {
      filtersRef.current = nextFilters;
      setFilters(nextFilters);
      setCursor(null);
      void loadOverview(nextFilters.branches?.[0]);
      void loadGraph(false, nextFilters, null);
    },
    [filters, loadGraph, loadOverview],
  );

  const resetFilters = useCallback(() => {
    const next: RepositoryIndexFilters = {
      ...DEFAULT_FILTERS,
      branches: initialBranch
        ? [initialBranch]
        : overview?.selectedBranch
          ? [overview.selectedBranch]
          : [],
    };
    graphViewRef.current = "files";
    setGraphView("files");
    setNeighborhoodRoot(null);
    setHiddenRelationFacets(new Set());
    applyFilters(next);
  }, [applyFilters, initialBranch, overview?.selectedBranch]);

  const loadAllAvailable = useCallback(async () => {
    if (!cursorRef.current || loadingGraph || loadingAll) return;
    const request = scopeRequestRef.current;
    const activeFilters = filtersRef.current;
    setLoadingAll(true);
    cancelAllRef.current = false;
    const allNodes = new Map(loadedGraphRef.current.nodes.map(node => [node.id, node]));
    const allEdges = new Map(loadedGraphRef.current.edges.map(edge => [edge.id, edge]));
    setLoadProgress(allEdges.size);
    setError(null);
    try {
      let nextCursor = cursorRef.current;
      while (nextCursor && !cancelAllRef.current) {
        const previousCursor = nextCursor;
        const response = await projectService.getRepositoryIndexGraph(
          workspaceSlug,
          namespace,
          {
            filters: activeFilters,
            limit: MAX_GRAPH_PAGE_SIZE,
            cursor: nextCursor,
            scanLimit: MAX_GRAPH_PAGE_SIZE * 3,
          },
        );
        if (request !== scopeRequestRef.current) return;
        if (!response.available) {
          setError(response.reason || "Repository index is not available");
          break;
        }
        for (const node of response.nodes || []) allNodes.set(node.id, node);
        for (const edge of response.edges || []) allEdges.set(edge.id, edge);
        setLoadProgress(allEdges.size);
        nextCursor = response.nextCursor || null;
        setCursor(nextCursor);
        cursorRef.current = nextCursor;
        setGraphCoverage({
          projection: response.projection,
          eligibleRelations: response.eligibleRelations,
          returnedRelations: response.returnedRelations,
          relationsTruncated: response.relationsTruncated,
        });
        if (nextCursor === previousCursor) throw new Error("The index cursor did not advance. Refresh to continue.");
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }

    } catch (error: unknown) {
      if (request === scopeRequestRef.current) setError(errorMessage(error, "Failed to load remaining repository index graph pages"));
    } finally {
      if (request === scopeRequestRef.current) {
        setNodes([...allNodes.values()]);
        setEdges([...allEdges.values()]);
        setLoadingAll(false);
      }
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

  const stopLayout = useCallback((resetCamera = true) => {
    layoutWorkerRef.current?.terminate();
    layoutWorkerRef.current = null;
    const graph = graphRef.current;
    if (graph) sanitizeGraphPositions(graph);
    storePositions(graph);
    sigmaRef.current?.refresh();
    if (resetCamera) {
      sigmaRef.current?.getCamera().animatedReset({ duration: 260 });
    }
    setLayoutRunning(false);
  }, [storePositions]);

  const runLayout = useCallback(() => {
    const graph = graphRef.current;
    const renderer = sigmaRef.current;
    if (!graph || !renderer || graph.order < 2) return;
    layoutWorkerRef.current?.terminate();
    layoutWorkerRef.current = null;
    if (graph.order <= 180) {
      const positions = directedLayout(graph.mapNodes((_id, attributes) => attributes.raw), graph.mapEdges((_id, attributes) => attributes.raw));
      graph.forEachNode(id => graph.mergeNodeAttributes(id, positions.get(id)!));
      storePositions(graph);
      renderer.refresh();
      renderer.getCamera().animatedReset({ duration: 260 });
      setLayoutRunning(false);
      return;
    }
    setError(current => current === LAYOUT_ERROR ? null : current);
    setLayoutRunning(true);
    const failed = () => {
      layoutWorkerRef.current?.terminate();
      layoutWorkerRef.current = null;
      setLayoutRunning(false);
      setError(LAYOUT_ERROR);
    };
    try {
      const worker = new Worker(new URL("./repositoryLayout.worker.ts", import.meta.url), { type: "module" });
      layoutWorkerRef.current = worker;
      worker.onmessage = ({ data }: MessageEvent<Map<string, { x: number; y: number }>>) => {
        if (layoutWorkerRef.current !== worker) return;
        data.forEach((position, id) => { if (graph.hasNode(id)) graph.mergeNodeAttributes(id, position); });
        sanitizeGraphPositions(graph);
        storePositions(graph);
        renderer.refresh();
        renderer.getCamera().animatedReset({ duration: 260 });
        worker.terminate();
        layoutWorkerRef.current = null;
        setLayoutRunning(false);
      };
      worker.onerror = failed;
      worker.postMessage({ nodes: graph.nodes().map(id => ({ id })), edges: graph.mapEdges((_id, _attributes, source, target) => ({ source, target })) });
    } catch { failed(); }
  }, [storePositions]);

  const focusNode = useCallback((nodeId?: string | null) => {
    const graph = graphRef.current;
    const renderer = sigmaRef.current;
    if (!nodeId || !graph || !renderer || !graph.hasNode(nodeId)) return;
    sanitizeGraphPositions(graph);
    const attributes = renderer.getNodeDisplayData(nodeId);
    if (!attributes || !Number.isFinite(attributes.x) || !Number.isFinite(attributes.y)) return;
    renderer.getCamera().animate(
      { x: attributes.x, y: attributes.y, ratio: 0.42 },
      { duration: 320 },
    );
  }, []);

  const invalidateRequests = useCallback(() => {
    ++scopeRequestRef.current;
    ++pointRequestRef.current;
    ++overviewRequestRef.current;
  }, []);

  useEffect(() => {
    void loadOverview(initialBranch);
  }, [initialBranch, loadOverview]);

  useEffect(() => {
    const nextFilters: RepositoryIndexFilters = {
      ...DEFAULT_FILTERS,
      branches: initialBranch ? [initialBranch] : [],
    };
    setFilters(nextFilters);
    setCursor(null);
    filtersRef.current = nextFilters;
    setExpansionMessage(null);
    setHiddenRelationFacets(new Set());
    void loadGraph(false, nextFilters, null);
    return invalidateRequests;
  }, [initialBranch, invalidateRequests, loadGraph]);

  useEffect(() => {
    const container = graphHostRef.current;
    if (!container) return;

    stopLayout();
    sigmaRef.current?.kill();
    sigmaRef.current = null;

    const previousTopology = layoutTopologyRef.current;
    const topologyChanged =
      previousTopology?.nodes !== renderedNodes ||
      previousTopology?.edges !== renderedEdges;
    if (topologyChanged) positionsRef.current.clear();
    layoutTopologyRef.current = { nodes: renderedNodes, edges: renderedEdges };

    const graph = buildSigmaGraph(renderedNodes, renderedEdges, positionsRef.current, mapMode);
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
        defaultEdgeType: "arrow",
        edgeProgramClasses: { arrow: EdgeArrowProgram, curvedArrow: EdgeCurvedArrowProgram },
        defaultNodeColor: "#6ee7b7",
        defaultEdgeColor: graphTheme.defaultEdgeColor,
        defaultDrawNodeHover: drawRepositoryIndexNodeHover,
        enableEdgeEvents: true,
        hideEdgesOnMove: denseGraph,
        hideLabelsOnMove: false,
        itemSizesReference: "screen",
        labelColor: { attribute: "labelColor", color: graphTheme.labelColor },
        labelDensity: graph.order > 180 ? 0.2 : 1,
        labelFont: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        labelGridCellSize: denseGraph ? 140 : 112,
        labelRenderedSizeThreshold: 6,
        labelSize: mapMode ? 12 : denseGraph ? 10 : 11,
        labelWeight: "500",
        minCameraRatio: 0.02,
        maxCameraRatio: 8,
        minEdgeThickness: denseGraph ? 0.35 : 0.55,
        renderEdgeLabels: false,
        renderLabels: true,
        stagePadding: 76,
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
      setSelectedEdge(null);
      setSelectedNode(raw);
      void loadPoint(raw, false);
    });
    renderer.on("doubleClickNode", ({ node, event }) => {
      event.preventSigmaDefault();
      setNeighborhoodRoot(node);
    });
    renderer.on("clickEdge", ({ edge, event }) => {
      event.preventSigmaDefault();
      ++pointRequestRef.current;
      setSelectedNode(null);
      setSelectedEdge(graph.getEdgeAttribute(edge, "raw"));
    });
    renderer.on("clickStage", () => {
      ++pointRequestRef.current;
      setSelectedNode(null);
      setSelectedEdge(null);
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
      if (!dragMoved) stopLayout(false);
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

    if (topologyChanged) runLayout();

    return () => {
      sanitizeGraphPositions(graph);
      storePositions(graph);
      layoutWorkerRef.current?.terminate();
      layoutWorkerRef.current = null;
      renderer.kill();
      if (sigmaRef.current === renderer) sigmaRef.current = null;
    };
  }, [denseGraph, graphTheme.defaultEdgeColor, graphTheme.labelColor, hugeGraph, loadPoint, mapMode, renderedEdges, renderedNodes, runLayout, stopLayout, storePositions]);

  useEffect(() => {
    const renderer = sigmaRef.current;
    const graph = graphRef.current;
    if (!renderer || !graph) return;

    const activeNode = selectedNode?.id || hoveredNodeId;
    const distances = traceDistances(renderedNodes, renderedEdges, activeNode, traceDepth);
    const neighbors = new Set([...distances.keys()].filter(id => id !== activeNode));

    renderer.setSettings({
      nodeReducer: (node, data) => {
        const active = distances.size > 0;
        const isActive = node === activeNode;
        const isNeighbor = neighbors.has(node);
        const graphAttributes = graph.getNodeAttributes(node);
        const baseSize =
          Number.isFinite(data.size) && data.size > 0 ? data.size : graphAttributes.size || 5;
        const displaySize = cappedDenseNodeSize(graphAttributes.raw, baseSize, graph.order);
        const reduced: SigmaNodeAttributes = {
          ...data,
          x: Number.isFinite(data.x) ? data.x : graphAttributes.x,
          y: Number.isFinite(data.y) ? data.y : graphAttributes.y,
          size: (hugeGraph ? Math.min(displaySize, 2.8) : displaySize) * Math.min(1, Math.max(0.4, renderer.getDimensions().width / 800)),
          labelColor: graphTheme.labelColor,
        };

        if (!Number.isFinite(reduced.x) || !Number.isFinite(reduced.y)) {
          const fallback = initialPosition(0);
          reduced.x = fallback.x;
          reduced.y = fallback.y;
        }

        if (active && !isActive && !isNeighbor) {
          reduced.color = graphTheme.isDark ? "#78869a" : "#94a3b8";
          reduced.labelColor = graphTheme.isDark ? "#a4afbf" : "#64748b";
          reduced.size = Math.max(2.2, reduced.size * 0.82);
          if (graph.order > 40) reduced.label = "";
          reduced.zIndex = 0;
        }

        if (isNeighbor) {
          reduced.zIndex = 4;
          reduced.forceLabel = false;
        }

        if (isActive) {
          reduced.color = "#f59e0b";
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
        if (selectedEdge?.id === edge) {
          reduced.color = "#f59e0b";
          reduced.size = Math.max(data.size * 1.8, 2.2);
          reduced.hidden = false;
          return reduced;
        }
        if (!activeNode) {
          if (hugeGraph) {
            reduced.color = colorWithOpacity(data.color, graphTheme.isDark ? 0.34 : 0.42);
            reduced.size = Math.max(0.55, Math.min(reduced.size, 0.9));
          } else if (denseGraph) {
            reduced.color = colorWithOpacity(data.color, graphTheme.isDark ? 0.22 : 0.3);
            reduced.size = Math.max(0.4, Math.min(reduced.size, 0.65));
          }
          return reduced;
        }
        const [source, target] = graph.extremities(edge);
        const touchesActive = source === activeNode || target === activeNode;
        const inNeighborhood =
          touchesActive ||
          (neighbors.has(source) && neighbors.has(target));

        if (!inNeighborhood) {
          reduced.color = graphTheme.inactiveEdgeColor;
          reduced.size = 0.45;
          return reduced;
        }

        reduced.hidden = false;
        reduced.color = colorWithOpacity(data.color, touchesActive || graph.order <= 180 ? 0.9 : 0.25);
        reduced.size = touchesActive ? Math.min(data.size * 1.5, 2.4) : graph.order > 180 ? 0.65 : data.size;
        return reduced;
      },
    });
    renderer.refresh();
  }, [denseGraph, graphTheme.activeLabelColor, graphTheme.inactiveEdgeColor, graphTheme.isDark, graphTheme.labelColor, hoveredNodeId, hugeGraph, renderedEdges, renderedNodes, selectedEdge?.id, selectedNode?.id, traceDepth]);

  const metricItems = [
    {
      label: "Indexed points",
      value: formatNumber(overview?.totalPoints),
      icon: Database,
    },
    {
      label: "Stored relations",
      value: formatNumber(overview?.totalRelations ?? edges.length),
      icon: GitBranch,
    },
    {
      label: graphView === "files" ? "Mapped relations" : "Loaded relations",
      value: formatNumber(representedRelations),
      icon: Split,
    },
    {
      label: "Indexed files",
      value: formatNumber(overview?.indexedFileCount ?? overview?.files?.length),
      icon: FileCode,
    },
  ];

  const nodeLegendItems = useMemo(() => {
    const kinds = Array.from(new Set(renderedNodes.map((node) => node.kind).filter(Boolean)));
    return Array.from(new Map(kinds.map((kind) => [colorForNode(renderedNodes.find(node => node.kind === kind)!), {
      kind,
      label: NODE_KIND_STYLE[kind]?.label || metadataLabel(kind),
      color: NODE_KIND_STYLE[kind]?.color || colorForNode(
        renderedNodes.find((node) => node.kind === kind) as RepositoryIndexNode,
      ),
    }])).values());
  }, [renderedNodes]);

  const selectedMetadataRecord = selectedNode?.metadata;
  const selectedFile = selectedNode?.file;
  const selectedEntity = selectedNode?.entity;
  const selectedRelationRecord = selectedNode?.relation;
  const selectedCanonicalRecord = selectedFile || selectedEntity || selectedRelationRecord;
  const selectedSpan = selectedCanonicalRecord?.span;
  const selectedStructuralAttributes =
    selectedEntity?.attributes || selectedRelationRecord?.attributes || [];
  const selectedCaptures =
    selectedEntity?.captures || selectedRelationRecord?.captures || [];
  const selectedMetadata = selectedMetadataRecord
    ? Object.entries(selectedMetadataRecord).filter(([key, value]) => {
        if (!hasMetadataValue(value)) return false;
        if (POINT_DETAIL_METADATA_KEYS.has(key) || PROVENANCE_METADATA_KEYS.has(key)) {
          return false;
        }
        if ([
          "structural_file",
          "structural_entity",
          "structural_relation",
        ].includes(key)) {
          return false;
        }
        return true;
      })
    : [];
  const selectedProvenance = selectedMetadataRecord
    ? [
        ["Plugins", selectedMetadataRecord.plugin_ids],
        ["Plugin selection fingerprint", selectedMetadataRecord.plugin_fingerprint],
        ["Plugin descriptor fingerprint", selectedMetadataRecord.plugin_descriptor_fingerprint],
        ["Plugin implementation fingerprint", selectedMetadataRecord.plugin_implementation_fingerprint],
        ["Index representation fingerprint", selectedMetadataRecord.index_representation_fingerprint],
        ["Commit", selectedMetadataRecord.commit],
        ["Indexed at", selectedNode?.indexedAt ?? selectedMetadataRecord.indexed_at],
      ].filter(([, value]) => hasMetadataValue(value))
    : [];
  const selectedRelations = useMemo(
    () =>
      selectedNode
        ? relationFilteredEdges
            .filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
            .sort((left, right) => {
              const leftWeight = left.weight || 0;
              const rightWeight = right.weight || 0;
              return rightWeight - leftWeight;
            })
            .slice(0, 36)
        : [],
    [relationFilteredEdges, selectedNode],
  );
  const selectedEdgeSource = selectedEdge
    ? nodeById.get(selectedEdge.source) || rawNodeById.get(selectedEdge.source)
    : undefined;
  const selectedEdgeTarget = selectedEdge
    ? nodeById.get(selectedEdge.target) || rawNodeById.get(selectedEdge.target)
    : undefined;
  const selectedEdgeCount = selectedEdge
    ? Number(selectedEdge.metadata?.aggregateCount || 1)
    : 0;
  const selectedEdgePlugins = selectedEdge
    ? Array.from(new Set(
        (Array.isArray(selectedEdge.metadata?.plugins)
          ? selectedEdge.metadata.plugins
          : [selectedEdge.metadata?.plugin]
        ).filter((value): value is string => typeof value === "string" && value.length > 0),
      ))
    : [];
  const relationBrowserEdges = useMemo(() => {
    const query = relationBrowserQuery.trim().toLocaleLowerCase();
    return edges.filter((edge) => {
      if (relationBrowserFacet !== "__all__" && relationFacet(edge) !== relationBrowserFacet) {
        return false;
      }
      const source = rawNodeById.get(edge.source);
      const target = rawNodeById.get(edge.target);
      if (relationBrowserPair) {
        if (relationBrowserPair.sourcePath && source?.path !== relationBrowserPair.sourcePath) return false;
        if (relationBrowserPair.targetPath && target?.path !== relationBrowserPair.targetPath) return false;
      }
      if (!query) return true;
      return [
        edge.kind,
        edge.label,
        source?.title,
        source?.path,
        target?.title,
        target?.path,
        edge.relation?.evidence,
        edge.relation?.path,
        edge.metadata?.plugin,
        edge.metadata?.plugins,
      ].some((value) => String(value || "").toLocaleLowerCase().includes(query));
    });
  }, [edges, rawNodeById, relationBrowserFacet, relationBrowserPair, relationBrowserQuery]);
  const relationBrowserPageCount = Math.max(
    1,
    Math.ceil(relationBrowserEdges.length / RELATION_BROWSER_PAGE_SIZE),
  );
  const safeRelationBrowserPage = Math.min(relationBrowserPage, relationBrowserPageCount - 1);
  const relationBrowserSlice = relationBrowserEdges.slice(
    safeRelationBrowserPage * RELATION_BROWSER_PAGE_SIZE,
    (safeRelationBrowserPage + 1) * RELATION_BROWSER_PAGE_SIZE,
  );

  const activeFilterCount = [
    filters.branches?.length,
    filters.languages?.length,
    filters.path ? 1 : 0,
    filters.fileQuery ? 1 : 0,
    filters.textQuery ? 1 : 0,
  ].reduce((sum, value) => sum + (value || 0), 0);

  const filterToNode = useCallback(() => {
    if (!selectedNode) return;
    const entityQuery =
      selectedNode.entity?.qualified_name || selectedNode.entity?.name;
    if (entityQuery) {
      applyFilters({
        ...filtersRef.current,
        textQuery: entityQuery,
      });
      return;
    }
    if (selectedNode.path) {
      graphViewRef.current = "symbols";
      setGraphView("symbols");
      applyFilters({
        ...filtersRef.current,
        path: selectedNode.path,
        fileQuery: "",
        textQuery: "",
        languages: [],
      });
    }
  }, [applyFilters, selectedNode]);

  const setGraphViewMode = useCallback((mode: GraphViewMode) => {
    ++pointRequestRef.current;
    setLoadingNode(false);
    setExpansionMessage(null);
    graphViewRef.current = mode;
    setGraphView(mode);
    setNeighborhoodRoot(null);
    const nextFilters = mode === "files" ? { ...filtersRef.current, path: undefined } : filtersRef.current;
    setFilters(nextFilters);
    void loadGraph(false, nextFilters);
    setSelectedNode(null);
    setSelectedEdge(null);
    setHoveredNodeId(null);
    positionsRef.current.clear();
  }, [loadGraph]);

  const toggleRelationFacet = useCallback((facet: string) => {
    positionsRef.current.clear();
    setHiddenRelationFacets((current) => {
      const next = new Set(current);
      if (next.has(facet)) next.delete(facet);
      else next.add(facet);
      return next;
    });
    setSelectedEdge(null);
  }, []);

  const inspectGraphNode = useCallback((node?: RepositoryIndexNode) => {
    if (!node) return;
    if (neighborhoodRoot || !connectedNodeIds.has(node.id)) setNeighborhoodRoot(node.id);
    setSelectedEdge(null);
    setSelectedNode(node);
    focusNode(node.id);
    if (!node.virtual) void loadPoint(node, false);
  }, [connectedNodeIds, focusNode, loadPoint, neighborhoodRoot]);

  const openRelationBrowser = useCallback((edge?: RepositoryIndexEdge | null) => {
    setRelationBrowserPage(0);
    setRelationBrowserQuery("");
    if (edge) {
      setRelationBrowserFacet(relationFacet(edge));
      const source = nodeById.get(edge.source) || rawNodeById.get(edge.source);
      const target = nodeById.get(edge.target) || rawNodeById.get(edge.target);
      setRelationBrowserPair({
        sourcePath: source?.path,
        targetPath: target?.path,
      });
    } else {
      setRelationBrowserFacet("__all__");
      setRelationBrowserPair(null);
    }
    setRelationBrowserOpen(true);
  }, [nodeById, rawNodeById]);

  const inspectRawRelation = useCallback((edge: RepositoryIndexEdge) => {
    ++pointRequestRef.current;
    setNeighborhoodRoot(null);
    const facet = relationFacet(edge);
    setHiddenRelationFacets((current) => {
      if (!current.has(facet)) return current;
      const next = new Set(current);
      next.delete(facet);
      return next;
    });
    if (!edge.metadata?.aggregate) { graphViewRef.current = "symbols"; setGraphView("symbols"); }
    setSelectedNode(null);
    setSelectedEdge(edge);
    setHoveredNodeId(null);
    setRelationBrowserOpen(false);
    positionsRef.current.clear();
  }, []);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card/70 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Repository Index</h2>
              {overview?.sampled && (
                <Badge variant="outline" className="text-[11px]">
                  sampled filters
                </Badge>
              )}
              {layoutRunning && (
                <Badge variant="secondary" className="gap-1 text-[11px]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  arranging
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                {overview?.selectedBranch
                  ? `Branch: ${overview.selectedBranch}`
                  : "Explore indexed files, symbols, and their relationships"}
              </span>
              {activeFilterCount > 0 && (
                <Badge variant="outline" className="text-[11px]">
                  {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {metricItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="min-w-0 border-l px-3 py-1"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">{item.value}</div>
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

      <div ref={graphSectionRef} className="relative bg-background">
        {filtersOpen && (
          <div className={cn("absolute inset-0 z-50", isFullscreen && "fixed z-[60]")}>
            <button
              type="button"
              aria-label="Close repository index filters"
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
                aria-label="Close repository index filters"
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
                    branches: [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {(overview?.branches || []).map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
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
              <Label htmlFor="repository-index-file-filter">File contains</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="repository-index-file-filter"
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
              <Label htmlFor="repository-index-symbol-filter">Symbol or metadata</Label>
              <Input
                id="repository-index-symbol-filter"
                value={filters.textQuery || ""}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    textQuery: event.target.value,
                  }))
                }
                placeholder="Class, function, import"
              />
            </div>

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
                          onClick={() => {
                            setGraphView("symbols");
                            applyFilters({
                              ...filtersRef.current,
                              path: value,
                              fileQuery: "",
                              textQuery: "",
                            });
                          }}
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
                  {(overview?.symbolNames || []).slice(0, 34).map((symbol) => {
                    const value = String(symbol.value);
                    return (
                      <button
                        key={value}
                        className={cn(
                          "rounded-full border px-2 py-1 text-xs hover:bg-muted",
                          filters.textQuery === value && "border-primary text-primary",
                        )}
                        onClick={() => {
                          setGraphView("symbols");
                          applyFilters({
                            ...filtersRef.current,
                            textQuery: value,
                          });
                        }}
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

        {relationBrowserOpen && (
          <div className={cn("absolute inset-0 z-50", isFullscreen && "fixed z-[60]")}>
            <button
              type="button"
              aria-label="Close relation browser"
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={() => setRelationBrowserOpen(false)}
            />
            <aside className="absolute bottom-4 right-4 top-4 flex w-[min(760px,calc(100vw-2rem))] min-w-0 flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-2xl">
              <div className="border-b p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <GitBranch className="h-4 w-4 text-primary" />
                      {graphView === "files" ? "File Relation Bundles" : "Exact Relation Browser"}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatNumber(relationBrowserEdges.length)} matching · {formatNumber(edges.length)} {graphView === "files" ? "file bundles" : "exact relations"} loaded
                      {overview?.totalRelations !== undefined
                        ? ` · ${formatNumber(overview.totalRelations)} stored`
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close relation browser"
                    onClick={() => setRelationBrowserOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_220px_auto]">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={relationBrowserQuery}
                      onChange={(event) => {
                        setRelationBrowserQuery(event.target.value);
                        setRelationBrowserPage(0);
                      }}
                      className="pl-9"
                      placeholder="Source, target, file, evidence..."
                    />
                  </div>
                  <Select
                    value={relationBrowserFacet}
                    onValueChange={(value) => {
                      setRelationBrowserFacet(value);
                      setRelationBrowserPage(0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Relation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All relation types</SelectItem>
                      {relationFacets.map(({ facet, count }) => (
                        <SelectItem key={facet} value={facet}>
                          {metadataLabel(facet)} ({formatNumber(count)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    disabled={!cursor || loadingAll || loadingGraph}
                    onClick={loadAllAvailable}
                  >
                    {loadingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                    Load all
                  </Button>
                </div>

                {relationBrowserPair && (
                  <div className="mt-2 flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs">
                    <span className="min-w-0 truncate">
                      Bundle scope: {shortPath(relationBrowserPair.sourcePath)} → {shortPath(relationBrowserPair.targetPath)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 shrink-0 px-2 text-xs"
                      onClick={() => {
                        setRelationBrowserPair(null);
                        setRelationBrowserPage(0);
                      }}
                    >
                      Clear pair
                    </Button>
                  </div>
                )}
              </div>

              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-1.5 p-3">
                  {relationBrowserSlice.length === 0 ? (
                    <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No loaded relations match this selection.
                    </div>
                  ) : relationBrowserSlice.map((edge) => {
                    const source = rawNodeById.get(edge.source);
                    const target = rawNodeById.get(edge.target);
                    const style = edgeVisualStyle(edge);
                    return (
                      <button
                        key={edge.id}
                        type="button"
                        onClick={() => inspectRawRelation(edge)}
                        className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-md border bg-background px-3 py-2 text-left text-xs transition-colors hover:border-primary/50 hover:bg-muted/40"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{compactNodeTitle(source)}</span>
                          <span className="block truncate text-[10px] text-muted-foreground">{source?.path || edge.source}</span>
                        </span>
                        <span className="flex max-w-48 flex-col items-center gap-1 text-center">
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <span className="h-0.5 w-4" style={{ backgroundColor: style.color }} />
                            {edge.label || metadataLabel(edge.kind)}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[10px] text-muted-foreground">
                            {edge.metadata?.aggregate ? `${formatNumber(Number(edge.metadata.aggregateCount))} relations` : String(edge.metadata?.origin || edge.relation?.evidence || "indexed")}
                            {Array.isArray(edge.metadata?.plugins) && edge.metadata.plugins.length > 0
                              ? ` · ${edge.metadata.plugins.map(String).join(", ")}`
                              : edge.metadata?.plugin
                                ? ` · ${String(edge.metadata.plugin)}`
                                : ""}
                            {edge.relation?.path ? ` · ${shortPath(edge.relation.path, 2)}:${edge.relation.span.start_line}` : ""}
                          </span>
                        </span>
                        <span className="min-w-0 text-right">
                          <span className="block truncate font-medium">{compactNodeTitle(target)}</span>
                          <span className="block truncate text-[10px] text-muted-foreground">{target?.path || edge.target}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground">
                <span>
                  {relationBrowserEdges.length === 0
                    ? "0 relations"
                    : `${formatNumber(safeRelationBrowserPage * RELATION_BROWSER_PAGE_SIZE + 1)}–${formatNumber(Math.min((safeRelationBrowserPage + 1) * RELATION_BROWSER_PAGE_SIZE, relationBrowserEdges.length))} of ${formatNumber(relationBrowserEdges.length)}`}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeRelationBrowserPage === 0}
                    onClick={() => setRelationBrowserPage(Math.max(0, safeRelationBrowserPage - 1))}
                  >
                    Previous
                  </Button>
                  <span>Page {safeRelationBrowserPage + 1} / {relationBrowserPageCount}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safeRelationBrowserPage >= relationBrowserPageCount - 1}
                    onClick={() => setRelationBrowserPage(Math.min(relationBrowserPageCount - 1, safeRelationBrowserPage + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        )}

        <section
          data-repository-index-graph="true"
          className={cn(
            "relative overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50 shadow-sm dark:border-white/10 dark:bg-[#080b10]",
            isFullscreen && "fixed inset-0 z-50 rounded-none border-0",
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.075)_1px,transparent_1px)] [background-size:32px_32px] dark:bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.1)_1px,transparent_1px)]" />
          <div className="absolute inset-0 bg-white/[0.64] dark:bg-[rgba(8,11,16,0.74)]" />

          <div className={cn("relative z-10 flex min-h-[680px] flex-col lg:h-[780px]", isFullscreen && "h-screen min-h-screen lg:h-screen")}>
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-white/[0.94] px-4 py-3 text-slate-900 backdrop-blur dark:border-white/10 dark:bg-[rgba(13,17,24,0.92)] dark:text-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {formatNumber(renderedNodes.length)} {mapMode ? "files / endpoints" : "symbols / records"}
                  {" · "}{formatNumber(renderedEdges.length)} {mapMode ? "typed, directed bundles" : "directed connections"}
                  {selfRelationCount > 0 && ` · ${selfRelationCount} self-relations in Relations`}
                  {graphView === "files" && fileMap.internalRelations > 0 && ` · ${formatNumber(fileMap.internalRelations)} relations within files`}
                  {graphView === "files" && hiddenExternalRelationCount > 0 && ` · ${formatNumber(hiddenExternalRelationCount)} external hidden`}
                </span>
                <span>{formatNumber(representedRelations)} relations {loadingCompleteMap ? "in preview · loading file map…" : graphCoverage.projection === "files" ? (graphCoverage.relationsTruncated ? "in partial map · refresh to retry" : "mapped · complete file map") : `loaded${cursor || graphCoverage.relationsTruncated ? " · more pages available" : " · end of graph pages"}`}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="mr-1 flex rounded-md border border-slate-300 bg-white/75 p-0.5 dark:border-white/20 dark:bg-white/5">
                  <Button
                    variant={graphView === "files" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    aria-pressed={graphView === "files"}
                    onClick={() => setGraphViewMode("files")}
                  >
                    <Boxes className="h-3.5 w-3.5" />
                    File dependencies
                  </Button>
                  <Button
                    variant={graphView === "symbols" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    aria-pressed={graphView === "symbols"}
                    onClick={() => setGraphViewMode("symbols")}
                  >
                    <Waypoints className="h-3.5 w-3.5" />
                    AST symbols
                  </Button>
                </div>
                <Select value={String(traceDepth)} onValueChange={value => setTraceDepth(Number(value))}>
                  <SelectTrigger aria-label="Trace depth" className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Trace 1 hop</SelectItem>
                    <SelectItem value="2">Trace 2 hops</SelectItem>
                    <SelectItem value="3">Trace 3 hops</SelectItem>
                    <SelectItem value="999999">Trace component</SelectItem>
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showDisconnected ? "secondary" : "ghost"}
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        positionsRef.current.clear();
                        setShowDisconnected((value) => !value);
                      }}
                    >
                      {showDisconnected ? "All records" : "Connected only"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showDisconnected
                      ? "Hide records without a displayed relation"
                      : "Include records without a displayed relation"}
                  </TooltipContent>
                </Tooltip>
                {graphView === "files" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={showExternalEndpoints ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          positionsRef.current.clear();
                          setShowExternalEndpoints((value) => !value);
                        }}
                      >
                        {showExternalEndpoints ? "External shown" : "External hidden"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {showExternalEndpoints
                        ? "Hide unresolved external symbols from the file map"
                        : "Show unresolved external symbols and their relations"}
                    </TooltipContent>
                  </Tooltip>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openRelationBrowser()}
                  className="border-slate-300 bg-white/75 text-slate-900 hover:bg-white dark:border-white/20 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                >
                  <GitBranch className="h-4 w-4" />
                  Relations
                </Button>
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
                      aria-label="Rebuild relationship layout"
                      onClick={() => runLayout()}
                      disabled={layoutRunning || nodes.length === 0}
                      className="text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/10"
                    >
                      <RefreshCw className={cn("h-4 w-4", layoutRunning && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rebuild relationship layout</TooltipContent>
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
                  onClick={() => loadGraph(true, undefined, cursor)}
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

            <div className="relative z-20 flex min-h-11 flex-nowrap items-center gap-1.5 overflow-x-auto border-b border-slate-200 bg-white/[0.86] px-4 py-2 text-xs text-slate-700 [scrollbar-width:thin] dark:border-white/10 dark:bg-[rgba(13,17,24,0.86)] dark:text-slate-200">
              <span className="mr-1 shrink-0 font-medium">Relation types</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() => setHiddenRelationFacets(new Set())}
                disabled={hiddenRelationFacets.size === 0}
              >
                Show all
              </Button>
              {relationFacets.map(({ facet, edge, count }) => {
                const hidden = hiddenRelationFacets.has(facet);
                const style = edgeVisualStyle(edge);
                const origin = String(edge.metadata?.origin || edge.relation?.evidence || "");
                return (
                  <button
                    key={facet}
                    type="button"
                    aria-pressed={!hidden}
                    onClick={() => toggleRelationFacet(facet)}
                    className={cn(
                      "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2 transition-colors",
                      hidden
                        ? "border-slate-200 bg-slate-100 text-slate-400 line-through dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-500"
                        : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 dark:border-white/15 dark:bg-white/[0.06] dark:text-slate-100",
                    )}
                    title={`${metadataLabel(facet)} · ${formatNumber(count)} relation${count === 1 ? "" : "s"}${origin ? ` · ${origin}` : ""}`}
                  >
                    <span className="h-0.5 w-4 shrink-0 rounded-full" style={{ backgroundColor: style.color }} />
                    <span>{metadataLabel(facet)}</span>
                    <span className="text-[10px] tabular-nums opacity-70">{formatNumber(count)}</span>
                  </button>
                );
              })}
            </div>

            {neighborhoodRoot && <div className="relative z-20 flex items-center gap-3 border-b bg-background px-4 py-2 text-xs">
              <span className="min-w-0 truncate">Neighborhood of <strong>{nodeById.get(neighborhoodRoot)?.title}</strong> · {renderedNodes.length} of {graphProjection.nodes.length} nodes</span>
              <Button size="sm" variant="outline" className="ml-auto shrink-0" onClick={() => setNeighborhoodRoot(null)}>Whole graph</Button>
            </div>}
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <div className="relative h-[540px] min-h-[400px] min-w-0 flex-1 lg:h-auto">
              <div
                ref={graphHostRef}
                className="absolute inset-0"
                role="application"
                aria-label="Interactive repository relationship graph"
              />

              <div className="absolute left-3 top-3 z-20 w-64 max-w-[calc(100%-1.5rem)]">
                <Input aria-label="Find a loaded graph record" placeholder="Find a loaded file or symbol…" value={nodeQuery} onChange={event => setNodeQuery(event.target.value)} className="h-9 bg-background/95 text-xs shadow-sm" />
                {nodeQuery.trim() && (
                  <div className="mt-1 max-h-64 overflow-auto rounded-md border bg-popover p-1 shadow-lg">
                    {matchingNodes.length === 0 && <p className="p-2 text-xs text-muted-foreground">No loaded records match. Use Filters to search the index.</p>}
                    {matchingNodes.map(node => (
                      <button key={node.id} type="button" onClick={() => { inspectGraphNode(node); setNodeQuery(""); }} className="block w-full rounded px-2 py-2 text-left text-xs hover:bg-muted focus:bg-muted">
                        <span className="block truncate font-medium">{node.title}</span>
                        <span className="block truncate text-muted-foreground">{node.path || "Unresolved endpoint"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!loadingGraph && renderedNodes.length > 0 && (
                <div className="pointer-events-none absolute left-4 top-14 z-10 hidden lg:inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/[0.88] px-3 py-1.5 text-[11px] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/75 dark:text-slate-300">
                  <MousePointer2 className="h-3.5 w-3.5 text-primary" />
                  Arrows show direction · zoom for labels · double-click for neighborhood
                </div>
              )}

              {(loadingGraph || loadingAll) && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 text-slate-700 dark:bg-[rgba(8,11,16,0.60)] dark:text-slate-200">
                  <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-white/10 dark:bg-[#111827]">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    {loadingAll ? `${formatNumber(loadProgress)} relations loaded` : "Loading graph"}
                    {loadingAll && <Button variant="outline" size="sm" onClick={() => { cancelAllRef.current = true; }}>Stop loading</Button>}
                  </div>
                </div>
              )}

              {!loadingGraph && renderedNodes.length === 0 && (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-6 text-center text-slate-700 dark:text-slate-300">
                  <div className="max-w-sm rounded-md border border-slate-200 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-[#111827]">
                    <Database className="mx-auto mb-3 h-8 w-8 text-slate-400 dark:text-slate-500" />
                    <div className="font-medium">No repository index points found</div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-500">
                      No records match the current filters. Show all relation types or include disconnected records.
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-4 z-20 flex max-w-[calc(100%-2rem)] flex-nowrap gap-3 overflow-x-auto rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-lg backdrop-blur [scrollbar-width:thin] dark:border-white/10 dark:bg-[rgba(13,17,24,0.88)] dark:text-slate-300">
                {nodeLegendItems.map((item) => (
                  <span key={item.kind} className="inline-flex shrink-0 items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>
                ))}
                <span className="inline-flex shrink-0 items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />Selected</span>
              </div>

              </div>
              {selectedEdge && (
                <aside className="z-30 flex h-[520px] w-full shrink-0 flex-col overflow-hidden border-t border-slate-200 bg-background text-foreground lg:h-auto lg:w-[360px] lg:border-l lg:border-t-0 xl:w-[400px] dark:border-white/10">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <GitBranch className="h-4 w-4 text-primary" />
                        Relation Inspector
                      </div>
                      <h3 className="mt-3 break-words text-base font-semibold [overflow-wrap:anywhere]">
                        {metadataLabel(selectedEdge.label || selectedEdge.kind)}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Directed source → target{selectedEdgeCount > 1 ? ` · ${formatNumber(selectedEdgeCount)} relations in this bundle` : ""}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Close relation inspector"
                      onClick={() => setSelectedEdge(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <ScrollArea className="min-h-0 flex-1">
                    <div className="space-y-4 p-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{selectedEdge.kind}</Badge>
                        <Badge variant="outline">{selectedEdge.label || selectedEdge.kind}</Badge>
                        {selectedEdge.metadata?.origin && (
                          <Badge variant="outline">{String(selectedEdge.metadata.origin)}</Badge>
                        )}
                        {selectedEdgePlugins.map((plugin) => (
                          <Badge key={plugin} variant="secondary">{plugin}</Badge>
                        ))}
                      </div>

                      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                        <button
                          type="button"
                          className="w-full rounded-md border border-slate-200 bg-white p-3 text-left hover:border-primary/50 dark:border-white/10 dark:bg-black/20"
                          onClick={() => inspectGraphNode(selectedEdgeSource)}
                        >
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Source</div>
                          <div className="mt-1 break-words font-medium [overflow-wrap:anywhere]">
                            {compactNodeTitle(selectedEdgeSource)}
                          </div>
                          <div className="mt-1 break-words text-xs text-slate-500 [overflow-wrap:anywhere]">
                            {selectedEdgeSource?.path || selectedEdge.source}
                          </div>
                        </button>
                        <div className="flex items-center justify-center gap-2 text-xs font-medium text-primary">
                          <ArrowRight className="h-4 w-4" />
                          {selectedEdge.label || metadataLabel(selectedEdge.kind)}
                        </div>
                        <button
                          type="button"
                          className="w-full rounded-md border border-slate-200 bg-white p-3 text-left hover:border-primary/50 dark:border-white/10 dark:bg-black/20"
                          onClick={() => inspectGraphNode(selectedEdgeTarget)}
                        >
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Target</div>
                          <div className="mt-1 break-words font-medium [overflow-wrap:anywhere]">
                            {compactNodeTitle(selectedEdgeTarget)}
                          </div>
                          <div className="mt-1 break-words text-xs text-slate-500 [overflow-wrap:anywhere]">
                            {selectedEdgeTarget?.path || selectedEdge.target}
                          </div>
                        </button>
                      </div>

                      {selectedEdge.relation && (
                        <div className="space-y-2 rounded-md border border-cyan-200 bg-cyan-50/50 p-3 text-xs dark:border-cyan-400/20 dark:bg-cyan-500/[0.05]">
                          <div><span className="text-slate-500">Declared in: </span>{selectedEdge.relation.path}:{selectedEdge.relation.span.start_line}</div>
                          <div className="break-words [overflow-wrap:anywhere]"><span className="text-slate-500">Source key: </span>{selectedEdge.relation.source_key}</div>
                          <div className="break-words [overflow-wrap:anywhere]"><span className="text-slate-500">Target key: </span>{selectedEdge.relation.target_key || "unresolved"}</div>
                          {selectedEdge.relation.evidence && (
                            <div><span className="text-slate-500">Evidence: </span>{selectedEdge.relation.evidence}</div>
                          )}
                        </div>
                      )}

                      {selectedEdgeCount > 1 && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/[0.06] dark:text-amber-100">
                          This file-map edge combines {formatNumber(selectedEdgeCount)} exact symbol relations with the same direction and type. Open the AST-symbol view to inspect each edge individually.
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => focusNode(selectedEdge.source)}>
                          <ArrowLeft className="h-4 w-4" /> Source
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => focusNode(selectedEdge.target)}>
                          Target <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                      {graphView === "files" && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button variant="outline" onClick={() => openRelationBrowser(selectedEdge)}>
                            <GitBranch className="h-4 w-4" />
                            Browse relation bundles
                          </Button>
                          <Button onClick={() => inspectGraphNode(selectedEdgeSource)}>
                            <Waypoints className="h-4 w-4" />
                            Inspect source
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </aside>
              )}

              {selectedNode && (
                <aside className="z-30 flex h-[520px] w-full shrink-0 flex-col overflow-hidden border-t border-slate-200 bg-background text-foreground lg:h-auto lg:w-[360px] lg:border-l lg:border-t-0 xl:w-[400px] dark:border-white/10">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Split className="h-4 w-4 text-primary" />
                        <div className="text-sm font-medium">
                          {selectedNode.recordType === "file_aggregate" ? "File Inspector" : "Point Inspector"}
                        </div>
                      </div>
                      <h3 className="mt-3 break-words text-base font-semibold [overflow-wrap:anywhere]">
                        {selectedNode.title}
                      </h3>
                      <p className="mt-1 break-words text-xs text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                        {nodeSubtitle(selectedNode)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Close point inspector"
                      onClick={() => { ++pointRequestRef.current; setSelectedNode(null); }}
                      className="shrink-0 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <ScrollArea className="min-h-0 flex-1">
                    <div className="space-y-4 p-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{selectedNode.kind}</Badge>
                        {selectedNode.recordType && (
                          <Badge variant="outline">{selectedNode.recordType}</Badge>
                        )}
                      </div>

                      <div className="grid min-w-0 grid-cols-2 gap-2 text-xs">
                        <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="text-slate-500 dark:text-slate-400">Branch</div>
                          <div className="mt-1 break-words font-medium [overflow-wrap:anywhere]">
                            {selectedNode.branch || "-"}
                          </div>
                        </div>
                        <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="text-slate-500 dark:text-slate-400">Language</div>
                          <div className="mt-1 break-words font-medium [overflow-wrap:anywhere]">
                            {selectedNode.language || selectedNode.filetype || "-"}
                          </div>
                        </div>
                        <div className="col-span-2 min-w-0 rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="text-slate-500 dark:text-slate-400">File</div>
                          <div className="mt-1 max-w-full break-words font-medium [overflow-wrap:anywhere]">
                            {selectedNode.path || "-"}
                          </div>
                        </div>
                        <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="text-slate-500 dark:text-slate-400">Lines</div>
                          <div className="mt-1 break-words font-medium [overflow-wrap:anywhere]">
                            {selectedNode.startLine || "-"}
                            {selectedNode.endLine ? `-${selectedNode.endLine}` : ""}
                          </div>
                        </div>
                        <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.04]">
                          <div className="text-slate-500 dark:text-slate-400">Record key</div>
                          <div className="mt-1 break-words font-medium [overflow-wrap:anywhere]">
                            {selectedFile?.key || selectedEntity?.key || selectedRelationRecord?.key || selectedNode.id}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-w-[120px] flex-1 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/10"
                          onClick={() => setNeighborhoodRoot(selectedNode.id)}
                        >
                          <MousePointer2 className="h-4 w-4" />
                          Show neighborhood
                        </Button>
                        {(selectedNode.path || selectedNode.entity) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[120px] flex-1 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/10"
                          onClick={filterToNode}
                        >
                            {selectedNode.recordType === "file_aggregate" ? (
                              <Waypoints className="h-4 w-4" />
                            ) : (
                              <Filter className="h-4 w-4" />
                            )}
                            {selectedNode.recordType === "file_aggregate" ? "Open AST" : "Filter"}
                          </Button>
                        )}
                        {!selectedNode.virtual && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-w-[120px] flex-1 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/10"
                            onClick={() => loadPoint(selectedNode, true)}
                            disabled={loadingNode}
                          >
                            {loadingNode ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Network className="h-4 w-4" />
                            )}
                            Expand connections
                          </Button>
                        )}
                      </div>

                      {expansionMessage && (
                        <p role="status" className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">{expansionMessage}</p>
                      )}
                      {selectedNode.virtual && selectedNode.recordType !== "file_aggregate" && (
                        <p className="text-xs text-muted-foreground">Unresolved endpoint. No indexed source record is available to expand.</p>
                      )}
                      {selectedNode.signature && (
                        <div>
                          <div className="mb-2 text-sm font-medium">Signature</div>
                          <pre className="max-h-40 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-800 [overflow-wrap:anywhere] dark:border-white/10 dark:bg-black/30 dark:text-slate-200">
                            {selectedNode.signature}
                          </pre>
                        </div>
                      )}

                      {!selectedEntity && (selectedNode.symbolNames || []).length > 0 && (
                        <div>
                          <div className="mb-2 text-sm font-medium">Symbols</div>
                          <div className="flex flex-wrap gap-1.5">
                            {(selectedNode.symbolNames || []).slice(0, 24).map((name) => (
                              <Badge
                                key={name}
                                variant="secondary"
                                className="max-w-full cursor-pointer break-words [overflow-wrap:anywhere]"
                                onClick={() =>
                                  applyFilters({
                                    ...filtersRef.current,
                                    textQuery: name,
                                  })
                                }
                              >
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedCanonicalRecord && (
                        <div>
                          <div className="mb-2 text-sm font-medium">Canonical structural record</div>
                          <div className="space-y-3 rounded-md border border-cyan-200 bg-cyan-50/50 p-3 text-xs dark:border-cyan-400/20 dark:bg-cyan-500/[0.05]">
                            {selectedEntity && (
                              <div className="space-y-1">
                                <div><span className="text-slate-500 dark:text-slate-400">Name: </span>{selectedEntity.name || "-"}</div>
                                <div className="break-words [overflow-wrap:anywhere]"><span className="text-slate-500 dark:text-slate-400">Qualified name: </span>{selectedEntity.qualified_name || "-"}</div>
                                <div><span className="text-slate-500 dark:text-slate-400">AST node: </span>{selectedEntity.node_type}</div>
                                {selectedEntity.parent_key && (
                                  <div className="break-words [overflow-wrap:anywhere]"><span className="text-slate-500 dark:text-slate-400">Parent key: </span>{selectedEntity.parent_key}</div>
                                )}
                              </div>
                            )}
                            {selectedFile && (
                              <div className="space-y-1">
                                <div><span className="text-slate-500 dark:text-slate-400">Parser status: </span>{selectedFile.status}</div>
                                <div><span className="text-slate-500 dark:text-slate-400">Plugin: </span>{selectedFile.plugin_id || "unsupported"}</div>
                                <div><span className="text-slate-500 dark:text-slate-400">Language: </span>{selectedFile.language_id || "unknown"}</div>
                              </div>
                            )}
                            {selectedRelationRecord && (
                              <div className="space-y-1">
                                <div className="break-words [overflow-wrap:anywhere]"><span className="text-slate-500 dark:text-slate-400">Source key: </span>{selectedRelationRecord.source_key}</div>
                                <div className="break-words [overflow-wrap:anywhere]"><span className="text-slate-500 dark:text-slate-400">Target: </span>{selectedRelationRecord.target}</div>
                                <div className="break-words [overflow-wrap:anywhere]"><span className="text-slate-500 dark:text-slate-400">Target key: </span>{selectedRelationRecord.target_key || "unresolved"}</div>
                                {selectedRelationRecord.evidence && (
                                  <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]"><span className="text-slate-500 dark:text-slate-400">Evidence: </span>{selectedRelationRecord.evidence}</div>
                                )}
                              </div>
                            )}
                            {selectedSpan && (
                              <div>
                                <span className="text-slate-500 dark:text-slate-400">Exact span: </span>
                                bytes {selectedSpan.start_byte}-{selectedSpan.end_byte}, lines {selectedSpan.start_line}:{selectedSpan.start_column}-{selectedSpan.end_line}:{selectedSpan.end_column}
                              </div>
                            )}
                            {selectedStructuralAttributes.length > 0 && (
                              <div className="flex min-w-0 flex-wrap gap-1">
                                {selectedStructuralAttributes.slice(0, 24).map((attribute) => (
                                  <Badge key={`${attribute.name}:${attribute.value}`} variant="outline" className="max-w-full break-words [overflow-wrap:anywhere]">
                                    {metadataLabel(attribute.name)}: {attribute.value}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {selectedFile?.diagnostics && selectedFile.diagnostics.length > 0 && (
                              <div className="space-y-1">
                                {selectedFile.diagnostics.map((diagnostic) => (
                                  <div key={`${diagnostic.code}:${diagnostic.message}`} className="break-words [overflow-wrap:anywhere]">
                                    <span className="font-medium">{diagnostic.code}:</span> {diagnostic.message}
                                  </div>
                                ))}
                              </div>
                            )}
                            {selectedCaptures.length > 0 && (
                              <details>
                                <summary className="cursor-pointer font-medium">
                                  {selectedCaptures.length} Tree-sitter capture{selectedCaptures.length === 1 ? "" : "s"}
                                </summary>
                                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-white/70 p-2 dark:bg-black/20">
                                  {JSON.stringify(selectedCaptures, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedRelations.length > 0 && (
                        <div>
                          <div className="mb-2 text-sm font-medium">Visible graph connections</div>
                          <div className="space-y-1.5">
                            {selectedRelations.map((edge) => {
                              const outgoing = edge.source === selectedNode.id;
                              const otherNode = nodeById.get(outgoing ? edge.target : edge.source);
                              const style = edgeVisualStyle(edge);
                              return (
                                <div
                                  key={edge.id}
                                  className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-white/[0.04]"
                                >
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span
                                      className="h-2 w-5 shrink-0 rounded-full"
                                      style={{ backgroundColor: style.color }}
                                    />
                                    <Badge variant="outline" className="shrink-0 border-slate-300 text-[10px] dark:border-white/20">
                                      {style.label}
                                    </Badge>
                                    <button type="button" onClick={() => inspectGraphNode(otherNode)} className="min-w-0 break-words text-left text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-primary [overflow-wrap:anywhere] dark:text-slate-300">
                                      {outgoing ? "to" : "from"} {compactNodeTitle(otherNode)}
                                    </button>
                                  </div>
                                  {(edge.tokens || []).length > 0 && (
                                    <div className="mt-1 min-w-0 break-words pl-7 text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                                      {(edge.tokens || []).slice(0, 4).join(", ")}
                                    </div>
                                  )}
                                  {edge.relation?.evidence && (
                                    <div className="mt-1 min-w-0 whitespace-pre-wrap break-words pl-7 text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                                      {edge.relation.evidence}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
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
                          <div className="mb-2 text-sm font-medium">Additional metadata</div>
                          <div className="space-y-1.5">
                            {selectedMetadata.slice(0, 42).map(([key, value]) => (
                              <div
                                key={key}
                                className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs dark:border-white/10 dark:bg-white/[0.04]"
                              >
                                <div className="break-words font-medium text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">{key}</div>
                                <div className="mt-1 whitespace-pre-wrap break-words text-slate-800 [overflow-wrap:anywhere] dark:text-slate-200">
                                  {metricValue(value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedProvenance.length > 0 && (
                        <details className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/[0.04]">
                          <summary className="cursor-pointer text-sm font-medium">
                            Index provenance
                          </summary>
                          <div className="mt-2 space-y-2">
                            {selectedProvenance.map(([label, value]) => (
                              <div key={String(label)} className="min-w-0">
                                <div className="text-slate-500 dark:text-slate-400">{String(label)}</div>
                                <div className="mt-0.5 whitespace-pre-wrap break-words font-mono text-slate-700 [overflow-wrap:anywhere] dark:text-slate-200">
                                  {metricValue(value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
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
