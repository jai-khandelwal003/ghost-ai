"use client";

import type { DragEvent } from "react";
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  Square,
  type LucideIcon,
} from "lucide-react";

import { writeShapeDragPayload } from "@/lib/canvas-shapes";
import type { NodeShape } from "@/types/canvas";

const SHAPE_BUTTONS: { shape: NodeShape; label: string; icon: LucideIcon }[] = [
  { shape: "rectangle", label: "Rectangle", icon: Square },
  { shape: "diamond", label: "Diamond", icon: Diamond },
  { shape: "circle", label: "Circle", icon: Circle },
  { shape: "pill", label: "Pill", icon: Pill },
  { shape: "cylinder", label: "Cylinder", icon: Cylinder },
  { shape: "hexagon", label: "Hexagon", icon: Hexagon },
];

// Floating pill toolbar at the bottom center of the canvas. Shapes are added by dragging
// a button onto the canvas (see the drop handling in `Canvas`).
export function ShapePanel() {
  return (
    <div
      role="toolbar"
      aria-label="Shapes"
      className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-border bg-elevated p-1.5 shadow-lg"
    >
      {SHAPE_BUTTONS.map(({ shape, label, icon: Icon }) => (
        <button
          key={shape}
          type="button"
          draggable
          onDragStart={(event: DragEvent<HTMLButtonElement>) =>
            writeShapeDragPayload(event.dataTransfer, shape)
          }
          title={`Drag to add a ${label.toLowerCase()}`}
          aria-label={`${label} — drag onto the canvas`}
          className="flex size-9 cursor-grab items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary active:cursor-grabbing"
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
