// Payloads shared by the background tasks (writers) and the app (readers). No server-only
// imports.

import { z } from "zod";

import { NODE_SHAPES } from "@/types/canvas";

export const AI_STATUS_KINDS = ["started", "progress", "completed", "failed"] as const;

export type AiStatusKind = (typeof AI_STATUS_KINDS)[number];

// One message in the room's `ai-status-feed`. Not tied to one task, so design and spec
// generation can both report through it. A `type` alias, not an interface: Liveblocks feed
// message data must be assignable to `Json`.
export type AiStatusMessage = {
  // Trigger.dev run that wrote the message.
  runId: string;
  kind: AiStatusKind;
  // Shown as is; without it the UI falls back to a generic line for the kind.
  text?: string;
};

// Feed messages come from the network: anything that does not match the schema is `null` and
// is not displayed. Unknown extra fields are dropped.
export function parseAiStatusMessage(data: unknown): AiStatusMessage | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;

  const { runId, kind, text } = data as Record<string, unknown>;
  if (typeof runId !== "string" || !runId) return null;
  if (!AI_STATUS_KINDS.includes(kind as AiStatusKind)) return null;
  if (text !== undefined && typeof text !== "string") return null;

  const message: AiStatusMessage = { runId, kind: kind as AiStatusKind };
  const trimmed = text?.trim();
  if (trimmed) message.text = trimmed;
  return message;
}

export const AI_CHAT_ROLES = ["user", "assistant"] as const;

export const AI_CHAT_MESSAGE_MAX_LENGTH = 4000;

// One message in the room's `ai-chat` feed. Chat only; AI progress goes to `ai-status-feed`.
// Checked before a message is sent and again when one is read (it comes from the network).
export const aiChatMessageSchema = z.object({
  sender: z.object({
    // Clerk user ID, or `AI_AGENT_USER_ID` for Ghost AI.
    id: z.string().min(1),
    name: z.string().trim().min(1),
  }),
  role: z.enum(AI_CHAT_ROLES),
  content: z.string().trim().min(1).max(AI_CHAT_MESSAGE_MAX_LENGTH),
  // Milliseconds since the epoch, set by the sender.
  timestamp: z.number().int().nonnegative(),
});

export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;

export type AiChatRole = AiChatMessage["role"];

// `null` for anything that does not match the schema. Unknown extra fields are dropped.
export function parseAiChatMessage(data: unknown): AiChatMessage | null {
  const result = aiChatMessageSchema.safeParse(data);
  return result.success ? result.data : null;
}

// Upper bounds for one spec request, so a payload stays well under Trigger.dev's limits.
export const SPEC_MAX_CHAT_MESSAGES = 200;
export const SPEC_MAX_NODES = 500;
export const SPEC_MAX_EDGES = 1000;

// A chat message as context for a spec. `ai-chat` feed messages (`AiChatMessage`) pass as is;
// `timestamp` and the sender ID are dropped.
export const specChatMessageSchema = z.object({
  role: z.enum(AI_CHAT_ROLES),
  content: z.string().trim().min(1).max(AI_CHAT_MESSAGE_MAX_LENGTH),
  sender: z.object({ name: z.string().trim().min(1) }).optional(),
});

// Only the node / edge fields a spec needs; canvas nodes and edges (`CanvasNode`, `CanvasEdge`)
// pass as is and the rest is dropped.
export const specNodeSchema = z.object({
  id: z.string().min(1),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  data: z
    .object({
      label: z.string().default(""),
      shape: z.enum(NODE_SHAPES).optional(),
      color: z.string().optional(),
    })
    .default({ label: "" }),
});

export const specEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  data: z.object({ label: z.string().optional() }).optional(),
});

// Body of `POST /api/ai/spec`. The project comes from the room ID on the server; a
// `projectId` sent by the client is dropped here and never used.
export const specRequestSchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(specChatMessageSchema).max(SPEC_MAX_CHAT_MESSAGES).default([]),
  nodes: z.array(specNodeSchema).max(SPEC_MAX_NODES),
  edges: z.array(specEdgeSchema).max(SPEC_MAX_EDGES),
});

// Payload of the `generate-spec` task: the request plus the project resolved by the route.
export const generateSpecPayloadSchema = specRequestSchema.extend({
  projectId: z.string().min(1),
});

export type SpecChatMessage = z.infer<typeof specChatMessageSchema>;
export type SpecNode = z.infer<typeof specNodeSchema>;
export type SpecEdge = z.infer<typeof specEdgeSchema>;
export type SpecRequest = z.infer<typeof specRequestSchema>;
export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>;

// Run metadata the `generate-spec` task keeps up to date, for `useRealtimeRun` readers.
export type SpecRunMetadata = {
  status: AiStatusKind;
  text: string;
};

// Output of the `generate-spec` task.
export type GenerateSpecOutput = {
  // The spec as plain Markdown.
  content: string;
  // `ProjectSpec` ID of the stored copy, for `/api/projects/<projectId>/specs/<specId>/download`.
  specId: string;
};
