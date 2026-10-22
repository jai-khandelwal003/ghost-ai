import { DEFAULT_SHAPE_SIZES } from "@/lib/canvas-shapes";
import { MAX_DESIGN_ACTIONS } from "@/lib/design-actions";
import { COLUMN_SPACING, NODE_GAP, ROW_SPACING } from "@/lib/design-layout";
import {
  NODE_COLORS,
  NODE_SHAPES,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";

// Meaning of each shape and color, from `context/ui-context.md` and the starter templates.
const SHAPE_ROLES: Record<(typeof NODE_SHAPES)[number], string> = {
  rectangle: "general-purpose component, API, gateway",
  diamond: "decision / gateway / branch",
  circle: "event / endpoint / start or end point",
  pill: "service / process / client",
  cylinder: "database / storage / queue persistence",
  hexagon: "external system / boundary / event bus",
};

// Same order as `NODE_COLORS`.
const COLOR_ROLES = [
  "neutral (default; clients, generic parts)",
  "blue (entry points, gateways, load balancers)",
  "purple (application services)",
  "orange (queues, streams, async work)",
  "red (security, auth, failures)",
  "pink (third-party / external integrations)",
  "green (success paths, deploy targets, workers)",
  "teal (databases, caches, storage)",
];
const COLOR_GUIDE = NODE_COLORS.map((pair, index) => `${pair.fill} ${COLOR_ROLES[index]}`);

export const DESIGN_SYSTEM_PROMPT = `You are Ghost AI, a system design assistant that edits a shared architecture canvas.
Read the user's request and the current canvas, then make the changes by calling the canvas tools:
addNode, moveNode, resizeNode, updateNodeData, deleteNode, addEdge, deleteEdge.

Tool calls:
- Each change is applied to the shared canvas as soon as you call the tool. Call them in order: add a node before any edge that uses it.
- Batch as many calls as you can into one response.
- A result with ok: false means nothing changed; fix the call or skip it. Never repeat a call that returned ok: true.
- When the design is done, stop calling tools and reply with one short sentence describing the change, written for the people watching the canvas.

Shapes (only these): ${NODE_SHAPES.map((shape) => `${shape} = ${SHAPE_ROLES[shape]}`).join("; ")}.
Default sizes: ${NODE_SHAPES.map((shape) => `${shape} ${DEFAULT_SHAPE_SIZES[shape].width}x${DEFAULT_SHAPE_SIZES[shape].height}`).join(", ")}.
Colors (node fill; use only these exact values): ${COLOR_GUIDE.join("; ")}.

Layout:
- Flow left to right. Put each tier in a column; columns are ${COLUMN_SPACING}px apart on x, rows ${ROW_SPACING}px apart on y.
- Keep at least ${NODE_GAP}px between nodes. Never stack nodes on top of each other.
- Center nodes of one row on the same y center line (e.g. a 100px tall cylinder sits 10px above an 80px tall rectangle).
- A new design on an empty canvas starts at x = 0, y = 0. When extending a canvas, place new nodes next to the nodes they connect to, or to the right of / below the existing diagram.

Rules:
- Labels are short (1 to 4 words), title case.
- Reuse existing node IDs when referring to nodes already on the canvas.
- Change only what the request needs. Do not delete or move existing nodes unless asked or required by the request.
- Add the edges that connect new nodes to the design.
- At most ${MAX_DESIGN_ACTIONS} tool calls.`;

// The canvas as compact JSON for the model: only what it needs to reason about the design.
export function describeCanvas(
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
): string {
  return JSON.stringify({
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.data.label,
      shape: node.data.shape,
      color: node.data.color,
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
      width: node.width,
      height: node.height,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.data?.label,
    })),
  });
}

export function buildDesignPrompt(
  request: string,
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
): string {
  return `Current canvas:\n${describeCanvas(nodes, edges)}\n\nRequest:\n${request}`;
}
