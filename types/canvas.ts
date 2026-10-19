import type { Edge, Node } from "@xyflow/react";

// Fill / text pairs from `context/ui-context.md`. The first entry is the default.
export const NODE_COLORS = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
] as const;

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

// A node stores the fill; the text color is looked up from `NODE_COLORS`.
export type NodeColor = (typeof NODE_COLORS)[number]["fill"];
export type NodeShape = (typeof NODE_SHAPES)[number];

export const DEFAULT_NODE_COLOR: NodeColor = NODE_COLORS[0].fill;
export const DEFAULT_NODE_SHAPE: NodeShape = "rectangle";

export const CANVAS_NODE_TYPE = "canvasNode";
export const CANVAS_EDGE_TYPE = "canvasEdge";

// Type aliases, not interfaces: React Flow requires node and edge data to be assignable to
// `Record<string, unknown>`, which an interface is not.
export type CanvasNodeData = {
  color: NodeColor;
  shape: NodeShape;
  label: string;
};

export type CanvasEdgeData = {
  label?: string;
};

export type CanvasNode = Node<CanvasNodeData, typeof CANVAS_NODE_TYPE>;
export type CanvasEdge = Edge<CanvasEdgeData, typeof CANVAS_EDGE_TYPE>;

// The saved canvas: the JSON stored in Vercel Blob and sent to / from `/api/projects/[projectId]/canvas`.
export type CanvasSnapshot = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};
