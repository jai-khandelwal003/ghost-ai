"use client";

import { useEffect, useRef } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import type { RealtimeRun } from "@trigger.dev/sdk";

import type { generateSpec } from "@/src/trigger/generate-spec";

type SpecRun = RealtimeRun<typeof generateSpec>;

// `null` when the run produced a spec; otherwise the line shown under the button.
function finalError(run: SpecRun): string | null {
  switch (run.status) {
    case "COMPLETED":
      return null;
    case "CANCELED":
      return "Spec generation was canceled.";
    case "TIMED_OUT":
      return "Spec generation ran out of time. Try again.";
    default:
      return "Spec generation failed. Try again.";
  }
}

interface SpecRunWatcherProps {
  runId: string;
  publicToken: string;
  // The run's latest `text` metadata (`SpecRunMetadata`), while it runs.
  onStatus: (text: string | null) => void;
  // Called once when the run ends (or tracking it fails).
  onFinish: (error: string | null) => void;
}

// Subscribes to one run with `useRealtimeRun`, like `DesignRunWatcher`. Render it with
// `key={runId}`: the hook calls `onComplete` only once per mounted instance. Renders nothing.
export function SpecRunWatcher({ runId, publicToken, onStatus, onFinish }: SpecRunWatcherProps) {
  const finishedRef = useRef(false);
  const { run, error } = useRealtimeRun<typeof generateSpec>(runId, {
    id: runId,
    accessToken: publicToken,
    // Only status and metadata are read; the Markdown comes from the list's download route.
    skipColumns: ["payload", "output"],
    onComplete: (finished) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish(finalError(finished));
    },
  });

  const text = run?.metadata?.text;
  useEffect(() => {
    onStatus(typeof text === "string" ? text : null);
  }, [text, onStatus]);

  // The subscription ended without the run finishing (token refused, network gone). The run
  // may still finish and save its spec; it then shows up the next time the list loads.
  useEffect(() => {
    if (!error || finishedRef.current) return;
    finishedRef.current = true;
    console.error("Tracking the spec run failed", error);
    onFinish("Lost track of this spec run. It may still appear in the list shortly.");
  }, [error, onFinish]);

  return null;
}
