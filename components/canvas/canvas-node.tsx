"use client";

import { useState, type KeyboardEvent, type MouseEvent } from "react";
import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";

import { NodeColorToolbar } from "@/components/canvas/node-color-toolbar";
import { NodeShapeView } from "@/components/canvas/node-shape";
import { cn } from "@/lib/utils";
import { NODE_COLORS, type CanvasNode } from "@/types/canvas";

// One handle in the middle of each side. They all are `source` handles: the canvas uses
// `ConnectionMode.Loose`, so an edge can start or end on any of them.
const HANDLE_POSITIONS = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
] as const;

// Smallest size a node can be resized to; keeps every shape's label area usable.
const MIN_NODE_WIDTH = 60;
const MIN_NODE_HEIGHT = 40;

const LABEL_PLACEHOLDER = "Add label";

export function CanvasNodeView({ id, data, selected }: NodeProps<CanvasNode>) {
  const textColor =
    NODE_COLORS.find((color) => color.fill === data.color)?.text ??
    NODE_COLORS[0].text;

  return (
    <div className="group relative h-full w-full">
      <NodeColorToolbar nodeId={id} color={data.color} />
      <NodeShapeView
        shape={data.shape}
        fill={data.color}
        textColor={textColor}
        selected={selected}
      >
        <NodeLabel nodeId={id} label={data.label} />
      </NodeShapeView>
      {/* After the shape so its edge lines sit on top of it, before the connection handles so
          those stay grabbable. Resizes write `dimensions` changes through `onNodesChange`. */}
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        lineClassName="canvas-resize-line"
        handleClassName="size-2! rounded-xs! border-brand! bg-elevated!"
      />
      {HANDLE_POSITIONS.map((position) => (
        <Handle
          key={position}
          id={position}
          type="source"
          position={position}
          // Small white dots with a dark border, hidden until the node is hovered.
          className="size-2.5! border-elevated! bg-copy-primary! opacity-0 transition-opacity group-hover:opacity-100"
        />
      ))}
    </div>
  );
}

type NodeLabelProps = {
  nodeId: string;
  label: string;
};

// The text and the textarea share one grid cell: the (hidden while editing) text sizes the
// cell and the textarea covers it exactly, so opening the editor does not move anything.
function NodeLabel({ nodeId, label }: NodeLabelProps) {
  const { updateNodeData } = useReactFlow<CanvasNode>();
  const [isEditing, setIsEditing] = useState(false);
  // React Flow applies `updateNodeData` from a queue, so the textarea reads a local draft
  // (written through on every keystroke) to keep the caret where the user is typing.
  const [draft, setDraft] = useState(label);
  const text = isEditing ? draft : label;

  function handleDoubleClick(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    setDraft(label);
    setIsEditing(true);
  }

  function handleChange(value: string) {
    setDraft(value);
    updateNodeData(nodeId, { label: value });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setIsEditing(false);
    }
  }

  return (
    <div
      className="grid w-full whitespace-pre-wrap break-words"
      onDoubleClick={handleDoubleClick}
    >
      <span
        aria-hidden={isEditing}
        className={cn(
          "[grid-area:1/1]",
          isEditing && "invisible",
          !text && "opacity-50",
        )}
      >
        {/* The zero-width space keeps a trailing newline one line tall. */}
        {text ? `${text}​` : LABEL_PLACEHOLDER}
      </span>
      {isEditing && (
        <textarea
          autoFocus
          rows={1}
          value={draft}
          placeholder={LABEL_PLACEHOLDER}
          aria-label="Node label"
          onChange={(event) => handleChange(event.target.value)}
          onFocus={(event) => {
            const end = event.target.value.length;
            event.target.setSelectionRange(end, end);
          }}
          onBlur={() => setIsEditing(false)}
          onKeyDown={handleKeyDown}
          // `nodrag` / `nopan` / `nowheel`: text selection and scrolling stay in the textarea
          // instead of moving the node or the canvas.
          className="nodrag nopan nowheel m-0 resize-none overflow-hidden border-0 bg-transparent p-0 text-center [font:inherit] text-inherit outline-none [grid-area:1/1] placeholder:text-inherit placeholder:opacity-50"
        />
      )}
    </div>
  );
}
