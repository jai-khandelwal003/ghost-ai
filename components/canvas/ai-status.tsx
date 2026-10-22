"use client";

import { AiStatusIcon } from "@/components/editor/ai-status-icon";
import { useAiStatus } from "@/hooks/use-ai-status";

// Top center of the canvas: what the AI is doing, for everyone in the room (see `useAiStatus`).
export function AiStatus() {
  const { status } = useAiStatus();
  if (!status) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-3 left-1/2 z-20 flex max-w-[min(32rem,calc(100%-12rem))] -translate-x-1/2 items-center gap-2 rounded-full border border-surface-border bg-elevated px-3 py-1.5 text-xs text-copy-secondary shadow-lg"
    >
      <AiStatusIcon kind={status.kind} />
      <span className="truncate">{status.text}</span>
    </div>
  );
}
