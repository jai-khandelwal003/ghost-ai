"use client";

import { AlertCircle, Check, Loader2, Save } from "lucide-react";

import type { CanvasSaveControl } from "@/components/editor/canvas-save-context";
import { Button } from "@/components/ui/button";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
import { cn } from "@/lib/utils";

const STATUS_DISPLAY = {
  idle: { icon: Save, label: "Save", className: "" },
  saving: { icon: Loader2, label: "Saving...", className: "" },
  saved: { icon: Check, label: "Saved", className: "text-success" },
  error: { icon: AlertCircle, label: "Error", className: "text-error" },
} satisfies Record<
  CanvasSaveStatus,
  { icon: typeof Save; label: string; className: string }
>;

interface SaveButtonProps {
  // `null` until the canvas has mounted inside the room.
  control: CanvasSaveControl | null;
}

// The canvas autosaves; this shows how that is going and saves right away when clicked.
export function SaveButton({ control }: SaveButtonProps) {
  const status = control?.status ?? "idle";
  const { icon: Icon, label, className } = STATUS_DISPLAY[status];

  return (
    <Button
      variant="outline"
      className="border-surface-border bg-base text-copy-secondary hover:bg-subtle hover:text-copy-primary"
      onClick={control?.onSave}
      disabled={!control?.onSave || status === "saving"}
      title={status === "error" ? control?.error : undefined}
    >
      <Icon
        className={cn("h-4 w-4", status === "saving" && "animate-spin", className)}
      />
      <span aria-live="polite">{label}</span>
    </Button>
  );
}
