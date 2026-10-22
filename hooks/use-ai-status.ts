"use client";

import { useEffect, useMemo, useState } from "react";
import { useFeedMessages, useOthers, useSelf } from "@liveblocks/react";

import { AI_STATUS_FEED_ID } from "@/lib/ai-status";
import { parseAiStatusMessage, type AiStatusKind } from "@/types/tasks";

// How long a finished run's last message stays up.
const FINISHED_VISIBLE_MS = 8000;

const FALLBACK_TEXT: Record<AiStatusKind, string> = {
  started: "Ghost AI is working…",
  progress: "Ghost AI is working…",
  completed: "Ghost AI is done.",
  failed: "Ghost AI ran into a problem.",
};

export type AiStatusView = {
  kind: "working" | "completed" | "failed";
  text: string;
};

export interface AiStatusState {
  // True while anyone in the room (a person or the agent) has `thinking: true` in presence.
  isGenerating: boolean;
  // What to show right now, or `null` for nothing.
  status: AiStatusView | null;
}

// Shared AI activity for everyone in the room, from two Liveblocks sources: `thinking` presence
// (is something running) and the latest valid message in `ai-status-feed` (what it is doing).
// Non-suspense hooks: usable outside a `ClientSideSuspense` boundary, and a feed problem only
// hides the status. Must be rendered inside the room's `RoomProvider`.
export function useAiStatus(): AiStatusState {
  const { messages } = useFeedMessages(AI_STATUS_FEED_ID);
  const selfThinking = useSelf((me) => me.presence.thinking) ?? false;
  const othersThinking =
    useOthers((others) => others.some((other) => other.presence.thinking)) ?? false;
  const isGenerating = selfThinking || othersThinking;
  const [hiddenId, setHiddenId] = useState<string | null>(null);

  // Only the most recent message that passes validation counts.
  const latest = useMemo(() => {
    let found: { id: string; createdAt: number; kind: AiStatusKind; text: string } | null =
      null;
    for (const message of messages ?? []) {
      if (found && message.createdAt < found.createdAt) continue;
      const data = parseAiStatusMessage(message.data);
      if (!data) continue;
      found = {
        id: message.id,
        createdAt: message.createdAt,
        kind: data.kind,
        text: data.text ?? FALLBACK_TEXT[data.kind],
      };
    }
    return found;
  }, [messages]);
  const finished = latest?.kind === "completed" || latest?.kind === "failed";

  // A finished message disappears `FINISHED_VISIBLE_MS` after it was written (at once when it
  // is older, e.g. from a run before the page was opened).
  useEffect(() => {
    if (!latest || !finished) return;
    const remaining = latest.createdAt + FINISHED_VISIBLE_MS - Date.now();
    const timeout = setTimeout(() => setHiddenId(latest.id), Math.max(0, remaining));
    return () => clearTimeout(timeout);
  }, [latest, finished]);

  // A fresh finished message wins: the agent publishes it just before clearing its presence.
  // A started / progress message is only trusted while someone is thinking; otherwise the run
  // that wrote it is gone.
  let status: AiStatusView | null = null;
  if (latest && finished && latest.id !== hiddenId) {
    status = { kind: latest.kind === "failed" ? "failed" : "completed", text: latest.text };
  } else if (isGenerating) {
    status = {
      kind: "working",
      text: latest && !finished ? latest.text : FALLBACK_TEXT.started,
    };
  }

  return { isGenerating, status };
}
