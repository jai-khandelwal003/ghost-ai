"use client";

import { Bot, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
}

// Placeholder for the AI chat. Mirrors `ProjectSidebar`: a fixed panel below the h-12 navbar.
export function AiSidebar({ isOpen }: AiSidebarProps) {
  return (
    <aside
      aria-label="AI Copilot"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "fixed top-15 right-3 bottom-3 z-40 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col rounded-2xl border border-surface-border bg-surface/90 shadow-2xl shadow-black/50 backdrop-blur-md transition-[translate,visibility] duration-200 ease-out",
        isOpen
          ? "visible translate-x-0"
          : "invisible translate-x-[calc(100%+3rem)]"
      )}
    >
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-copy-primary">AI Copilot</h2>
          <p className="text-xs text-copy-muted">Placeholder panel</p>
        </div>
        <Sparkles className="h-4 w-4 text-ai-text" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-4 overflow-y-auto p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-surface-border bg-base/60 p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ai/15">
            <Bot className="h-4 w-4 text-ai-text" />
          </div>
          <div>
            <p className="text-sm font-medium text-copy-primary">
              Chat surface pending
            </p>
            <p className="text-xs text-copy-muted">
              The toggle is wired. Messaging and generation are intentionally
              out of scope here.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-surface-border bg-base/60 p-4">
          <p className="text-[0.65rem] tracking-[0.2em] text-copy-muted uppercase">
            Future hooks
          </p>
          <p className="mt-2 text-sm text-copy-secondary">
            Prompt composer, run status, and architecture guidance will attach
            to this sidebar.
          </p>
        </div>
      </div>
    </aside>
  );
}
