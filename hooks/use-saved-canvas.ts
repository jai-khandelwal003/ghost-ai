"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { canvasUrl } from "@/hooks/use-canvas-autosave";
import { readError } from "@/lib/api-error";
import type { CanvasEdge, CanvasNode, CanvasSnapshot } from "@/types/canvas";

export type SavedCanvasState = "loading" | "ready" | "error";

interface UseSavedCanvasOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  // Writes the saved canvas into the room.
  onLoad: (snapshot: CanvasSnapshot) => void;
}

// Restores the saved canvas into an empty room. A room that already has nodes or edges is live
// collaboration state and is never overwritten; the load is skipped entirely.
export function useSavedCanvas({
  projectId,
  nodes,
  edges,
  onLoad,
}: UseSavedCanvasOptions) {
  // Decided once, from the room as it was when the canvas mounted.
  const [roomWasEmpty] = useState(
    () => nodes.length === 0 && edges.length === 0
  );
  const [state, setState] = useState<SavedCanvasState>(
    roomWasEmpty ? "loading" : "ready"
  );
  const [attempt, setAttempt] = useState(0);

  const isRoomEmptyRef = useRef(roomWasEmpty);
  const onLoadRef = useRef(onLoad);
  useEffect(() => {
    isRoomEmptyRef.current = nodes.length === 0 && edges.length === 0;
    onLoadRef.current = onLoad;
  });

  useEffect(() => {
    if (!roomWasEmpty) return;
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(canvasUrl(projectId), {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(await readError(response));
        const { canvas } = (await response.json()) as {
          canvas: CanvasSnapshot | null;
        };
        if (cancelled) return;

        // Someone may have started drawing while the request was out; their canvas wins.
        const hasContent =
          canvas !== null && (canvas.nodes.length > 0 || canvas.edges.length > 0);
        if (hasContent && isRoomEmptyRef.current) onLoadRef.current(canvas);
        setState("ready");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load the saved canvas", error);
        setState("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [roomWasEmpty, projectId, attempt]);

  const retry = useCallback(() => {
    setState("loading");
    setAttempt((count) => count + 1);
  }, []);

  return { state, retry };
}
