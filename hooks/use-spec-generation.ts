"use client";

import { useCallback, useState } from "react";
import { useRoom } from "@liveblocks/react";

import { readError } from "@/lib/api-error";
import type { AiChatMessage } from "@/types/tasks";

// The request schema's limit (`specRequestSchema`); older messages are dropped.
const MAX_CHAT_HISTORY = 200;

// A started `generate-spec` run and the public token that can read only that run.
export type SpecRun = {
  runId: string;
  publicToken: string;
};

export interface SpecGenerationState {
  // The run this client started, while it is being tracked; `null` otherwise.
  run: SpecRun | null;
  // From the request until the run ends.
  isRunning: boolean;
  // Why the last attempt failed to start or finish; cleared by the next `start`.
  error: string | null;
  // Starts a run from the current canvas and the given AI chat. Never rejects.
  start: (chat: AiChatMessage[]) => Promise<void>;
  // Called once when the run ends; `error` is set when it did not produce a spec.
  finish: (error: string | null) => void;
}

// Starts spec generation from the AI sidebar. The canvas is read from the room's Storage at
// click time (the sidebar is outside the canvas); the server validates and trims it. Must be
// rendered inside the room's `RoomProvider`.
export function useSpecGeneration(): SpecGenerationState {
  const room = useRoom();
  const [isStarting, setIsStarting] = useState(false);
  const [run, setRun] = useState<SpecRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (chat: AiChatMessage[]) => {
      setIsStarting(true);
      setError(null);
      try {
        const { root } = await room.getStorage();
        // `{ nodes: { [id]: node }, edges: { [id]: edge } }` as plain JSON.
        const flow = root.get("flow")?.toJSON();
        const nodes = flow ? Object.values(flow.nodes) : [];
        const edges = flow ? Object.values(flow.edges) : [];
        const chatHistory = chat
          .slice(-MAX_CHAT_HISTORY)
          .map(({ role, content, sender }) => ({ role, content, sender: { name: sender.name } }));

        const response = await fetch("/api/ai/spec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: room.id, chatHistory, nodes, edges }),
        });
        if (!response.ok) throw new Error(await readError(response));
        const { runId } = (await response.json()) as { runId: string };

        const tokenResponse = await fetch("/api/ai/spec/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId }),
        });
        if (!tokenResponse.ok) throw new Error(await readError(tokenResponse));
        const { token } = (await tokenResponse.json()) as { token: string };

        setRun({ runId, publicToken: token });
      } catch (startError) {
        console.error("Starting spec generation failed", startError);
        setError(
          startError instanceof Error
            ? startError.message
            : "Spec generation could not start. Try again.",
        );
      } finally {
        setIsStarting(false);
      }
    },
    [room],
  );

  const finish = useCallback((finishError: string | null) => {
    setError(finishError);
    setRun(null);
  }, []);

  return { run, isRunning: isStarting || run !== null, error, start, finish };
}
