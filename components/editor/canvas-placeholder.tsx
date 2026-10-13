// Stands in for the canvas until the Liveblocks / React Flow surface is built.
export function CanvasPlaceholder() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-surface-border bg-base px-6 text-center">
      {/* Decorative grid and glows. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border-default)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-default)_1px,transparent_1px)] bg-size-[3rem_3rem] opacity-25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--accent-primary-dim),transparent_55%),radial-gradient(ellipse_at_bottom_right,color-mix(in_oklch,var(--accent-ai)_14%,transparent),transparent_50%)]"
      />
      <h2 className="relative max-w-xl text-2xl font-medium text-copy-primary">
        Canvas and collaboration tooling land here next.
      </h2>
      <p className="relative max-w-xl text-sm leading-relaxed text-copy-muted">
        This room is ready for the shared architecture canvas, durable AI
        workflows, and real-time presence. For now, the shell is wired with
        project context and navigation only.
      </p>
    </div>
  );
}
