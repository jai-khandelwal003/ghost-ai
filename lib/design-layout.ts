import type { MutableFlow } from "@liveblocks/react-flow/node";

import {
  DEFAULT_SHAPE_SIZES,
  MIN_NODE_HEIGHT,
  MIN_NODE_WIDTH,
} from "@/lib/canvas-shapes";
import type { DesignAction } from "@/lib/design-actions";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas";

// Layout rules, matching the starter templates: left-to-right flow, columns 240px apart,
// rows 140px apart. Positions and sizes snap to a 10px grid (fine enough to keep shapes of
// different heights centered on one row), and nodes keep at least `NODE_GAP` between them.
export const LAYOUT_GRID = 10;
export const COLUMN_SPACING = 240;
export const ROW_SPACING = 140;
export const NODE_GAP = 40;
const MAX_NODE_WIDTH = 480;
const MAX_NODE_HEIGHT = 320;
// How far a node may be pushed along its row looking for free space.
const MAX_PLACEMENT_STEPS = 50;

type Flow = MutableFlow<CanvasNode, CanvasEdge>;
type Side = "top" | "right" | "bottom" | "left";

export interface Point {
  x: number;
  y: number;
}

interface Rect extends Point {
  width: number;
  height: number;
}

// State shared by every action of one run.
export interface DesignRunContext {
  // Prefix for the IDs of nodes and edges this run creates (unique per run).
  idPrefix: string;
  // Model node ID → canvas node ID, for nodes added in this run.
  nodeIds: Map<string, string>;
}

// Applies one action inside a `mutateFlow` callback. Returns the point the AI cursor should
// point at (canvas coordinates), or `null` when the action did nothing.
export function applyDesignAction(
  flow: Flow,
  action: DesignAction,
  context: DesignRunContext,
): Point | null {
  const resolve = (id: string) => context.nodeIds.get(id) ?? id;

  switch (action.type) {
    case "addNode": {
      const id = uniqueNodeId(flow, `${context.idPrefix}-${slug(action.id)}`);
      const defaults = DEFAULT_SHAPE_SIZES[action.shape];
      const width = clampSize(action.width ?? defaults.width, MIN_NODE_WIDTH, MAX_NODE_WIDTH);
      const height = clampSize(action.height ?? defaults.height, MIN_NODE_HEIGHT, MAX_NODE_HEIGHT);
      const position = findFreePosition(
        { x: snap(action.x), y: snap(action.y), width, height },
        flow.nodes,
      );
      context.nodeIds.set(action.id, id);
      flow.addNode({
        id,
        type: CANVAS_NODE_TYPE,
        position,
        width,
        height,
        data: { label: action.label, color: action.color, shape: action.shape },
      });
      return center({ ...position, width, height });
    }

    case "moveNode": {
      const node = flow.getNode(resolve(action.id));
      if (!node) return null;
      const rect = nodeRect(node);
      const position = findFreePosition(
        { ...rect, x: snap(action.x), y: snap(action.y) },
        flow.nodes.filter((other) => other.id !== node.id),
      );
      flow.updateNode(node.id, { position });
      return center({ ...rect, ...position });
    }

    case "resizeNode": {
      const node = flow.getNode(resolve(action.id));
      if (!node) return null;
      const width = clampSize(action.width, MIN_NODE_WIDTH, MAX_NODE_WIDTH);
      const height = clampSize(action.height, MIN_NODE_HEIGHT, MAX_NODE_HEIGHT);
      flow.updateNode(node.id, { width, height });
      return center({ ...node.position, width, height });
    }

    case "updateNodeData": {
      const node = flow.getNode(resolve(action.id));
      if (!node) return null;
      const { label, shape, color } = action;
      flow.updateNodeData(node.id, {
        ...(label !== undefined && { label }),
        ...(shape && { shape }),
        ...(color && { color }),
      });
      return center(nodeRect(node));
    }

    case "deleteNode": {
      const node = flow.getNode(resolve(action.id));
      if (!node) return null;
      // Same as deleting on the canvas: edges attached to the node go with it.
      flow.removeEdges(
        flow.edges
          .filter((edge) => edge.source === node.id || edge.target === node.id)
          .map((edge) => edge.id),
      );
      flow.removeNode(node.id);
      return center(nodeRect(node));
    }

    case "addEdge": {
      const source = flow.getNode(resolve(action.source));
      const target = flow.getNode(resolve(action.target));
      if (!source || !target || source.id === target.id) return null;
      const exists = flow.edges.some(
        (edge) => edge.source === source.id && edge.target === target.id,
      );
      if (exists) return null;

      const sourceRect = nodeRect(source);
      const targetRect = nodeRect(target);
      const [sourceHandle, targetHandle] = pickHandles(sourceRect, targetRect);
      // Marker and stroke come from the canvas's `defaultEdgeOptions`, as for templates.
      flow.addEdge({
        id: `${context.idPrefix}-${source.id}-${target.id}`,
        type: CANVAS_EDGE_TYPE,
        source: source.id,
        target: target.id,
        sourceHandle,
        targetHandle,
        data: action.label ? { label: action.label } : {},
      });
      return midpoint(center(sourceRect), center(targetRect));
    }

    case "deleteEdge": {
      const edge = flow.getEdge(action.id);
      if (!edge) return null;
      flow.removeEdge(edge.id);
      const source = flow.getNode(edge.source);
      const target = flow.getNode(edge.target);
      return source && target
        ? midpoint(center(nodeRect(source)), center(nodeRect(target)))
        : null;
    }
  }
}

function nodeRect(node: CanvasNode): Rect {
  const defaults = DEFAULT_SHAPE_SIZES[node.data.shape] ?? DEFAULT_SHAPE_SIZES.rectangle;
  return {
    x: node.position.x,
    y: node.position.y,
    width: node.width ?? node.measured?.width ?? defaults.width,
    height: node.height ?? node.measured?.height ?? defaults.height,
  };
}

// Moves the node right along its row, past whatever it overlaps, until it has `NODE_GAP`
// of free space on every side.
function findFreePosition(rect: Rect, others: readonly CanvasNode[]): Point {
  const obstacles = others.map(nodeRect);
  let { x } = rect;
  for (let step = 0; step < MAX_PLACEMENT_STEPS; step += 1) {
    const hit = obstacles.find((other) => overlaps({ ...rect, x }, other));
    if (!hit) break;
    x = snapUp(hit.x + hit.width + NODE_GAP);
  }
  return { x, y: rect.y };
}

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width + NODE_GAP &&
    b.x < a.x + a.width + NODE_GAP &&
    a.y < b.y + b.height + NODE_GAP &&
    b.y < a.y + a.height + NODE_GAP
  );
}

// Connects the sides that face each other (handle IDs match `CanvasNodeView`).
function pickHandles(source: Rect, target: Rect): [Side, Side] {
  const from = center(source);
  const to = center(target);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? ["right", "left"] : ["left", "right"];
  }
  return dy >= 0 ? ["bottom", "top"] : ["top", "bottom"];
}

function center(rect: Rect): Point {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function snap(value: number): number {
  return Math.round(value / LAYOUT_GRID) * LAYOUT_GRID;
}

function snapUp(value: number): number {
  return Math.ceil(value / LAYOUT_GRID) * LAYOUT_GRID;
}

function clampSize(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, snap(value)));
}

// Two model IDs can slug to the same string ("API Gateway" / "api-gateway").
function uniqueNodeId(flow: Flow, base: string): string {
  let id = base;
  for (let suffix = 2; flow.getNode(id); suffix += 1) id = `${base}-${suffix}`;
  return id;
}

function slug(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "node";
}
