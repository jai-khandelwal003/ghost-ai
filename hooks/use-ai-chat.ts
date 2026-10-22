"use client";

import { useCallback, useMemo } from "react";
import { useCreateFeedMessage, useFeedMessages, useSelf } from "@liveblocks/react";

import { AI_AGENT_NAME, AI_AGENT_USER_ID, AI_CHAT_FEED_ID } from "@/lib/ai-status";
import {
  AI_CHAT_MESSAGE_MAX_LENGTH,
  aiChatMessageSchema,
  parseAiChatMessage,
  type AiChatMessage,
} from "@/types/tasks";

export type AiChatFeedMessage = AiChatMessage & {
  // Liveblocks feed message ID.
  id: string;
  // When Liveblocks stored the message (server clock).
  createdAt: number;
};

export interface AiChatState {
  // Valid messages, oldest first. Invalid feed messages are skipped.
  messages: AiChatFeedMessage[];
  isLoading: boolean;
  // Current user's Liveblocks user ID (Clerk user ID), `null` until connected.
  selfId: string | null;
  // Resolves once Liveblocks has stored the message; rejects when it was not sent.
  send: (content: string) => Promise<void>;
  // Same, posted as Ghost AI (`role: "assistant"`): run results and errors.
  sendAssistant: (content: string) => Promise<void>;
}

// A room chat feed (`ai-chat` by default, or `team-chat`), shared by everyone in the room.
// Non-suspense hooks, like `useAiStatus`. Must be rendered inside the room's `RoomProvider`.
export function useAiChat(feedId: string = AI_CHAT_FEED_ID): AiChatState {
  const { messages: feedMessages, isLoading } = useFeedMessages(feedId);
  const createFeedMessage = useCreateFeedMessage();
  const self = useSelf((me) => ({ id: me.id, name: me.info.name }));
  const selfId = self?.id ?? null;
  const selfName = self?.name ?? null;

  const messages = useMemo(() => {
    const valid: AiChatFeedMessage[] = [];
    for (const message of feedMessages ?? []) {
      const data = parseAiChatMessage(message.data);
      if (data) valid.push({ ...data, id: message.id, createdAt: message.createdAt });
    }
    // Server order first; the sender's timestamp and ID break ties.
    valid.sort(
      (a, b) =>
        a.createdAt - b.createdAt ||
        a.timestamp - b.timestamp ||
        a.id.localeCompare(b.id),
    );
    return valid;
  }, [feedMessages]);

  const send = useCallback(
    async (content: string) => {
      if (!selfId || !selfName) throw new Error("Not connected to the room.");
      // Validated before it leaves the client; throws on an empty or too long message.
      const message = aiChatMessageSchema.parse({
        sender: { id: selfId, name: selfName },
        role: "user",
        content,
        timestamp: Date.now(),
      } satisfies AiChatMessage);
      await createFeedMessage(feedId, message);
    },
    [createFeedMessage, feedId, selfId, selfName],
  );

  const sendAssistant = useCallback(
    async (content: string) => {
      const message = aiChatMessageSchema.parse({
        sender: { id: AI_AGENT_USER_ID, name: AI_AGENT_NAME },
        role: "assistant",
        // Run summaries can be long; cut rather than lose the message.
        content: content.slice(0, AI_CHAT_MESSAGE_MAX_LENGTH),
        timestamp: Date.now(),
      } satisfies AiChatMessage);
      await createFeedMessage(feedId, message);
    },
    [createFeedMessage, feedId],
  );

  return { messages, isLoading, selfId, send, sendAssistant };
}
