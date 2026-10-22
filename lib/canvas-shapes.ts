import {
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  NODE_SHAPES,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas";

export type ShapeSize = { width: number; height: number };

// Where the cursor sits inside the drag image, as a fraction of its width / height.
export type GrabPoint = { grabX: number; grabY: number };

const CENTER_GRAB: GrabPoint = { grabX: 0.5, grabY: 0.5 };

// What the shape panel puts on the drag and the canvas reads back on drop.
export type ShapeDragPayload = { shape: NodeShape } & ShapeSize & GrabPoint;

// Custom type so the canvas ignores unrelated drags (files, text, links).
export const SHAPE_DRAG_TYPE = "application/x-ghost-shape";

// Smallest size a node can be resized to; keeps every shape's label area usable.
export const MIN_NODE_WIDTH = 60;
export const MIN_NODE_HEIGHT = 40;

export const DEFAULT_SHAPE_SIZES: Record<NodeShape, ShapeSize> = {
  rectangle: { width: 160, height: 80 },
  // Larger than the circle: the usable area inside a diamond is half its box.
  diamond: { width: 140, height: 140 },
  circle: { width: 100, height: 100 },
  pill: { width: 160, height: 60 },
  cylinder: { width: 120, height: 100 },
  hexagon: { width: 140, height: 100 },
};

export function writeShapeDragPayload(
  dataTransfer: DataTransfer,
  shape: NodeShape,
  grab: GrabPoint = CENTER_GRAB,
) {
  const payload: ShapeDragPayload = {
    shape,
    ...DEFAULT_SHAPE_SIZES[shape],
    ...grab,
  };
  dataTransfer.setData(SHAPE_DRAG_TYPE, JSON.stringify(payload));
  dataTransfer.effectAllowed = "copy";
}

// During `dragover` only the types are readable, not the data. `types` is a `DOMStringList`
// without `includes` in some browsers, so it is copied into an array first.
export function hasShapeDragPayload(dataTransfer: DataTransfer) {
  return Array.from(dataTransfer.types).includes(SHAPE_DRAG_TYPE);
}

// `null` for a missing or malformed payload.
export function readShapeDragPayload(
  dataTransfer: DataTransfer,
): ShapeDragPayload | null {
  const raw = dataTransfer.getData(SHAPE_DRAG_TYPE);
  if (!raw) return null;

  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { shape, width, height, grabX, grabY } = value as Record<string, unknown>;
    if (
      !NODE_SHAPES.includes(shape as NodeShape) ||
      !isPositive(width) ||
      !isPositive(height)
    ) {
      return null;
    }
    return {
      shape: shape as NodeShape,
      width,
      height,
      grabX: isFraction(grabX) ? grabX : CENTER_GRAB.grabX,
      grabY: isFraction(grabY) ? grabY : CENTER_GRAB.grabY,
    };
  } catch {
    return null;
  }
}

function isPositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isFraction(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

// Two nodes created in the same millisecond still get different IDs.
let nodeCounter = 0;

export function createNodeId(shape: NodeShape) {
  nodeCounter += 1;
  return `${shape}-${Date.now()}-${nodeCounter}`;
}

// `position` is the node's top-left corner in canvas coordinates.
export function createCanvasNode(
  { shape, width, height }: ShapeSize & { shape: NodeShape },
  position: { x: number; y: number },
): CanvasNode {
  return {
    id: createNodeId(shape),
    type: CANVAS_NODE_TYPE,
    position,
    width,
    height,
    data: { label: "", color: DEFAULT_NODE_COLOR, shape },
  };
}
