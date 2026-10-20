import { dependencyLayout, type LayoutNode, type LayoutEdge } from "./repositoryLayout";

self.onmessage = ({ data }: MessageEvent<{ nodes: LayoutNode[]; edges: LayoutEdge[] }>) => {
  self.postMessage(dependencyLayout(data.nodes, data.edges));
};
