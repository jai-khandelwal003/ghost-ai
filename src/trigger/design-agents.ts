import {
  createGoogleGenerativeAI,
  type GoogleLanguageModelOptions,
} from "@ai-sdk/google";
import { mutateFlow, type MutateFlowOptions } from "@liveblocks/react-flow/node";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateText, isStepCount } from "ai";

import { clearAiPresence, publishAiStatus, setAiPresence } from "@/lib/ai-presence";
import type { DesignAction } from "@/lib/design-actions";
import {
  applyDesignAction,
  type DesignRunContext,
  type Point,
} from "@/lib/design-layout";
import { buildDesignPrompt, DESIGN_SYSTEM_PROMPT } from "@/lib/design-prompt";
import { createDesignTools, type DesignToolStats } from "@/lib/design-tools";
import { ensureAiStatusFeed, getLiveblocks } from "@/lib/liveblocks";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import type { AiStatusKind } from "@/types/tasks";

// Pinned rather than `gemini-flash-latest` so a model change is a code change. With `low`
// thinking a full design takes ~11 s; the default level took ~80 s for the same plan.
const DESIGN_MODEL = "gemini-3.8-flash";
const DESIGN_PROVIDER_OPTIONS = {
  google: { thinkingConfig: { thinkingLevel: "low" } },
} satisfies { google: GoogleLanguageModelOptions };

// Model calls per run. Gemini usually sends every tool call in the first step; the rest are
// for fixing rejected calls and writing the closing summary.
const MAX_DESIGN_STEPS = 6;

// Longest part of the prompt quoted in the "started" status message.
const PROMPT_PREVIEW_LENGTH = 80;

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

type FlowOptions = MutateFlowOptions<CanvasNode, CanvasEdge>;

function parseDesignAgentPayload(data: unknown): DesignAgentPayload {
  if (typeof data !== "object" || data === null) {
    throw new Error("Payload must be an object");
  }

  const { prompt, roomId } = data as Record<string, unknown>;
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("A prompt is required");
  }
  if (typeof roomId !== "string" || !roomId) {
    throw new Error("A room ID is required");
  }

  return { prompt, roomId };
}

// Turns a prompt into canvas changes: reads the room's canvas and gives Gemini one tool per
// canvas action. Each tool call is applied as it comes in through `mutateFlow` (the server side
// of the `useLiveblocksFlow` storage), so everyone in the room sees the design being built. The AI
// shows up as a participant (presence: cursor + `thinking`) and reports progress in the
// room's AI status feed.
export const designAgentTask = schemaTask({
  id: "design-agent",
  schema: parseDesignAgentPayload,
  maxDuration: 300,
  // A retry would ask the model again and apply a different plan on top of the changes the
  // failed attempt already made. Gemini calls are retried by the AI SDK itself.
  retry: { maxAttempts: 1 },
  run: async ({ prompt, roomId }, { ctx }) => {
    const runId = ctx.run.id;
    const flowOptions: FlowOptions = { client: getLiveblocks(), roomId };
    const report = (kind: AiStatusKind, text: string) =>
      bestEffort("Publishing AI status", () =>
        publishAiStatus(roomId, { runId, kind, text }),
      );
    const stats: DesignToolStats = { applied: 0, skipped: 0, rejected: 0 };

    logger.log("Design task received", { roomId, prompt });

    try {
      await bestEffort("Creating the AI status feed", () => ensureAiStatusFeed(roomId));
      await bestEffort("Setting AI presence", () =>
        setAiPresence(roomId, { cursor: null, thinking: true }),
      );
      await report("started", `Ghost AI is designing: “${preview(prompt)}”`);

      const canvas = await readCanvas(flowOptions);
      const context: DesignRunContext = {
        idPrefix: `ai-${runId.slice(-6).toLowerCase()}`,
        nodeIds: new Map(),
      };
      const tools = createDesignTools(async (action) => {
        if (stats.applied === 0) {
          await report("progress", "Applying changes to the canvas…");
        }
        const point = await applyAction(flowOptions, action, context);
        if (!point) return false;
        await bestEffort("Moving the AI cursor", () =>
          setAiPresence(roomId, { cursor: point, thinking: true }),
        );
        return true;
      }, stats);

      const { text, steps } = await generateText({
        model: getDesignModel(),
        system: DESIGN_SYSTEM_PROMPT,
        prompt: buildDesignPrompt(prompt, canvas.nodes, canvas.edges),
        tools,
        stopWhen: isStepCount(MAX_DESIGN_STEPS),
        // One call at a time, in the model's order: an edge needs the node added before it.
        toolCallConcurrency: 1,
        providerOptions: DESIGN_PROVIDER_OPTIONS,
      });

      logger.log("Design finished", { steps: steps.length, ...stats, text });

      const summary = text.trim() || "Design updated.";
      await report(
        "completed",
        stats.applied > 0 ? `Done: ${summary}` : "Done: no changes were needed.",
      );
      return { summary, ...stats };
    } catch (error) {
      logger.error("Design task failed", { error: errorMessage(error), ...stats });
      await report(
        "failed",
        stats.applied > 0
          ? `Design failed after ${count(stats.applied, "change")}. Please try again.`
          : "Design failed. The canvas was not changed. Please try again.",
      );
      throw error;
    } finally {
      await bestEffort("Clearing AI presence", () => clearAiPresence(roomId));
    }
  },
});

function getDesignModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return createGoogleGenerativeAI({ apiKey })(DESIGN_MODEL);
}

async function readCanvas(options: FlowOptions) {
  let canvas: { nodes: readonly CanvasNode[]; edges: readonly CanvasEdge[] } = {
    nodes: [],
    edges: [],
  };
  await mutateFlow(options, (flow) => {
    canvas = flow.toJSON();
  });
  return canvas;
}

// One `mutateFlow` per action, so each change reaches the room as soon as it is made.
async function applyAction(
  options: FlowOptions,
  action: DesignAction,
  context: DesignRunContext,
): Promise<Point | null> {
  let point: Point | null = null;
  await mutateFlow(options, (flow) => {
    point = applyDesignAction(flow, action, context);
  });
  return point;
}

// Presence and status are shown to people, not needed for the canvas: a failure is logged and
// the design carries on.
async function bestEffort(label: string, work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch (error) {
    logger.warn(`${label} failed`, { error: errorMessage(error) });
  }
}

function preview(prompt: string): string {
  const text = prompt.trim().replace(/\s+/g, " ");
  return text.length > PROMPT_PREVIEW_LENGTH
    ? `${text.slice(0, PROMPT_PREVIEW_LENGTH - 1)}…`
    : text;
}

function count(value: number, noun: string): string {
  return `${value} ${noun}${value === 1 ? "" : "s"}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
