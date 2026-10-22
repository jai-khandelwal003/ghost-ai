import { tasks } from "@trigger.dev/sdk";

import { prisma } from "@/lib/prisma";
import { getAccessibleProject, getCurrentIdentity } from "@/lib/project-access";
import {
  errorResponse,
  forbidden,
  readJsonObject,
  unauthorized,
} from "@/lib/project-api";
import type { generateSpec } from "@/src/trigger/generate-spec";
import { specRequestSchema } from "@/types/tasks";

// Starts spec generation for a project's room and records the run, so only its starter can get
// a token for it (`/api/ai/spec/token`).
export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return errorResponse(400, "Invalid JSON body");

  const parsed = specRequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return errorResponse(
      400,
      issue ? `${issue.path.join(".") || "body"}: ${issue.message}` : "Invalid request",
    );
  }
  const { roomId, chatHistory, nodes, edges } = parsed.data;
  if (nodes.length === 0 && chatHistory.length === 0) {
    return errorResponse(400, "The canvas and the chat are empty");
  }

  // The project comes from the room the user can access, never from the request (room ID =
  // project ID). A missing project and one without access both end here.
  const project = await getAccessibleProject(roomId, identity);
  if (!project) return forbidden();

  let runId: string;
  try {
    const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
      projectId: project.id,
      roomId,
      chatHistory,
      nodes,
      edges,
    });
    runId = handle.id;
  } catch (error) {
    console.error("Failed to trigger the spec task", error);
    return errorResponse(502, "Could not start the spec task");
  }

  await prisma.taskRun.create({
    data: { runId, projectId: project.id, userId: identity.userId },
  });

  return Response.json({ runId }, { status: 201 });
}
