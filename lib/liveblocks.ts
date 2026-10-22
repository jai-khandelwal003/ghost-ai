import { Liveblocks } from "@liveblocks/node";

import { AI_CHAT_FEED_ID, AI_STATUS_FEED_ID, TEAM_CHAT_FEED_ID } from "@/lib/ai-status";

// Module scope, not `global`: the client holds no connections worth sharing, and under
// `next dev` each route bundle (and each hot reload) can load its own copy of `@liveblocks/node`.
// A client shared through `global` would throw another copy's `LiveblocksError`.
let cachedLiveblocks: { secret: string; client: Liveblocks } | undefined;

// Cursor colors, chosen to stay legible on the dark canvas.
const CURSOR_COLORS = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#34d399",
  "#22d3ee",
  "#60a5fa",
  "#a78bfa",
  "#e879f9",
  "#fb7185",
] as const;

// Server-side Liveblocks client. Created on first use so a missing key fails the request that
// needs it, not the build. The cache is tied to the key it was built with: `next dev` reloads
// env files without restarting, and a client built from an older key would keep failing.
export function getLiveblocks(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }

  if (cachedLiveblocks?.secret === secret) return cachedLiveblocks.client;

  const client = new Liveblocks({ secret });
  cachedLiveblocks = { secret, client };
  return client;
}

// HTTP status of a Liveblocks API error, or `undefined` for anything else. Checked by shape,
// not `instanceof LiveblocksError`, which fails when the error comes from another copy of the
// package.
function liveblocksErrorStatus(error: unknown): number | undefined {
  if (!(error instanceof Error) || error.name !== "LiveblocksError") return undefined;
  const { status } = error as Error & { status?: unknown };
  return typeof status === "number" ? status : undefined;
}

// The same user ID always maps to the same palette color, across sessions and servers.
export function getCursorColor(userId: string): string {
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) >>> 0;
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

// Creates the room on first access. Rooms are private: access comes only from session tokens.
// Also creates the AI status, AI chat and team chat feeds, so clients that join before the
// first design run or the first chat message can subscribe to them.
export async function ensureRoom(roomId: string): Promise<void> {
  await getLiveblocks().getOrCreateRoom(roomId, { defaultAccesses: [] });
  await Promise.all([
    ensureAiStatusFeed(roomId),
    ensureAiChatFeed(roomId),
    ensureFeed(roomId, TEAM_CHAT_FEED_ID),
  ]);
}

export function ensureAiStatusFeed(roomId: string): Promise<void> {
  return ensureFeed(roomId, AI_STATUS_FEED_ID);
}

export function ensureAiChatFeed(roomId: string): Promise<void> {
  return ensureFeed(roomId, AI_CHAT_FEED_ID);
}

async function ensureFeed(roomId: string, feedId: string): Promise<void> {
  const liveblocks = getLiveblocks();
  const feed = { roomId, feedId };
  try {
    await liveblocks.getFeed(feed);
    return;
  } catch (error) {
    if (liveblocksErrorStatus(error) !== 404) throw error;
  }

  try {
    await liveblocks.createFeed(feed);
  } catch (error) {
    // Created by a concurrent request in between.
    if (liveblocksErrorStatus(error) !== 409) throw error;
  }
}
