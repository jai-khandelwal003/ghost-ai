"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { readError } from "@/lib/api-error";
import type { CanvasEdge, CanvasNode, CanvasSnapshot } from "@/types/canvas";

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";

// Wait this long after the last change before saving, so a drag or a typed label is one write.
const AUTOSAVE_DEBOUNCE_MS = 1500;

// How long "saved" / "error" stay up before the status goes back to "idle".
const STATUS_RESET_MS = 2000;

// `useLiveblocksFlow` keeps these per client; they are not part of the shared canvas.
function toSnapshot(nodes: CanvasNode[], edges: CanvasEdge[]): CanvasSnapshot {
  return {
    nodes: nodes.map((node) => {
      const shared = { ...node };
      delete shared.selected;
      delete shared.dragging;
      delete shared.measured;
      delete shared.resizing;
      return shared;
    }),
    edges: edges.map((edge) => {
      const shared = { ...edge };
      delete shared.selected;
      return shared;
    }),
  };
}

export function canvasUrl(projectId: string) {
  return `/api/projects/${encodeURIComponent(projectId)}/canvas`;
}

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  // Off until the saved canvas has been loaded (or skipped), so an empty room is never saved
  // over the stored snapshot. The canvas at the moment it turns on is treated as saved.
  enabled: boolean;
}

// Saves the canvas through the canvas API route a short while after each change.
export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
}: UseCanvasAutosaveOptions) {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle");
  // Selection, drag and resize flags are stripped, so selecting a node does not count as a change.
  const body = useMemo(
    () => JSON.stringify(toSnapshot(nodes, edges)),
    [nodes, edges]
  );

  const latestBodyRef = useRef(body);
  // `null` until enabled; then the last body the server has (or that was there on load).
  const savedBodyRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);
  // A save was requested while another was in flight; run it once that one finishes.
  const isQueuedRef = useRef(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestBodyRef.current = body;
  }, [body]);

  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    []
  );

  // Sets the status; "saved" and "error" go back to "idle" after a moment.
  const showStatus = useCallback((next: CanvasSaveStatus) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = null;
    setStatus(next);
    if (next === "saved" || next === "error") {
      resetTimerRef.current = setTimeout(() => {
        resetTimerRef.current = null;
        setStatus("idle");
      }, STATUS_RESET_MS);
    }
  }, []);

  const save = useCallback(async () => {
    if (savedBodyRef.current === null) return;
    if (isSavingRef.current) {
      isQueuedRef.current = true;
      return;
    }

    isSavingRef.current = true;
    try {
      do {
        isQueuedRef.current = false;
        const nextBody = latestBodyRef.current;
        if (nextBody === savedBodyRef.current) {
          // Nothing new to send (e.g. a manual save right after an autosave): still confirm it.
          showStatus("saved");
          continue;
        }

        showStatus("saving");
        try {
          const response = await fetch(canvasUrl(projectId), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: nextBody,
          });
          if (!response.ok) throw new Error(await readError(response));
          savedBodyRef.current = nextBody;
          showStatus("saved");
        } catch (error) {
          console.error("Canvas autosave failed", error);
          showStatus("error");
        }
      } while (isQueuedRef.current);
    } finally {
      isSavingRef.current = false;
    }
  }, [projectId, showStatus]);

  // Debounced save after each change.
  useEffect(() => {
    if (!enabled) return;
    if (savedBodyRef.current === null) {
      savedBodyRef.current = body;
      return;
    }
    if (body === savedBodyRef.current) return;

    const timer = setTimeout(() => void save(), AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [enabled, body, save]);

  // Changes still waiting for the debounce when the tab closes or the workspace unmounts are
  // sent with `keepalive` so the request outlives the page (browsers cap such bodies at 64 KB).
  useEffect(() => {
    if (!enabled) return;

    function flush() {
      const pending = latestBodyRef.current;
      if (savedBodyRef.current === null || pending === savedBodyRef.current) {
        return;
      }
      savedBodyRef.current = pending;
      fetch(canvasUrl(projectId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: pending,
        keepalive: true,
      }).catch(() => {});
    }

    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [enabled, projectId]);

  return { status, save };
}
