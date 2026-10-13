import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import {
  checkOwnership,
  errorResponse,
  unauthorized,
} from "@/lib/project-api";

// Owner only.
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/collaborators/[collaboratorId]">
) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const { projectId, collaboratorId } = await ctx.params;
  const denied = await checkOwnership(projectId, userId);
  if (denied) return denied;

  // Scoped to the project so an owner cannot remove another project's collaborator by ID.
  const { count } = await prisma.projectCollaborator.deleteMany({
    where: { id: collaboratorId, projectId },
  });
  if (count === 0) return errorResponse(404, "Collaborator not found");

  return new Response(null, { status: 204 });
}
