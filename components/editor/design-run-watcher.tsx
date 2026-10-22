"use client";

import { useEffect, useRef } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { RealtimeRun } from "@trigger.dev/sdk";

import type { designAgentTask } from "@/src/trigger/design-agents";

type DesignAgentRun = RealtimeRun<typeof designAgentTask>;

// The chat message for a finished run. Only the summary text is read, never the graph.
function finalMessage(run: DesignAgentRun): string {
  switch (run.status) {
    case "COMPLETED":
      return run.output?.summary ?? "Design updated.";
    case "CANCELED":
      return "The design run was canceled.";
    case "TIMED_OUT":
      return "Ghost AI ran out of time on this design. Try a smaller request.";
    default:
      return "Ghost AI couldn't finish this design. Try again.";
  }
}

interface DesignRunWatcherProps {
  runId: string;
  publicToken: string;
  // Called once, with the message to post when the run ends (or tracking it fails).
  onFinish: (content: string) => void;
}

// Subscribes to one run with `useRealtimeRun`. Render it with `key={runId}`: the hook calls
// `onComplete` only once per mounted instance, so each run needs a fresh one. Renders nothing.
export function DesignRunWatcher({ runId, publicToken, onFinish }: DesignRunWatcherProps) {
  const finishedRef = useRef(false);
  const { error } = useRealtimeRun<typeof designAgentTask>(runId, {
    // Keys the hook's cached state by run, so a previous run's state is never reused.
    id: runId,
    accessToken: publicToken,
    skipColumns: ["payload"],
    onComplete: (run) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish(finalMessage(run));
    },
  });

  // The subscription ended without the run finishing (token refused, network gone). The run
  // itself may still be going; its canvas changes still arrive through Liveblocks.
  useEffect(() => {
    if (!error || finishedRef.current) return;
    finishedRef.current = true;
    console.error("Tracking the design run failed", error);
    onFinish(
      "Lost track of this Ghost AI run. Any changes it makes will still appear on the canvas.",
    );
  }, [error, onFinish]);

  return null;
}
