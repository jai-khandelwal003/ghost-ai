"use client";

import { useCallback, useState } from "react";
import { useRoom } from "@liveblocks/react";

// A started `design-agent` run and the public token that can read only that run.
export type DesignRun = {
  runId: string;
  publicToken: string;
};

export interface DesignAgentState {
  // The run this client started, while it is being tracked; `null` otherwise.
  run: DesignRun | null;
  // From the request until the run's final message is posted.
  isRunning: boolean;
  // Starts a run for the room. Never rejects: failures are posted to the chat.
  start: (prompt: string) => Promise<void>;
  // Called once with the run's final chat message; posts it and resets the run state.
  finish: (content: string) => Promise<void>;
}

// Starts design runs from the AI sidebar. The canvas is not touched here: the agent writes
// nodes, edges and presence to the room, and `useLiveblocksFlow` shows them. Must be rendered
// inside the room's `RoomProvider`.
export function useDesignAgent(
  // Posts a Ghost AI message to the room's `ai-chat` feed.
  sendAssistant: (content: string) => Promise<void>,
): DesignAgentState {
  const roomId = useRoom().id;
  const [isStarting, setIsStarting] = useState(false);
  const [run, setRun] = useState<DesignRun | null>(null);

  const post = useCallback(
    async (content: string) => {
      try {
        await sendAssistant(content);
      } catch (error) {
        console.error("Posting a Ghost AI message failed", error);
      }
    },
    [sendAssistant],
  );

  const start = useCallback(
    async (prompt: string) => {
      setIsStarting(true);
      try {
        const response = await fetch("/api/ai/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, roomId }),
        });
        const body: unknown = await response.json().catch(() => null);
        const { runId, publicToken, error } = (body ?? {}) as Record<string, unknown>;
        if (!response.ok || typeof runId !== "string" || typeof publicToken !== "string") {
          await post(
            typeof error === "string"
              ? `Ghost AI couldn't start: ${error}.`
              : "Ghost AI couldn't start. Try again.",
          );
          return;
        }
        setRun({ runId, publicToken });
      } catch (error) {
        console.error("Starting the design agent failed", error);
        await post("Ghost AI couldn't start: the request failed. Check your connection and try again.");
      } finally {
        setIsStarting(false);
      }
    },
    [post, roomId],
  );

  const finish = useCallback(
    async (content: string) => {
      try {
        await post(content);
      } finally {
        setRun(null);
      }
    },
    [post],
  );

  return { run, isRunning: isStarting || run !== null, start, finish };
}
