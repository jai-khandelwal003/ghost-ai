"use client";

import { useEffect, useRef, useState } from "react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useErrorListener,
  useLostConnectionListener,
  useStatus,
} from "@liveblocks/react/suspense";

import { Canvas } from "@/components/canvas/canvas";
import {
  CanvasError,
  CanvasErrorBoundary,
  CanvasLoading,
} from "@/components/canvas/canvas-state";

// How long the first connection may take before the error fallback replaces the loading state.
const CONNECT_TIMEOUT_MS = 10_000;

const ERROR_MESSAGES = {
  refused:
    "You could not be connected to this project's room. Your access may have changed.",
  timeout:
    "Connecting to the collaboration server is taking too long. Check your connection and try again.",
  lost: "The connection to the collaboration server was lost and could not be restored.",
} as const;

type ConnectionError = keyof typeof ERROR_MESSAGES;

interface CanvasRoomProps {
  // Project ID = Liveblocks room ID.
  roomId: string;
}

export function CanvasRoom({ roomId }: CanvasRoomProps) {
  return (
    // Flush with the editor background: no border, radius or inset, so it reads as an infinite canvas.
    <div className="relative h-full w-full overflow-hidden bg-base">
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider
          id={roomId}
          initialPresence={{ cursor: null, isThinking: false }}
        >
          <CanvasConnection />
        </RoomProvider>
      </LiveblocksProvider>
    </div>
  );
}

// Chooses between the canvas, its loading state and the connection error fallback.
function CanvasConnection() {
  const status = useStatus();
  const [error, setError] = useState<ConnectionError | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const hasConnected = useRef(false);

  // Auth refused, no access, room full: Liveblocks stops retrying after these.
  useErrorListener((liveblocksError) => {
    if (liveblocksError.context.type === "ROOM_CONNECTION_ERROR") {
      setError("refused");
    }
  });

  // Fires only after a connection that was once established has been down for a while.
  useLostConnectionListener((event) => {
    setIsReconnecting(event === "lost");
    if (event === "failed") setError("lost");
    if (event === "restored") setError(null);
  });

  // Other failures (auth endpoint errors, no network) are retried forever without an error
  // event, so a first connection that never completes is reported after a timeout. Later
  // drops are covered by the lost connection listener above.
  useEffect(() => {
    if (status === "connected") {
      hasConnected.current = true;
      return;
    }
    if (hasConnected.current) return;

    const timer = setTimeout(() => setIsTimedOut(true), CONNECT_TIMEOUT_MS);
    return () => {
      clearTimeout(timer);
      // Liveblocks keeps retrying in the background; show the canvas once it gets through.
      setIsTimedOut(false);
    };
  }, [status]);

  const visibleError = error ?? (isTimedOut ? "timeout" : null);

  if (visibleError) {
    return (
      <CanvasError
        message={ERROR_MESSAGES[visibleError]}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <>
      <CanvasErrorBoundary>
        <ClientSideSuspense fallback={<CanvasLoading />}>
          <Canvas />
        </ClientSideSuspense>
      </CanvasErrorBoundary>
      {isReconnecting && (
        <p
          role="status"
          className="absolute top-3 left-1/2 -translate-x-1/2 rounded-xl border border-surface-border bg-elevated px-3 py-1.5 text-xs text-warning"
        >
          Connection lost. Reconnecting…
        </p>
      )}
    </>
  );
}
