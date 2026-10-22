import {
  createGoogleGenerativeAI,
  type GoogleLanguageModelOptions,
} from "@ai-sdk/google";
import { logger, metadata, schemaTask } from "@trigger.dev/sdk";
import { generateText } from "ai";

import { saveProjectSpec } from "@/lib/project-specs";
import { buildSpecPrompt, SPEC_SYSTEM_PROMPT } from "@/lib/spec-prompt";
import {
  generateSpecPayloadSchema,
  type GenerateSpecOutput,
  type SpecRunMetadata,
} from "@/types/tasks";

// Same model as the design agent (see `design-agents.ts`).
const SPEC_MODEL = "gemini-3.8-flash";
const SPEC_PROVIDER_OPTIONS = {
  google: { thinkingConfig: { thinkingLevel: "low" } },
} satisfies { google: GoogleLanguageModelOptions };

// Turns the canvas graph and the room's AI chat into a Markdown technical spec. The canvas is
// passed in by the caller (the room is never touched); the spec is stored as a `ProjectSpec`
// (Markdown in Blob, URL in Prisma) and returned with its ID. Progress is kept in run metadata
// (`SpecRunMetadata`) for `useRealtimeRun`.
export const generateSpec = schemaTask({
  id: "generate-spec",
  schema: generateSpecPayloadSchema,
  maxDuration: 300,
  // The spec is stored only as the last step, so a failed attempt leaves nothing behind (see
  // `saveProjectSpec`) and a retry is safe. Gemini calls are also retried by the AI SDK
  // itself, so one extra attempt is enough.
  retry: { maxAttempts: 2 },
  run: async ({ projectId, roomId, chatHistory, nodes, edges }): Promise<GenerateSpecOutput> => {
    const setStatus = ({ status, text }: SpecRunMetadata) => {
      metadata.set("status", status).set("text", text);
    };

    logger.log("Spec task received", {
      projectId,
      roomId,
      nodes: nodes.length,
      edges: edges.length,
      messages: chatHistory.length,
    });
    setStatus({ status: "started", text: "Ghost AI is reading the canvas…" });

    try {
      setStatus({ status: "progress", text: "Writing the technical spec…" });
      const { text, finishReason, usage } = await generateText({
        model: getSpecModel(),
        system: SPEC_SYSTEM_PROMPT,
        prompt: buildSpecPrompt(nodes, edges, chatHistory),
        providerOptions: SPEC_PROVIDER_OPTIONS,
      });

      const content = stripMarkdownFence(text);
      if (!content) throw new Error("The model returned an empty spec");

      logger.log("Spec finished", { finishReason, usage, length: content.length });
      setStatus({ status: "progress", text: "Saving the spec…" });
      const specId = await saveProjectSpec(projectId, content);

      logger.log("Spec saved", { specId });
      setStatus({ status: "completed", text: "Spec ready." });
      return { content, specId };
    } catch (error) {
      logger.error("Spec task failed", { error: errorMessage(error) });
      setStatus({ status: "failed", text: "Spec generation failed. Please try again." });
      throw error;
    }
  },
});

function getSpecModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return createGoogleGenerativeAI({ apiKey })(SPEC_MODEL);
}

// Models sometimes wrap the whole document in ```markdown … ```; the output should be the
// Markdown itself.
function stripMarkdownFence(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i.exec(trimmed);
  return (fenced ? fenced[1] : trimmed).trim();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
