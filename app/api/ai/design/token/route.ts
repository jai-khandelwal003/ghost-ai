import { auth } from "@trigger.dev/sdk";

import { prisma } from "@/lib/prisma";
import { getCurrentIdentity } from "@/lib/project-access";
import {
  errorResponse,
  readJsonObject,
  unauthorized,
} from "@/lib/project-api";

// Issues a Trigger.dev public token that can read only the given run, for the user who started it.
export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return errorResponse(400, "Invalid JSON body");

  const { runId } = body;
  if (typeof runId !== "string" || !runId) {
    return errorResponse(400, "A run ID is required");
  }

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId },
    select: { userId: true },
  });
  // A missing run and someone else's run both end here, so run IDs cannot be probed.
  if (!taskRun || taskRun.userId !== identity.userId) {
    return errorResponse(404, "Run not found");
  }

  let token: string;
  try {
    token = await auth.createPublicToken({
      scopes: { read: { runs: [runId] } },
    });
  } catch (error) {
    console.error("Failed to create a Trigger.dev public token", error);
    return errorResponse(502, "Could not create a run token");
  }

  return Response.json({ token });
}
