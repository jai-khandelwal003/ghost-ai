"use client";

import type { CSSProperties } from "react";
import { NodeToolbar, Position, useReactFlow } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { NODE_COLORS, type CanvasNode, type NodeColor } from "@/types/canvas";

// Gap between the node's top edge and the toolbar, in screen pixels.
const TOOLBAR_OFFSET = 10;

type NodeColorToolbarProps = {
  nodeId: string;
  color: NodeColor;
};

// `NodeToolbar` is portaled outside the node and shown only while this node is the single
// selected one, so the node's own drag and selection handling is untouched.
export function NodeColorToolbar({ nodeId, color }: NodeColorToolbarProps) {
  const { updateNodeData } = useReactFlow<CanvasNode>();

  return (
    <NodeToolbar
      position={Position.Top}
      offset={TOOLBAR_OFFSET}
      // `nodrag` / `nopan` / `nowheel`: pressing or scrolling on the toolbar never moves the
      // node or the canvas.
      className="nodrag nopan nowheel flex items-center gap-1.5 rounded-xl border border-surface-border bg-elevated p-1.5 shadow-lg"
      role="toolbar"
      aria-label="Node color"
    >
      {NODE_COLORS.map((option) => {
        const isActive = option.fill === color;

        return (
          <button
            key={option.fill}
            type="button"
            aria-label={`Color ${option.fill}`}
            aria-pressed={isActive}
            // Only the fill is stored; the text color is looked up from `NODE_COLORS`, so the
            // pair always changes together. Written to Storage like any other node change.
            onClick={() => updateNodeData(nodeId, { color: option.fill })}
            style={
              {
                backgroundColor: option.fill,
                "--swatch-text": option.text,
              } as CSSProperties
            }
            className={cn(
              "flex size-6 items-center justify-center rounded-full border transition-shadow outline-none",
              "hover:shadow-[0_0_0_1px_var(--swatch-text),0_0_6px_0_var(--swatch-text)]",
              "focus-visible:shadow-[0_0_0_1px_var(--swatch-text),0_0_6px_0_var(--swatch-text)]",
              isActive
                ? "border-(--swatch-text) ring-2 ring-(--swatch-text) ring-offset-2 ring-offset-elevated"
                : "border-surface-border-subtle",
            )}
          >
            {/* The paired text color, so each swatch shows the whole pair. */}
            <span
              aria-hidden
              className="size-2 rounded-full bg-(--swatch-text)"
            />
          </button>
        );
      })}
    </NodeToolbar>
  );
}
