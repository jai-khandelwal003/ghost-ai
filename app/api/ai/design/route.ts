import { auth, tasks } from "@trigger.dev/sdk";

import { prisma } from "@/lib/prisma";
import { getAccessibleProject, getCurrentIdentity } from "@/lib/project-access";
import {
  errorResponse,
  forbidden,
  readJsonObject,
  unauthorized,
} from "@/lib/project-api";
import type { designAgentTask } from "@/src/trigger/design-agents";

// Starts the design task for a project's room, records the run for later token checks, and
// returns a public token that can read only that run (for `useRealtimeRun`).
export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return errorResponse(400, "Invalid JSON body");

  const { prompt, roomId } = body;
  if (typeof prompt !== "string" || !prompt.trim()) {
    return errorResponse(400, "A prompt is required");
  }
  if (typeof roomId !== "string" || !roomId) {
    return errorResponse(400, "A room ID is required");
  }
  // The room ID is the project ID. `projectId` is optional; when sent, it must match.
  const projectId = body.projectId ?? roomId;
  if (projectId !== roomId) {
    return errorResponse(400, "The room ID does not match the project");
  }

  // A missing project and one without access both end here, so project IDs cannot be probed.
  const project = await getAccessibleProject(roomId, identity);
  if (!project) return forbidden();

  let runId: string;
  try {
    const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
      prompt: prompt.trim(),
      roomId,
    });
    runId = handle.id;
  } catch (error) {
    console.error("Failed to trigger the design task", error);
    return errorResponse(502, "Could not start the design task");
  }

  await prisma.taskRun.create({
    data: { runId, projectId: roomId, userId: identity.userId },
  });

  // Same scope as `/api/ai/design/token`, which can mint a fresh one later.
  let publicToken: string;
  try {
    publicToken = await auth.createPublicToken({
      scopes: { read: { runs: [runId] } },
    });
  } catch (error) {
    console.error("Failed to create a Trigger.dev public token", error);
    return errorResponse(502, "Could not create a run token");
  }

  return Response.json({ runId, publicToken }, { status: 201 });
}
