"use client";

import { useEffect, useState, type ElementType, type JSX } from "react";
import { AlertCircle, Download, Loader2, X } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { buttonVariants, Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { specDownloadUrl, type SpecListItem } from "@/hooks/use-project-specs";
import { readError } from "@/lib/api-error";
import { cn } from "@/lib/utils";

interface SpecPreviewModalProps {
  projectId: string;
  // The spec to show; kept while the dialog animates closed.
  spec: SpecListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpecPreviewModal({
  projectId,
  spec,
  open,
  onOpenChange,
}: SpecPreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-5 rounded-3xl p-6 sm:max-w-3xl"
      >
        <DialogHeader className="pr-10">
          <DialogTitle className="truncate text-xl font-semibold text-copy-primary">
            {spec?.filename ?? "Spec"}
          </DialogTitle>
          <DialogDescription className="text-copy-muted">
            {spec ? `Generated ${formatSpecDate(spec.createdAt)}` : null}
          </DialogDescription>
        </DialogHeader>
        <DialogClose
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="absolute top-5 right-5 rounded-full border-surface-border text-copy-secondary hover:text-copy-primary"
            />
          }
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {/* The popup unmounts when closed, so the content is dropped with it. */}
        {spec && (
          <SpecContent key={spec.id} url={specDownloadUrl(projectId, spec.id)} />
        )}

        {spec && (
          <div className="flex justify-end">
            <a
              href={specDownloadUrl(projectId, spec.id)}
              download={spec.filename}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-surface-border text-copy-secondary hover:bg-subtle hover:text-copy-primary",
              )}
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type ContentState =
  | { kind: "loading" }
  | { kind: "ready"; markdown: string }
  | { kind: "error"; message: string };

// Reads the Markdown through the download route; the Blob store is never contacted directly.
function SpecContent({ url }: { url: string }) {
  const [content, setContent] = useState<ContentState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error(await readError(response));
        const markdown = await response.text();
        if (!cancelled) setContent({ kind: "ready", markdown });
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load spec content", error);
        setContent({
          kind: "error",
          message:
            error instanceof Error ? error.message : "The spec could not be loaded",
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (content.kind === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-copy-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading spec…
      </div>
    );
  }

  if (content.kind === "error") {
    return (
      <p
        role="alert"
        className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm text-error"
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        {content.message}
      </p>
    );
  }

  return (
    // The height limit sits on the viewport: Base UI scrolls the viewport, and a percentage
    // height inside a max-height-only root would never constrain it. `min-w-0` keeps wide
    // content from stretching the dialog's grid column.
    <ScrollArea className="min-w-0 overflow-hidden rounded-2xl border border-surface-border bg-surface [&>[data-slot=scroll-area-viewport]]:max-h-[60vh]">
      <article className="px-5 py-4 text-sm leading-relaxed break-words text-copy-secondary">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
          {content.markdown}
        </ReactMarkdown>
      </article>
    </ScrollArea>
  );
}

// The element with a fixed class; react-markdown's `node` prop is dropped so it never reaches the DOM.
function styled<Tag extends keyof JSX.IntrinsicElements>(
  Tag: Tag,
  className: string,
  extra?: JSX.IntrinsicElements[Tag],
) {
  function Styled({ node, ...props }: JSX.IntrinsicElements[Tag] & { node?: unknown }) {
    void node;
    const Element = Tag as ElementType;
    return <Element className={className} {...extra} {...props} />;
  }
  return Styled;
}

// No typography plugin; each element is styled with the theme tokens.
const MARKDOWN_COMPONENTS: Components = {
  h1: styled("h1", "mt-6 mb-3 text-xl font-semibold text-copy-primary first:mt-0"),
  h2: styled(
    "h2",
    "mt-6 mb-3 border-b border-surface-border pb-1.5 text-lg font-semibold text-copy-primary first:mt-0",
  ),
  h3: styled("h3", "mt-5 mb-2 text-base font-medium text-copy-primary first:mt-0"),
  h4: styled("h4", "mt-4 mb-2 text-sm font-medium text-copy-primary first:mt-0"),
  p: styled("p", "my-3"),
  a: styled("a", "text-brand underline underline-offset-3", {
    target: "_blank",
    rel: "noreferrer",
  }),
  ul: styled("ul", "my-3 list-disc space-y-1 pl-5"),
  ol: styled("ol", "my-3 list-decimal space-y-1 pl-5"),
  li: styled("li", "marker:text-copy-muted"),
  strong: styled("strong", "font-semibold text-copy-primary"),
  blockquote: styled("blockquote", "my-3 border-l-2 border-surface-border pl-4 text-copy-muted"),
  hr: styled("hr", "my-6 border-surface-border"),
  // Inline code; inside `pre` (fenced blocks) the chip look is reset.
  code: styled(
    "code",
    "rounded-md bg-subtle px-1 py-0.5 font-mono text-[0.85em] text-copy-primary",
  ),
  pre: styled(
    "pre",
    "my-3 overflow-x-auto rounded-xl border border-surface-border bg-base p-3 font-mono text-xs [&_code]:bg-transparent [&_code]:p-0",
  ),
  table: styled("table", "my-3 block w-full overflow-x-auto border-collapse text-left text-xs"),
  th: styled(
    "th",
    "border border-surface-border bg-elevated px-2.5 py-1.5 font-medium text-copy-primary",
  ),
  td: styled("td", "border border-surface-border px-2.5 py-1.5 align-top"),
};

export function formatSpecDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
