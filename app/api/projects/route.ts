import { auth } from "@clerk/nextjs/server";

import { Prisma } from "@/app/genrated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PROJECT_NAME,
  errorResponse,
  parseProjectId,
  parseProjectName,
  projectSelect,
  readJsonObject,
  unauthorized,
} from "@/lib/project-api";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    select: projectSelect,
  });

  return Response.json({ projects });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return errorResponse(400, "Invalid JSON body");

  const name = parseProjectName(body.name);
  if (name === null) return errorResponse(400, "Project name must be a string");

  // Without an ID the schema's `cuid()` default applies.
  const id = parseProjectId(body.id);
  if (id === null) return errorResponse(400, "Invalid project ID");

  try {
    const project = await prisma.project.create({
      data: { id, ownerId: userId, name: name ?? DEFAULT_PROJECT_NAME },
      select: projectSelect,
    });

    return Response.json({ project }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(409, "A project with this ID already exists");
    }
    throw error;
  }
}
