import {
  deleteCanvasSnapshot,
  downloadCanvasSnapshot,
  parseCanvasSnapshot,
  uploadCanvasSnapshot,
} from "@/lib/canvas-blob";
import { prisma } from "@/lib/prisma";
import { getAccessibleProject, getCurrentIdentity } from "@/lib/project-access";
import {
  errorResponse,
  notFound,
  readJsonObject,
  unauthorized,
} from "@/lib/project-api";

// Readable by the owner and by collaborators. `{ canvas: null }` until the canvas is first saved.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/canvas">
) {
  const identity = await getCurrentIdentity();
  if (!identity) return unauthorized();

  const { projectId } = await ctx.params;
  const project = await getAccessibleProject(projectId, identity);
  if (!project) return notFound();

  const { canvasJsonPath } = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });
  if (!canvasJsonPath) return Response.json({ canvas: null });

  try {
    const canvas = await downloadCanvasSnapshot(canvasJsonPath);
    return Response.json({ canvas });
  } catch (error) {
    console.error("Failed to load canvas blob", error);
    return errorResponse(502, "The saved canvas could not be loaded");
  }
}

// Writable by the owner and by collaborators (both can edit the room). Body: `{ nodes, edges }`.
export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/canvas">
) {
  const identity = await getCurrentIdentity();
  if (!identity) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return errorResponse(400, "Invalid JSON body");

  const snapshot = parseCanvasSnapshot(body);
  if (!snapshot) return errorResponse(400, "Canvas nodes and edges are required");

  const { projectId } = await ctx.params;
  const project = await getAccessibleProject(projectId, identity);
  if (!project) return notFound();

  let url: string;
  try {
    url = await uploadCanvasSnapshot(projectId, snapshot);
  } catch (error) {
    console.error("Failed to upload canvas blob", error);
    return errorResponse(502, "The canvas could not be saved");
  }

  const previous = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });
  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: url },
  });
  if (previous.canvasJsonPath && previous.canvasJsonPath !== url) {
    await deleteCanvasSnapshot(previous.canvasJsonPath);
  }

  return new Response(null, { status: 204 });
}
