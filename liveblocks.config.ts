import type { LiveblocksFlow } from "@liveblocks/react-flow";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import type { AiChatMessage, AiStatusMessage } from "@/types/tasks";

// Liveblocks types for the whole application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      // Canvas coordinates; `null` while the pointer is outside the canvas.
      cursor: { x: number; y: number } | null;
      // True while this user is waiting on an AI response.
      thinking: boolean;
    };

    // Set by `POST /api/liveblocks-auth` when the session token is issued.
    UserMeta: {
      // Clerk user ID
      id: string;
      info: {
        name: string;
        avatar: string;
        // Cursor color, derived from the user ID (`getCursorColor`).
        color: string;
      };
    };

    // Written by `useLiveblocksFlow` under its default `flow` key; absent until first use.
    Storage: {
      flow?: LiveblocksFlow<CanvasNode, CanvasEdge>;
    };

    // One type for every feed in the room: `ai-status-feed` messages are written by the
    // background tasks (`lib/ai-presence.ts`), `ai-chat` messages by the AI sidebar. Readers
    // validate each feed's messages (`parseAiStatusMessage` / `parseAiChatMessage`).
    FeedMessageData: AiStatusMessage | AiChatMessage;

    // RoomEvent, ThreadMetadata and RoomInfo keep the Liveblocks defaults until the
    // canvas defines them.
  }
}

export {};
