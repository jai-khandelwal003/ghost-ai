"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";

import { cn } from "@/lib/utils";
import type { CanvasEdge } from "@/types/canvas";

// Width of the invisible path React Flow lays over the edge for hovering and clicking; the
// visible stroke keeps the width from its `style`.
const EDGE_INTERACTION_WIDTH = 24;

export function CanvasEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
  data,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow<never, CanvasEdge>();
  const [isEditing, setIsEditing] = useState(false);
  // Same as node labels: React Flow applies `updateEdgeData` from a queue, so the input reads
  // a local draft to keep the caret where the user is typing.
  const label = data?.label ?? "";
  const [draft, setDraft] = useState(label);
  const text = isEditing ? draft : label;

  // `borderRadius: 0` gives plain right-angle corners. The label sits on the path's own
  // midpoint, as returned by `getSmoothStepPath`.
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0,
  });

  function handleDoubleClick(event: MouseEvent) {
    event.stopPropagation();
    setDraft(label);
    setIsEditing(true);
  }

  function handleChange(value: string) {
    setDraft(value);
    updateEdgeData(id, { label: value });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setIsEditing(false);
    }
  }

  return (
    <g onDoubleClick={handleDoubleClick}>
      <BaseEdge
        id={id}
        path={path}
        style={style}
        markerEnd={markerEnd}
        interactionWidth={EDGE_INTERACTION_WIDTH}
        // Dimmed at rest, bright on hover (see `.canvas-edge` in `globals.css`) or when active.
        className={cn("canvas-edge", (selected || isEditing) && "is-active")}
      />
      {(text || isEditing) && (
        <EdgeLabelRenderer>
          <div
            // The label layer has no pointer events by default; `nodrag` / `nopan` keep presses
            // on the label from dragging or panning the canvas.
            className="nodrag nopan pointer-events-auto absolute grid rounded-md border border-surface-border bg-elevated px-1.5 py-0.5 text-xs whitespace-pre text-copy-secondary"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onDoubleClick={handleDoubleClick}
          >
            {/* The text and the input share one grid cell: the (hidden while editing) text sizes
                the cell, so the input grows with the label. */}
            <span
              aria-hidden={isEditing}
              className={cn("[grid-area:1/1]", isEditing && "invisible")}
            >
              {/* A space keeps an empty label's input one character wide. */}
              {text || " "}
            </span>
            {isEditing && (
              <input
                autoFocus
                value={draft}
                aria-label="Edge label"
                onChange={(event) => handleChange(event.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={handleKeyDown}
                className="nowheel m-0 w-full min-w-0 border-0 bg-transparent p-0 [font:inherit] text-inherit outline-none [grid-area:1/1]"
              />
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
}
