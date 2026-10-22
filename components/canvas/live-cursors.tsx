"use client";

import { useAuth } from "@clerk/nextjs";
import { useOthers } from "@liveblocks/react/suspense";
import { useStore, ViewportPortal } from "@xyflow/react";
import { Loader2 } from "lucide-react";

interface RemoteCursor {
  connectionId: number;
  x: number;
  y: number;
  name: string;
  color: string;
  // From presence; a missing value counts as false.
  thinking: boolean;
}

// Other participants' pointers, drawn in canvas coordinates. Rendered as a child of
// `ReactFlow`; positions come from each user's `cursor` presence (set in `CanvasFlow`).
export function LiveCursors() {
  const { userId } = useAuth();
  // Cursors keep the same on-screen size at any zoom.
  const zoom = useStore((state) => state.transform[2]);
  const cursors = useOthers((others) =>
    others.flatMap((other): RemoteCursor[] => {
      const cursor = other.presence.cursor;
      if (!cursor || other.id === userId) return [];
      return [
        {
          connectionId: other.connectionId,
          x: cursor.x,
          y: cursor.y,
          name: other.info.name,
          color: other.info.color,
          thinking: other.presence.thinking === true,
        },
      ];
    }),
  );

  return (
    <ViewportPortal>
      {cursors.map((cursor) => (
        <div
          key={cursor.connectionId}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0"
          style={{
            // Above nodes, which React Flow raises with `z-index` when selected.
            zIndex: 10000,
            transform: `translate(${cursor.x}px, ${cursor.y}px) scale(${1 / zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <svg width="16" height="18" viewBox="0 0 16 18" className="block">
            <path
              d="M1 1 L1 15 L5 11.5 L7.8 17 L10.2 15.8 L7.5 10.5 L13 10.5 Z"
              fill={cursor.color}
              stroke="var(--bg-base)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="absolute top-4 left-3 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap shadow-md"
            // Dark text: every cursor color is a light tint.
            style={{ backgroundColor: cursor.color, color: "var(--bg-base)" }}
          >
            {cursor.thinking && <Loader2 className="h-3 w-3 shrink-0 animate-spin" />}
            {cursor.name}
          </span>
        </div>
      ))}
    </ViewportPortal>
  );
}
