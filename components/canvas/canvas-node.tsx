"use client";

import type { NodeProps } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { NODE_COLORS, type CanvasNode } from "@/types/canvas";

// Every shape renders as a bordered rectangle for now; shape-specific visuals come later.
export function CanvasNodeView({ data, selected }: NodeProps<CanvasNode>) {
  const textColor =
    NODE_COLORS.find((color) => color.fill === data.color)?.text ??
    NODE_COLORS[0].text;

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-md border px-2 text-center text-sm break-words",
        // The lighter border keeps the default near-black fill visible on the dark canvas.
        selected ? "border-brand" : "border-surface-border-subtle",
      )}
      style={{ backgroundColor: data.color, color: textColor }}
    >
      {data.label}
    </div>
  );
}
