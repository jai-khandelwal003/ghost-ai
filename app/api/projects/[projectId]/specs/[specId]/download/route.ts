import { prisma } from "@/lib/prisma";
import { getAccessibleProject, getCurrentIdentity } from "@/lib/project-access";
import {
  errorResponse,
  forbidden,
  notFound,
  unauthorized,
} from "@/lib/project-api";
import { specFileName } from "@/lib/project-specs";
import { downloadSpecMarkdown } from "@/lib/spec-blob";

// Downloadable by the owner and by collaborators. The Blob URL is never sent to the client:
// the file is read with the store token and streamed back as a Markdown attachment.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/specs/[specId]/download">
) {
  const identity = await getCurrentIdentity();
  if (!identity) return unauthorized();

  const { projectId, specId } = await ctx.params;
  const project = await getAccessibleProject(projectId, identity);
  if (!project) {
    const exists = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    return exists ? forbidden() : notFound();
  }

  // Looked up within the project, so a spec of another project is "not found" here.
  const spec = await prisma.projectSpec.findFirst({
    where: { id: specId, projectId },
    select: { filePath: true, createdAt: true },
  });
  if (!spec) return specNotFound();

  let stream: ReadableStream<Uint8Array> | null;
  try {
    stream = await downloadSpecMarkdown(spec.filePath);
  } catch (error) {
    console.error("Failed to load spec blob", error);
    return errorResponse(502, "The spec could not be loaded");
  }
  if (!stream) return specNotFound();

  return new Response(stream, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${specFileName(project.name, spec.createdAt)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

const specNotFound = () => errorResponse(404, "Spec not found");
