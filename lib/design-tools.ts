import { jsonSchema, tool, type JSONSchema7 } from "ai";

import {
  MAX_DESIGN_ACTIONS,
  parseDesignAction,
  type DesignAction,
  type DesignActionType,
} from "@/lib/design-actions";
import { NODE_COLORS, NODE_SHAPES } from "@/types/canvas";

// Counts for one run, updated as the model's tool calls are applied.
export interface DesignToolStats {
  // Changed the canvas.
  applied: number;
  // Valid, but did nothing (unknown node / edge, duplicate edge).
  skipped: number;
  // Incomplete input, or past `MAX_DESIGN_ACTIONS`.
  rejected: number;
}

// What the model sees as the tool result, so it can correct a call in the next step.
export type DesignToolResult = { ok: true } | { ok: false; error: string };

// Applies one action to the canvas; `false` when it did nothing.
export type ApplyDesignAction = (action: DesignAction) => Promise<boolean>;

const NODE_FILLS: readonly string[] = NODE_COLORS.map((color) => color.fill);

const nodeId: JSONSchema7 = {
  type: "string",
  description: "Node ID from the canvas or from addNode.",
};
const shape: JSONSchema7 = { type: "string", enum: [...NODE_SHAPES] };
const color: JSONSchema7 = { type: "string", enum: [...NODE_FILLS], description: "Node fill color." };

const DESIGN_TOOLS: Record<DesignActionType, { description: string; schema: JSONSchema7 }> = {
  addNode: {
    description: "Add a node to the canvas.",
    schema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Short, unique, kebab-case ID, used to refer to the node in later calls.",
        },
        label: { type: "string", description: "1 to 4 words, title case." },
        shape,
        color,
        x: { type: "number", description: "Left edge." },
        y: { type: "number", description: "Top edge." },
        width: { type: "number", description: "Optional; defaults to the shape's size." },
        height: { type: "number", description: "Optional; defaults to the shape's size." },
      },
      required: ["id", "label", "shape", "color", "x", "y"],
    },
  },
  moveNode: {
    description: "Move a node so its top-left corner is at (x, y).",
    schema: {
      type: "object",
      properties: { id: nodeId, x: { type: "number" }, y: { type: "number" } },
      required: ["id", "x", "y"],
    },
  },
  resizeNode: {
    description: "Resize a node.",
    schema: {
      type: "object",
      properties: { id: nodeId, width: { type: "number" }, height: { type: "number" } },
      required: ["id", "width", "height"],
    },
  },
  updateNodeData: {
    description: "Change a node's label, shape and / or color. Pass only what changes.",
    schema: {
      type: "object",
      properties: { id: nodeId, label: { type: "string" }, shape, color },
      required: ["id"],
    },
  },
  deleteNode: {
    description: "Delete a node. Its edges are removed with it.",
    schema: { type: "object", properties: { id: nodeId }, required: ["id"] },
  },
  addEdge: {
    description: "Connect two nodes. Direction = request / data flow.",
    schema: {
      type: "object",
      properties: {
        source: { ...nodeId, description: "Source node ID." },
        target: { ...nodeId, description: "Target node ID." },
        label: { type: "string", description: "Optional short label." },
      },
      required: ["source", "target"],
    },
  },
  deleteEdge: {
    description: "Delete an edge.",
    schema: {
      type: "object",
      properties: { id: { type: "string", description: "Edge ID from the canvas." } },
      required: ["id"],
    },
  },
};

// One tool per canvas action. Each call is validated and applied as soon as the model makes
// it, so the design is built live. Inputs are not validated by the schema itself: a bad call
// becomes an `ok: false` result the model can react to, instead of failing the whole run.
export function createDesignTools(apply: ApplyDesignAction, stats: DesignToolStats) {
  const run = async (type: DesignActionType, input: unknown): Promise<DesignToolResult> => {
    if (stats.applied + stats.skipped + stats.rejected >= MAX_DESIGN_ACTIONS) {
      stats.rejected += 1;
      return { ok: false, error: `Limit of ${MAX_DESIGN_ACTIONS} changes reached. Stop.` };
    }

    const action = parseDesignAction(type, input);
    if (!action) {
      stats.rejected += 1;
      return { ok: false, error: "Missing or invalid fields." };
    }

    if (await apply(action)) {
      stats.applied += 1;
      return { ok: true };
    }
    stats.skipped += 1;
    return { ok: false, error: "No change: unknown node or edge ID, or the edge already exists." };
  };

  const define = (type: DesignActionType) =>
    tool({
      description: DESIGN_TOOLS[type].description,
      inputSchema: jsonSchema<Record<string, unknown>>(DESIGN_TOOLS[type].schema),
      execute: (input) => run(type, input),
    });

  return {
    addNode: define("addNode"),
    moveNode: define("moveNode"),
    resizeNode: define("resizeNode"),
    updateNodeData: define("updateNodeData"),
    deleteNode: define("deleteNode"),
    addEdge: define("addEdge"),
    deleteEdge: define("deleteEdge"),
  };
}
