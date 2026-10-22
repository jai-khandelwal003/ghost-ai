import { prisma } from "@/lib/prisma";
import { getAccessibleProject, getCurrentIdentity } from "@/lib/project-access";
import { forbidden, notFound, unauthorized } from "@/lib/project-api";
import { specFileName } from "@/lib/project-specs";

// Metadata only, newest first; readable by the owner and by collaborators. The Blob URL is
// never returned: content comes from the download route.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/specs">
) {
  const identity = await getCurrentIdentity();
  if (!identity) return unauthorized();

  const { projectId } = await ctx.params;
  const project = await getAccessibleProject(projectId, identity);
  if (!project) {
    const exists = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    return exists ? forbidden() : notFound();
  }

  const rows = await prisma.projectSpec.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });

  return Response.json({
    specs: rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      filename: specFileName(project.name, row.createdAt),
    })),
  });
}
