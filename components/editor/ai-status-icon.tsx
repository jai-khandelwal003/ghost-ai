import { AlertCircle, Check, Loader2 } from "lucide-react";

import type { AiStatusView } from "@/hooks/use-ai-status";
import { cn } from "@/lib/utils";

// Spinner while working, check when done, alert when failed. Shared by the canvas pill and the
// AI sidebar.
export function AiStatusIcon({
  kind,
  className,
}: {
  kind: AiStatusView["kind"];
  className?: string;
}) {
  const Icon = kind === "working" ? Loader2 : kind === "failed" ? AlertCircle : Check;
  return (
    <Icon
      aria-hidden
      className={cn(
        "h-4 w-4 shrink-0",
        kind === "working" && "animate-spin text-ai-text",
        kind === "completed" && "text-success",
        kind === "failed" && "text-error",
        className,
      )}
    />
  );
}
