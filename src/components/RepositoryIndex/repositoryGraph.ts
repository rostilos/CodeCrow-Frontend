import dagre from "dagre";
import type { RepositoryIndexNode, RepositoryIndexEdge } from "../../api_service/project/projectService";

export function relationFacet(edge: RepositoryIndexEdge) {
  return (edge.label || edge.kind || "related").trim().toLocaleLowerCase();
}

function hashIndex(value: string, modulo: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash) % modulo;
}

// The branch selects the generation; search filters only select starting points.
export function pointFilters(node: RepositoryIndexNode, branches?: string[]) {
  return { branches: node.branch ? [node.branch] : branches || [] };
}

export function traceDistances(nodes: RepositoryIndexNode[], edges: RepositoryIndexEdge[], start: string | null, depth: number) {
  const terminalIds = new Set(nodes.filter(node => node.recordType === "external_aggregate").map(node => node.id));
  const adjacency = new Map(nodes.map(node => [node.id, new Set<string>()]));
  for (const edge of edges) {
    if (!adjacency.has(edge.source) || !adjacency.has(edge.target)) continue;
    adjacency.get(edge.source)!.add(edge.target);
    adjacency.get(edge.target)!.add(edge.source);
  }
  const distances = new Map<string, number>();
  if (!start || !adjacency.has(start)) return distances;
  distances.set(start, 0);
  const queue = [start];
  for (let i = 0; i < queue.length; i += 1) {
    const distance = distances.get(queue[i])!;
    if (distance >= depth || terminalIds.has(queue[i])) continue;
    for (const next of adjacency.get(queue[i])!) {
      if (distances.has(next)) continue;
      distances.set(next, distance + 1);
      queue.push(next);
    }
  }
  return distances;
}

export function directedLayout(nodes: RepositoryIndexNode[], edges: RepositoryIndexEdge[]) {
  const graph = new dagre.graphlib.Graph({ multigraph: true });
  graph.setGraph({ rankdir: "LR", ranksep: 100, nodesep: 36, marginx: 30, marginy: 30 });
  graph.setDefaultEdgeLabel(() => ({}));
  nodes.forEach(node => graph.setNode(node.id, { width: 120, height: 38 }));
  edges.forEach(edge => {
    if (edge.source !== edge.target && graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.setEdge(edge.source, edge.target, {}, edge.id);
    }
  });
  dagre.layout(graph);
  return new Map(nodes.map(node => {
    const position = graph.node(node.id);
    return [node.id, { x: position.x, y: -position.y }];
  }));
}

function topLevelGroup(path?: string | null) {
  if (!path) return "External";
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "Repository root";
  return parts.slice(0, Math.min(parts.length - 1, 2)).join("/");
}

function pathNodeId(path: string) {
  return `file-map:${path}`;
}

type FileMapResult = {
  nodes: RepositoryIndexNode[];
  edges: RepositoryIndexEdge[];
  internalRelations: number;
};

/** Collapse raw symbols into an inspectable, rendering-only file map. */
export function buildFileMap(
  nodes: RepositoryIndexNode[],
  edges: RepositoryIndexEdge[],
): FileMapResult {
  if (nodes.some(node => node.recordType === "file_aggregate")) {
    return { nodes, edges, internalRelations: nodes.reduce((sum, node) => sum + Number(node.metadata?.internal_relations || 0), 0) };
  }
  const sourceNodeById = new Map(nodes.map((node) => [node.id, node]));
  const nodesByPath = new Map<string, RepositoryIndexNode[]>();
  const externalNodes = new Map<string, RepositoryIndexNode>();

  nodes.forEach((node) => {
    if (!node.path) {
      externalNodes.set(node.id, node);
      return;
    }
    const group = nodesByPath.get(node.path);
    if (group) group.push(node);
    else nodesByPath.set(node.path, [node]);
  });

  const relationCountsByPath = new Map<string, number>();
  edges.forEach((edge) => {
    const sourcePath = sourceNodeById.get(edge.source)?.path;
    const targetPath = sourceNodeById.get(edge.target)?.path;
    if (sourcePath) relationCountsByPath.set(sourcePath, (relationCountsByPath.get(sourcePath) || 0) + 1);
    if (targetPath && targetPath !== sourcePath) {
      relationCountsByPath.set(targetPath, (relationCountsByPath.get(targetPath) || 0) + 1);
    }
  });

  const fileNodes = Array.from(nodesByPath.entries()).map(([path, members]) => {
    const representative =
      members.find((node) => node.kind === "file" || node.recordType === "structural_file") ||
      members[0];
    const languages = Array.from(new Set(members.map((node) => node.language).filter(Boolean)));
    const memberKinds = new Map<string, number>();
    members.forEach((node) => memberKinds.set(node.kind, (memberKinds.get(node.kind) || 0) + 1));
    return {
      ...representative,
      id: pathNodeId(path),
      title: path.split("/").filter(Boolean).at(-1) || path,
      kind: "file",
      group: topLevelGroup(path),
      path,
      language: languages.join(", ") || representative.language,
      primaryName: path,
      symbolNames: members.flatMap((node) => node.symbolNames || []).slice(0, 80),
      preview: `${members.length} indexed structural records · ${relationCountsByPath.get(path) || 0} loaded relations`,
      virtual: true,
      recordType: "file_aggregate",
      metadata: {
        ...(representative.metadata || {}),
        aggregate_record_count: members.length,
        aggregate_relation_count: relationCountsByPath.get(path) || 0,
        aggregate_kinds: Object.fromEntries(Array.from(memberKinds.entries()).sort()),
      },
      file: null,
      entity: null,
      relation: null,
    } satisfies RepositoryIndexNode;
  });

  const endpointId = (nodeId: string) => {
    const node = sourceNodeById.get(nodeId);
    return node?.path ? pathNodeId(node.path) : nodeId;
  };
  const bundles = new Map<string, RepositoryIndexEdge & { count: number; relationIds: string[] }>();
  let internalRelations = 0;

  edges.forEach((edge) => {
    const source = endpointId(edge.source);
    const target = endpointId(edge.target);
    if (source === target) {
      internalRelations += 1;
      return;
    }
    const facet = relationFacet(edge);
    const key = `${source}\0${target}\0${facet}`;
    const current = bundles.get(key);
    if (current) {
      current.count += 1;
      current.weight = current.count;
      if (current.relationIds.length < 80) current.relationIds.push(edge.id);
      current.tokens = Array.from(new Set([...(current.tokens || []), ...(edge.tokens || [])])).slice(0, 12);
      return;
    }
    bundles.set(key, {
      ...edge,
      id: `file-edge:${hashIndex(key, 2147483647)}:${bundles.size}`,
      source,
      target,
      label: edge.label || edge.kind,
      weight: 1,
      metadata: { ...(edge.metadata || {}), aggregate: true },
      relation: undefined,
      count: 1,
      relationIds: [edge.id],
    });
  });

  const aggregateEdges = Array.from(bundles.values()).map(({ count, relationIds, ...edge }) => ({
    ...edge,
    weight: count,
    metadata: {
      ...(edge.metadata || {}),
      aggregate: true,
      aggregateCount: count,
      relationIds: relationIds.slice(0, 80),
    },
  }));
  const usedExternalIds = new Set(aggregateEdges.flatMap((edge) => [edge.source, edge.target]));
  const renderedExternalNodes = Array.from(externalNodes.values()).filter((node) => usedExternalIds.has(node.id));
  return {
    nodes: [...fileNodes, ...renderedExternalNodes],
    edges: aggregateEdges,
    internalRelations,
  };
}

/** Parallel types and reciprocal directions must not cover one another. */
export function edgeCurvatures(edges: RepositoryIndexEdge[]) {
  const pairs = new Map<string, RepositoryIndexEdge[]>();
  for (const edge of edges) {
    const key = JSON.stringify([edge.source, edge.target].sort());
    const group = pairs.get(key) || [];
    group.push(edge);
    pairs.set(key, group);
  }
  const curvatures = new Map<string, number>();
  for (const pair of pairs.values()) {
    const reciprocal = pair.some(edge => edge.source !== pair[0].source);
    for (const source of new Set(pair.map(edge => edge.source))) {
      const direction = pair.filter(edge => edge.source === source).sort((a, b) => a.id.localeCompare(b.id));
      direction.forEach((edge, index) => {
        const offset = reciprocal ? index + 1 : index - (direction.length - 1) / 2;
        curvatures.set(edge.id, offset * Math.min(0.24, 0.8 / direction.length));
      });
    }
  }
  return curvatures;
}
