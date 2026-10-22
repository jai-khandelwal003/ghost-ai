"use client";

import { useState } from "react";
import { useRoom } from "@liveblocks/react";
import { AlertCircle, Download, FileText, Loader2, Sparkles } from "lucide-react";

import {
  formatSpecDate,
  SpecPreviewModal,
} from "@/components/editor/spec-preview-modal";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  specDownloadUrl,
  useProjectSpecs,
  type SpecListItem,
} from "@/hooks/use-project-specs";
import { cn } from "@/lib/utils";

interface AiSpecsPanelProps {
  // Changes when a spec run ends, to reload the list.
  specsVersion: number;
  // A spec run started by this client is starting or running.
  isGenerating: boolean;
  // The run's latest status line, while it runs.
  generationStatus: string | null;
  // Why the last run failed to start or finish.
  generationError: string | null;
  onGenerate: () => void;
}

// Must be rendered inside `WorkspaceRoom`: the room ID is the project ID. The run itself is
// owned by `AiSidebar`, so switching tabs does not lose it.
export function AiSpecsPanel({
  specsVersion,
  isGenerating,
  generationStatus,
  generationError,
  onGenerate,
}: AiSpecsPanelProps) {
  const projectId = useRoom().id;
  const { specs, state, error, retry } = useProjectSpecs(projectId, specsVersion);
  const [selected, setSelected] = useState<SpecListItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  function openPreview(spec: SpecListItem) {
    setSelected(spec);
    setIsPreviewOpen(true);
  }

  return (
    <>
      <div className="flex flex-col gap-2 px-4 py-3">
        <Button
          className="w-full bg-ai text-copy-primary hover:bg-ai/80 disabled:opacity-40"
          onClick={onGenerate}
          disabled={isGenerating}
          aria-busy={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? "Generating…" : "Generate Spec"}
        </Button>
        {isGenerating && (
          <p role="status" className="text-center text-xs text-copy-muted">
            {generationStatus ?? "Starting spec generation…"}
          </p>
        )}
        {!isGenerating && generationError && (
          <p role="alert" className="flex items-center gap-2 text-xs text-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {generationError}
          </p>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="px-4 pb-4">
          {state === "loading" && (
            <p className="flex items-center justify-center gap-2 py-8 text-xs text-copy-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading specs…
            </p>
          )}

          {state === "error" && (
            <div
              role="alert"
              className="flex flex-col items-center gap-3 py-8 text-center text-xs text-error"
            >
              <p className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error ?? "Specs could not be loaded."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-surface-border text-copy-secondary hover:bg-subtle hover:text-copy-primary"
                onClick={retry}
              >
                Try again
              </Button>
            </div>
          )}

          {state === "ready" && specs.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <FileText className="h-8 w-8 text-copy-faint" />
              <p className="text-xs text-copy-muted">
                No specs yet for this project.
              </p>
            </div>
          )}

          {state === "ready" && specs.length > 0 && (
            <ul className="flex flex-col gap-2">
              {specs.map((spec) => (
                <li
                  key={spec.id}
                  className="flex items-center gap-1 rounded-xl border border-surface-border bg-elevated pr-1.5 transition-colors hover:bg-subtle"
                >
                  <button
                    type="button"
                    onClick={() => openPreview(spec)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    aria-label={`Preview ${spec.filename}`}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-ai-text" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-copy-primary">
                        {spec.filename}
                      </span>
                      <time
                        dateTime={spec.createdAt}
                        className="block text-xs text-copy-muted"
                      >
                        {formatSpecDate(spec.createdAt)}
                      </time>
                    </span>
                  </button>
                  <a
                    href={specDownloadUrl(projectId, spec.id)}
                    download={spec.filename}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      "text-copy-muted hover:text-copy-primary",
                    )}
                    aria-label={`Download ${spec.filename}`}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>

      <SpecPreviewModal
        projectId={projectId}
        spec={selected}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </>
  );
}
