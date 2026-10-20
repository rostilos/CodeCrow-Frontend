import Graph from "graphology";
import dagre from "dagre";
import louvain from "graphology-communities-louvain";
import forceAtlas2 from "graphology-layout-forceatlas2";

export type LayoutNode = { id: string };
export type LayoutEdge = { source: string; target: string };

/** Place individual nodes by connectivity; paths and folder names are not inputs. */
export function dependencyLayout(nodes: LayoutNode[], edges: LayoutEdge[]) {
  const graph = new Graph({ type: "undirected" });
  [...nodes].sort((a, b) => a.id.localeCompare(b.id)).forEach(node => graph.addNode(node.id));
  const orderedEdges = [...edges].sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target));
  for (const edge of orderedEdges) {
    if (edge.source !== edge.target && graph.hasNode(edge.source) && graph.hasNode(edge.target) && !graph.hasEdge(edge.source, edge.target)) {
      graph.addEdge(edge.source, edge.target);
    }
  }
  // Parallel relation types affect rendering, not the strength of a layout spring.
  const communities = louvain(graph, { randomWalk: false, getEdgeWeight: null });
  const groups = new Map<number, string[]>();
  graph.forEachNode(id => {
    const community = graph.degree(id) ? communities[id] : -1;
    const group = groups.get(community) || [];
    group.push(id);
    groups.set(community, group);
  });
  const localPositions = new Map<string, { x: number; y: number }>();
  const arrangement = new dagre.graphlib.Graph();
  arrangement.setGraph({ rankdir: "LR", ranksep: 100, nodesep: 80, marginx: 30, marginy: 30 });
  arrangement.setDefaultEdgeLabel(() => ({}));
  for (const [community, members] of groups) {
    const local = new Graph({ type: "undirected" });
    members.forEach((id, index) => {
      const radius = Math.sqrt(index + 1) * 12;
      local.addNode(id, { x: Math.cos(index * 2.399963) * radius, y: Math.sin(index * 2.399963) * radius, size: 3 });
    });
    for (const id of members) graph.forEachNeighbor(id, neighbor => {
      if (local.hasNode(neighbor) && !local.hasEdge(id, neighbor)) local.addEdge(id, neighbor);
    });
    if (local.size) forceAtlas2.assign(local, {
      iterations: 180,
      settings: { barnesHutOptimize: true, scalingRatio: 10, gravity: 1, slowDown: 2, adjustSizes: true },
    });
    const points = local.mapNodes((_id, attributes) => attributes as { x: number; y: number });
    const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
    const span = Math.max(maxX - minX, maxY - minY, 1);
    const diameter = Math.max(50, Math.sqrt(members.length) * 38);
    for (const id of members) {
      const point = local.getNodeAttributes(id);
      localPositions.set(id, { x: (point.x - (maxX + minX) / 2) / span * diameter, y: (point.y - (maxY + minY) / 2) / span * diameter });
    }
    arrangement.setNode(String(community), { width: diameter + 40, height: diameter + 40 });
  }
  for (const edge of orderedEdges) {
    const source = communities[edge.source], target = communities[edge.target];
    if (source !== target && arrangement.hasNode(String(source)) && arrangement.hasNode(String(target))) {
      arrangement.setEdge(String(source), String(target));
    }
  }
  dagre.layout(arrangement);
  const positions = new Map<string, { x: number; y: number }>();
  for (const [community, members] of groups) {
    const center = arrangement.node(String(community));
    for (const id of members) {
      const point = localPositions.get(id)!;
      positions.set(id, { x: center.x + point.x, y: -center.y + point.y });
    }
  }
  return positions;
}
