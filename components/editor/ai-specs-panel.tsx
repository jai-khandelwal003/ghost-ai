"use client";

import { Download, FileText, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// Placeholder content until spec generation exists.
const DEMO_SPEC = {
  title: "E-commerce Backend Spec",
  meta: "Demo · Generated from canvas",
  snippet:
    "An API gateway routes client traffic to the catalog, cart and order services. Orders publish events to a queue consumed by payments and notifications; each service owns its own database.",
};

export function AiSpecsPanel() {
  return (
    <>
      <div className="px-4 py-3">
        {/* No handler yet: generation is out of scope for the sidebar shell. */}
        <Button className="w-full bg-ai text-copy-primary hover:bg-ai/80">
          <Sparkles className="h-4 w-4" />
          Generate Spec
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="px-4 pb-4">
          <article className="rounded-2xl border border-surface-border bg-elevated p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ai/15">
                <FileText className="h-4 w-4 text-ai-text" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-copy-primary">
                  {DEMO_SPEC.title}
                </h3>
                <p className="text-xs text-copy-muted">{DEMO_SPEC.meta}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-copy-muted"
                disabled
                aria-label="Download spec"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-copy-secondary">
              {DEMO_SPEC.snippet}
            </p>
          </article>
        </div>
      </ScrollArea>
    </>
  );
}
