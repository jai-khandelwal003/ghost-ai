import { DEFAULT_SHAPE_SIZES } from "@/lib/canvas-shapes";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type NodeColor,
  type NodeShape,
} from "@/types/canvas";

export type CanvasTemplate = {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

// Named fills from the shared node palette, so the template data below stays readable.
const COLOR = {
  gray: NODE_COLORS[0].fill,
  blue: NODE_COLORS[1].fill,
  purple: NODE_COLORS[2].fill,
  orange: NODE_COLORS[3].fill,
  red: NODE_COLORS[4].fill,
  pink: NODE_COLORS[5].fill,
  green: NODE_COLORS[6].fill,
  teal: NODE_COLORS[7].fill,
} satisfies Record<string, NodeColor>;

// Handle IDs on `CanvasNodeView` (one per side).
type Side = "top" | "right" | "bottom" | "left";

// `x` / `y` are the node's top-left corner; the size is the shape's default size.
function node(
  id: string,
  label: string,
  shape: NodeShape,
  color: NodeColor,
  x: number,
  y: number,
): CanvasNode {
  return {
    id,
    type: CANVAS_NODE_TYPE,
    position: { x, y },
    ...DEFAULT_SHAPE_SIZES[shape],
    data: { label, color, shape },
  };
}

// Marker and stroke come from the canvas's `defaultEdgeOptions` at render time.
function edge(
  source: string,
  target: string,
  sourceHandle: Side = "right",
  targetHandle: Side = "left",
  label?: string,
): CanvasEdge {
  return {
    id: `${source}-${target}`,
    type: CANVAS_EDGE_TYPE,
    source,
    target,
    sourceHandle,
    targetHandle,
    data: label ? { label } : {},
  };
}

// Two imports in the same millisecond still get different IDs.
let importCounter = 0;

// A copy of the template ready to add to a canvas. Every node and edge gets a fresh ID, so
// nodes added later by hand or by another import never collide with it.
export function instantiateTemplate(template: CanvasTemplate): {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
} {
  importCounter += 1;
  const prefix = `${template.id}-${Date.now()}-${importCounter}`;
  const newId = (id: string) => `${prefix}-${id}`;

  return {
    nodes: template.nodes.map((templateNode) => ({
      ...templateNode,
      id: newId(templateNode.id),
      position: { ...templateNode.position },
      data: { ...templateNode.data },
    })),
    edges: template.edges.map((templateEdge) => ({
      ...templateEdge,
      id: newId(templateEdge.id),
      source: newId(templateEdge.source),
      target: newId(templateEdge.target),
      data: { ...templateEdge.data },
    })),
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description:
      "A client calling an API gateway that routes to independent services, each with its own database.",
    nodes: [
      node("client", "Client", "pill", COLOR.gray, 0, 170),
      node("gateway", "API Gateway", "rectangle", COLOR.blue, 240, 160),
      node("auth", "Auth Service", "rectangle", COLOR.purple, 480, 20),
      node("orders", "Orders Service", "rectangle", COLOR.purple, 480, 160),
      node("users", "Users Service", "rectangle", COLOR.purple, 480, 300),
      node("auth-db", "Auth DB", "cylinder", COLOR.teal, 720, 10),
      node("orders-db", "Orders DB", "cylinder", COLOR.teal, 720, 150),
      node("users-db", "Users DB", "cylinder", COLOR.teal, 720, 290),
    ],
    edges: [
      edge("client", "gateway", "right", "left", "HTTPS"),
      edge("gateway", "auth"),
      edge("gateway", "orders"),
      edge("gateway", "users"),
      edge("auth", "auth-db"),
      edge("orders", "orders-db"),
      edge("users", "users-db"),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "From commit to production: build, test, a pass / fail gate, staging and a production release.",
    nodes: [
      node("commit", "Commit", "pill", COLOR.gray, 0, 40),
      node("build", "Build", "rectangle", COLOR.blue, 220, 30),
      node("test", "Run Tests", "rectangle", COLOR.blue, 440, 30),
      node("gate", "Tests pass?", "diamond", COLOR.orange, 660, 0),
      node("staging", "Deploy to Staging", "rectangle", COLOR.green, 860, 30),
      node("production", "Production", "hexagon", COLOR.green, 1080, 20),
      node("notify", "Notify Team", "rectangle", COLOR.red, 650, 220),
    ],
    edges: [
      edge("commit", "build"),
      edge("build", "test"),
      edge("test", "gate"),
      edge("gate", "staging", "right", "left", "Yes"),
      edge("gate", "notify", "bottom", "top", "No"),
      edge("staging", "production", "right", "left", "Approve"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description:
      "Producers publish events to a central event bus, and independent consumers react to them.",
    nodes: [
      node("web-app", "Web App", "pill", COLOR.gray, 0, 60),
      node("payments", "Payment Service", "rectangle", COLOR.blue, 0, 220),
      node("event-bus", "Event Bus", "hexagon", COLOR.orange, 260, 125),
      node("notifications", "Notifications", "rectangle", COLOR.purple, 500, 0),
      node("analytics", "Analytics", "rectangle", COLOR.purple, 500, 135),
      node("inventory", "Inventory", "rectangle", COLOR.purple, 500, 270),
      node("warehouse", "Data Warehouse", "cylinder", COLOR.teal, 740, 125),
      node("inventory-db", "Inventory DB", "cylinder", COLOR.teal, 740, 260),
    ],
    edges: [
      edge("web-app", "event-bus", "right", "left", "order.created"),
      edge("payments", "event-bus", "right", "left", "payment.settled"),
      edge("event-bus", "notifications"),
      edge("event-bus", "analytics"),
      edge("event-bus", "inventory"),
      edge("analytics", "warehouse"),
      edge("inventory", "inventory-db"),
    ],
  },
];
