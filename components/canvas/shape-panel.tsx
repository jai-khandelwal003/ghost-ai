"use client";

import { useRef, type DragEvent } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@xyflow/react";
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  Square,
  type LucideIcon,
} from "lucide-react";

import { NodeShapeView } from "@/components/canvas/node-shape";
import {
  DEFAULT_SHAPE_SIZES,
  writeShapeDragPayload,
} from "@/lib/canvas-shapes";
import { DEFAULT_NODE_COLOR, type NodeShape } from "@/types/canvas";

const SHAPE_BUTTONS: { shape: NodeShape; label: string; icon: LucideIcon }[] = [
  { shape: "rectangle", label: "Rectangle", icon: Square },
  { shape: "diamond", label: "Diamond", icon: Diamond },
  { shape: "circle", label: "Circle", icon: Circle },
  { shape: "pill", label: "Pill", icon: Pill },
  { shape: "cylinder", label: "Cylinder", icon: Cylinder },
  { shape: "hexagon", label: "Hexagon", icon: Hexagon },
];

function clampFraction(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5;
}

// Floating pill toolbar at the bottom center of the canvas. Shapes are added by dragging
// a button onto the canvas (see the drop handling in `Canvas`).
export function ShapePanel() {
  // Previews are sized at the current zoom so the ghost matches the node that lands.
  const zoom = useStore((state) => state.transform[2]);
  const previewRefs = useRef<Partial<Record<NodeShape, HTMLDivElement>>>({});

  function handleDragStart(event: DragEvent<HTMLButtonElement>, shape: NodeShape) {
    // The browser snapshots the preview as the drag image, keeps it under the cursor and
    // removes it on drop or cancel. It is held by its center, so the node lands centered on
    // the cursor.
    const preview = previewRefs.current[shape];
    if (preview) {
      event.dataTransfer.setDragImage(
        preview,
        preview.offsetWidth / 2,
        preview.offsetHeight / 2,
      );
      writeShapeDragPayload(event.dataTransfer, shape);
      return;
    }

    // No preview: the browser drags the button itself, held where the user grabbed it, so
    // the node is placed by that same point.
    const rect = event.currentTarget.getBoundingClientRect();
    writeShapeDragPayload(event.dataTransfer, shape, {
      grabX: clampFraction((event.clientX - rect.left) / rect.width),
      grabY: clampFraction((event.clientY - rect.top) / rect.height),
    });
  }

  return (
    <>
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
            onDragStart={(event) => handleDragStart(event, shape)}
            title={`Drag to add a ${label.toLowerCase()}`}
            aria-label={`${label} — drag onto the canvas`}
            className="flex size-9 cursor-grab items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary active:cursor-grabbing"
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>

      {/* Off-screen drag images: `setDragImage` needs a laid-out element. Portaled to the body
          so no clipping or transformed ancestor in the canvas affects them. The canvas only
          renders on the client (`ClientSideSuspense`), so `document` exists here. */}
      {createPortal(
        <div
          aria-hidden
          className="pointer-events-none fixed top-0 -left-[10000px]"
        >
          {SHAPE_BUTTONS.map(({ shape }) => (
            <div
              key={shape}
              ref={(element) => {
                if (element) previewRefs.current[shape] = element;
                else delete previewRefs.current[shape];
              }}
              className="opacity-70"
              style={{
                width: DEFAULT_SHAPE_SIZES[shape].width * zoom,
                height: DEFAULT_SHAPE_SIZES[shape].height * zoom,
              }}
            >
              <NodeShapeView shape={shape} fill={DEFAULT_NODE_COLOR} selected />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
