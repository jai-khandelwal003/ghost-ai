"use client";

import { catchError, type ErrorInfo } from "next/error";
import { LoaderCircle, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CanvasLoading() {
  return (
    <div
      role="status"
      className="flex h-full w-full flex-col items-center justify-center gap-3 text-center"
    >
      <LoaderCircle className="h-8 w-8 animate-spin text-copy-faint" />
      <p className="text-sm text-copy-muted">Loading canvas…</p>
    </div>
  );
}

interface CanvasErrorProps {
  message: string;
  onRetry: () => void;
}

export function CanvasError({ message, onRetry }: CanvasErrorProps) {
  return (
    <div
      role="alert"
      className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center"
    >
      <WifiOff className="h-8 w-8 text-copy-faint" />
      <h2 className="text-lg font-medium text-copy-primary">
        Canvas unavailable
      </h2>
      <p className="max-w-md text-sm text-copy-muted">{message}</p>
      <Button variant="outline" className="mt-2" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function CanvasErrorFallback(_props: object, { retry }: ErrorInfo) {
  return (
    <CanvasError
      message="Something went wrong while rendering the canvas."
      onRetry={retry}
    />
  );
}

// Catches errors thrown while rendering the canvas, so the editor shell stays usable.
export const CanvasErrorBoundary = catchError(CanvasErrorFallback);
