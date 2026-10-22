import { AI_AGENT_NAME, AI_AGENT_USER_ID, AI_STATUS_FEED_ID } from "@/lib/ai-status";
import { getLiveblocks } from "@/lib/liveblocks";
import type { AiStatusMessage } from "@/types/tasks";

// Shown by `PresenceAvatars` and `LiveCursors` like any other participant. The color is the
// AI accent text color from `ui-context.md` (cursor colors are light tints).
const AI_AGENT_INFO = {
  name: AI_AGENT_NAME,
  avatar: "",
  color: "#8b82ff",
};

// Refreshed on every update, so the agent stays in the room while it works and disappears on
// its own if the task dies without clearing it.
const PRESENCE_TTL_SECONDS = 60;
// Liveblocks' minimum: the cleared presence expires almost at once.
const CLEARED_PRESENCE_TTL_SECONDS = 2;

type AiPresence = Liveblocks["Presence"];

export async function setAiPresence(roomId: string, presence: AiPresence): Promise<void> {
  await getLiveblocks().setPresence(roomId, {
    userId: AI_AGENT_USER_ID,
    data: presence,
    userInfo: AI_AGENT_INFO,
    ttl: PRESENCE_TTL_SECONDS,
  });
}

// Hides the cursor, turns `thinking` off and lets the agent leave the room.
export async function clearAiPresence(roomId: string): Promise<void> {
  await getLiveblocks().setPresence(roomId, {
    userId: AI_AGENT_USER_ID,
    data: { cursor: null, thinking: false },
    userInfo: AI_AGENT_INFO,
    ttl: CLEARED_PRESENCE_TTL_SECONDS,
  });
}

// Appends a message to the room's AI status feed (`ensureAiStatusFeed` must have run).
export async function publishAiStatus(
  roomId: string,
  message: AiStatusMessage,
): Promise<void> {
  await getLiveblocks().createFeedMessage({
    roomId,
    feedId: AI_STATUS_FEED_ID,
    data: message,
  });
}
