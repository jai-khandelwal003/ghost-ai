import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import {
  checkOwnership,
  errorResponse,
  parseProjectName,
  projectSelect,
  readJsonObject,
  unauthorized,
} from "@/lib/project-api";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]">
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return errorResponse(400, "Invalid JSON body");

  const name = parseProjectName(body.name);
  if (!name) return errorResponse(400, "Project name is required");

  const { projectId } = await ctx.params;
  const denied = await checkOwnership(projectId, userId);
  if (denied) return denied;

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { name },
    select: projectSelect,
  });

  return Response.json({ project });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]">
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { projectId } = await ctx.params;
  const denied = await checkOwnership(projectId, userId);
  if (denied) return denied;

  await prisma.project.delete({ where: { id: projectId } });

  return new Response(null, { status: 204 });
}
