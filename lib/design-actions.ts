import {
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SHAPE,
  NODE_COLORS,
  NODE_SHAPES,
  type NodeColor,
  type NodeShape,
} from "@/types/canvas";

// Canvas changes the design agent can make, one tool each. Node IDs in actions are either IDs
// already on the canvas or IDs the model gave to nodes it added earlier in the same run.
export const DESIGN_ACTION_TYPES = [
  "addNode",
  "moveNode",
  "resizeNode",
  "updateNodeData",
  "deleteNode",
  "addEdge",
  "deleteEdge",
] as const;

export type DesignActionType = (typeof DESIGN_ACTION_TYPES)[number];

export interface AddNodeAction {
  type: "addNode";
  id: string;
  label: string;
  shape: NodeShape;
  color: NodeColor;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface MoveNodeAction {
  type: "moveNode";
  id: string;
  x: number;
  y: number;
}

export interface ResizeNodeAction {
  type: "resizeNode";
  id: string;
  width: number;
  height: number;
}

export interface UpdateNodeDataAction {
  type: "updateNodeData";
  id: string;
  label?: string;
  shape?: NodeShape;
  color?: NodeColor;
}

export interface DeleteNodeAction {
  type: "deleteNode";
  id: string;
}

export interface AddEdgeAction {
  type: "addEdge";
  source: string;
  target: string;
  label?: string;
}

export interface DeleteEdgeAction {
  type: "deleteEdge";
  id: string;
}

export type DesignAction =
  | AddNodeAction
  | MoveNodeAction
  | ResizeNodeAction
  | UpdateNodeDataAction
  | DeleteNodeAction
  | AddEdgeAction
  | DeleteEdgeAction;

// Upper bound on tool calls applied from one prompt.
export const MAX_DESIGN_ACTIONS = 60;

// Turns one tool call's input into an action: keeps it when complete, normalizes shape / color
// to the allowed values, and returns `null` otherwise.
export function parseDesignAction(type: DesignActionType, input: unknown): DesignAction | null {
  if (typeof input !== "object" || input === null) return null;
  const fields = input as Record<string, unknown>;
  const id = text(fields.id);

  switch (type) {
    case "addNode": {
      const x = finite(fields.x);
      const y = finite(fields.y);
      if (!id || x === undefined || y === undefined) return null;
      return {
        type: "addNode",
        id,
        label: text(fields.label) ?? "",
        shape: shape(fields.shape) ?? DEFAULT_NODE_SHAPE,
        color: color(fields.color) ?? DEFAULT_NODE_COLOR,
        x,
        y,
        width: positive(fields.width),
        height: positive(fields.height),
      };
    }
    case "moveNode": {
      const x = finite(fields.x);
      const y = finite(fields.y);
      if (!id || x === undefined || y === undefined) return null;
      return { type: "moveNode", id, x, y };
    }
    case "resizeNode": {
      const width = positive(fields.width);
      const height = positive(fields.height);
      if (!id || width === undefined || height === undefined) return null;
      return { type: "resizeNode", id, width, height };
    }
    case "updateNodeData": {
      if (!id) return null;
      const update: UpdateNodeDataAction = { type: "updateNodeData", id };
      if (typeof fields.label === "string") update.label = fields.label.trim();
      const nextShape = shape(fields.shape);
      if (nextShape) update.shape = nextShape;
      const nextColor = color(fields.color);
      if (nextColor) update.color = nextColor;
      if (!("label" in update) && !nextShape && !nextColor) return null;
      return update;
    }
    case "deleteNode":
      return id ? { type: "deleteNode", id } : null;
    case "addEdge": {
      const source = text(fields.source);
      const target = text(fields.target);
      if (!source || !target || source === target) return null;
      const label = text(fields.label);
      return label ? { type: "addEdge", source, target, label } : { type: "addEdge", source, target };
    }
    case "deleteEdge":
      return id ? { type: "deleteEdge", id } : null;
  }
}

function text(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function finite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function positive(value: unknown): number | undefined {
  const number = finite(value);
  return number !== undefined && number > 0 ? number : undefined;
}

function shape(value: unknown): NodeShape | undefined {
  return NODE_SHAPES.find((candidate) => candidate === value);
}

function color(value: unknown): NodeColor | undefined {
  if (typeof value !== "string") return undefined;
  const upper = value.trim().toUpperCase();
  return NODE_COLORS.find((pair) => pair.fill === upper)?.fill;
}
