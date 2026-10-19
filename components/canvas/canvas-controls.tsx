"use client";

import { useCanRedo, useCanUndo, useRedo, useUndo } from "@liveblocks/react/suspense";
import { useReactFlow, type FitViewOptions } from "@xyflow/react";
import {
  Maximize,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";

import { ZOOM_ANIMATION_MS } from "@/hooks/use-keyboard-shortcuts";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

interface CanvasControlsProps {
  fitViewOptions: FitViewOptions<CanvasNode>;
}

// Floating pill at the bottom left of the canvas: zoom (React Flow viewport) and
// undo / redo (Liveblocks Storage history).
export function CanvasControls({ fitViewOptions }: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView, getNodes } = useReactFlow<CanvasNode, CanvasEdge>();

  // On an empty canvas React Flow would keep the fit queued and zoom onto the first node
  // dropped later, so there is nothing to fit.
  function handleFitView() {
    if (getNodes().length === 0) return;
    void fitView({ ...fitViewOptions, duration: ZOOM_ANIMATION_MS });
  }
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  return (
    <div
      role="toolbar"
      aria-label="Canvas controls"
      className="absolute bottom-4 left-4 z-20 flex items-center gap-1 rounded-full border border-surface-border bg-elevated p-1.5 shadow-lg"
    >
      <ControlButton
        icon={ZoomOut}
        label="Zoom out"
        onClick={() => void zoomOut({ duration: ZOOM_ANIMATION_MS })}
      />
      <ControlButton
        icon={Maximize}
        label="Fit view"
        onClick={handleFitView}
      />
      <ControlButton
        icon={ZoomIn}
        label="Zoom in"
        onClick={() => void zoomIn({ duration: ZOOM_ANIMATION_MS })}
      />

      <div aria-hidden className="mx-1 h-5 w-px bg-surface-border" />

      <ControlButton icon={Undo2} label="Undo" onClick={undo} disabled={!canUndo} />
      <ControlButton icon={Redo2} label="Redo" onClick={redo} disabled={!canRedo} />
    </div>
  );
}

interface ControlButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function ControlButton({ icon: Icon, label, onClick, disabled }: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-subtle hover:text-copy-primary disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon className="size-4" />
    </button>
  );
}
