import { Liveblocks } from "@liveblocks/node";

const globalForLiveblocks = global as unknown as {
  liveblocks?: { secret: string; client: Liveblocks };
};

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

  const cached = globalForLiveblocks.liveblocks;
  if (cached?.secret === secret) return cached.client;

  const client = new Liveblocks({ secret });
  globalForLiveblocks.liveblocks = { secret, client };
  return client;
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
export async function ensureRoom(roomId: string): Promise<void> {
  await getLiveblocks().getOrCreateRoom(roomId, { defaultAccesses: [] });
}
