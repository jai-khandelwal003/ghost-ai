// Stands in for the canvas until the Liveblocks / React Flow surface is built.
export function CanvasPlaceholder() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-base px-6 text-center">
      <p className="text-sm font-medium text-copy-secondary">
        Canvas coming soon
      </p>
      <p className="max-w-md text-xs text-copy-muted">
        The collaborative canvas for this project will appear here.
      </p>
    </div>
  );
}
