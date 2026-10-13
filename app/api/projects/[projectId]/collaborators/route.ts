import { Prisma } from "@/app/genrated/prisma/client";
import {
  getProjectCollaborators,
  parseCollaboratorEmail,
} from "@/lib/collaborators";
import { prisma } from "@/lib/prisma";
import { getAccessibleProject, getCurrentIdentity } from "@/lib/project-access";
import {
  checkOwnership,
  errorResponse,
  notFound,
  readJsonObject,
  unauthorized,
} from "@/lib/project-api";

// Readable by the owner and by collaborators.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/collaborators">
) {
  const identity = await getCurrentIdentity();
  if (!identity) return unauthorized();

  const { projectId } = await ctx.params;
  const project = await getAccessibleProject(projectId, identity);
  if (!project) return notFound();

  const collaborators = await getProjectCollaborators(projectId);

  return Response.json({ collaborators });
}

// Owner only.
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/collaborators">
) {
  const identity = await getCurrentIdentity();
  if (!identity) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return errorResponse(400, "Invalid JSON body");

  const email = parseCollaboratorEmail(body.email);
  if (!email) return errorResponse(400, "A valid email address is required");

  const { projectId } = await ctx.params;
  const denied = await checkOwnership(projectId, identity.userId);
  if (denied) return denied;

  if (email === identity.primaryEmail) {
    return errorResponse(400, "You already own this project");
  }

  try {
    await prisma.projectCollaborator.create({ data: { projectId, email } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(409, "This person is already a collaborator");
    }
    throw error;
  }

  const collaborators = await getProjectCollaborators(projectId);

  return Response.json({ collaborators }, { status: 201 });
}
