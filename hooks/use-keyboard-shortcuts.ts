"use client";

import { useEffect } from "react";
import type { ReactFlowInstance } from "@xyflow/react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export interface KeyboardShortcutOptions {
  reactFlow: ReactFlowInstance<CanvasNode, CanvasEdge>;
  undo: () => void;
  redo: () => void;
}

// Same duration as the control bar buttons, so keys and clicks move the viewport alike.
export const ZOOM_ANIMATION_MS = 200;

// Typing in a node / edge label (textarea / input) or any other text field must not
// zoom the canvas or undo a Storage change.
function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

// Canvas shortcuts on `window`: `+` / `=` zoom in, `-` zoom out, Cmd/Ctrl + Z undo,
// Cmd/Ctrl + Shift + Z and Cmd/Ctrl + Y redo.
export function useKeyboardShortcuts({ reactFlow, undo, redo }: KeyboardShortcutOptions) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const isModifier = event.metaKey || event.ctrlKey;

      if (isModifier && !event.altKey) {
        if (key === "z") {
          event.preventDefault();
          if (event.shiftKey) redo();
          else undo();
        } else if (key === "y" && !event.shiftKey) {
          event.preventDefault();
          redo();
        }
        // Any other Cmd/Ctrl combination (e.g. Ctrl + `+` / `-` page zoom) stays with the browser.
        return;
      }

      if (event.altKey) return;
      if (key === "+" || key === "=") {
        event.preventDefault();
        void reactFlow.zoomIn({ duration: ZOOM_ANIMATION_MS });
      } else if (key === "-") {
        event.preventDefault();
        void reactFlow.zoomOut({ duration: ZOOM_ANIMATION_MS });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reactFlow, undo, redo]);
}
