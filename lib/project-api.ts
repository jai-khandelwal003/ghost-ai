import { prisma } from "@/lib/prisma";
import { isValidRoomId } from "@/lib/workspace";

export const DEFAULT_PROJECT_NAME = "Untitled Project";

interface ApiError {
  error: string;
}

export function errorResponse(status: number, error: string) {
  return Response.json({ error } satisfies ApiError, { status });
}

export const unauthorized = () => errorResponse(401, "Unauthorized");
export const forbidden = () => errorResponse(403, "Forbidden");
export const notFound = () => errorResponse(404, "Project not found");

// Resolves to an error response unless the project exists and is owned by the user.
export async function checkOwnership(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) return notFound();
  if (project.ownerId !== userId) return forbidden();
  return null;
}

// Fields returned to clients for every project endpoint.
export const projectSelect = {
  id: true,
  ownerId: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Reads the JSON body as a plain object; an empty body counts as `{}`, anything else invalid is `null`.
export async function readJsonObject(
  request: Request
): Promise<Record<string, unknown> | null> {
  const text = await request.text();
  if (!text.trim()) return {};

  try {
    const body: unknown = JSON.parse(text);
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return null;
    }
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Returns the trimmed name, `undefined` when absent or blank, or `null` when it is not a string.
export function parseProjectName(value: unknown): string | undefined | null {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return null;
  return value.trim() || undefined;
}

// Returns the client-chosen project ID, `undefined` when absent, or `null` when it is not a valid room ID.
export function parseProjectId(value: unknown): string | undefined | null {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !isValidRoomId(value)) return null;
  return value;
}
