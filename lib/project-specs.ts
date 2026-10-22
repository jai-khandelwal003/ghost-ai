import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { deleteSpecMarkdown, uploadSpecMarkdown } from "@/lib/spec-blob";

// `<project-name>-spec-<YYYY-MM-DD>.md`; ASCII only, so it is safe inside a header's quotes.
export function specFileName(projectName: string, createdAt: Date): string {
  const date = createdAt.toISOString().slice(0, 10);
  return `${slugify(projectName) || "project"}-spec-${date}.md`;
}

// Stores a generated spec: the Markdown goes to Blob, the `ProjectSpec` row keeps only its URL.
// The ID is chosen here so the blob path can include it. Resolves to the new spec's ID.
export async function saveProjectSpec(
  projectId: string,
  content: string
): Promise<string> {
  const id = randomUUID();
  const filePath = await uploadSpecMarkdown(projectId, id, content);

  try {
    await prisma.projectSpec.create({ data: { id, projectId, filePath } });
  } catch (error) {
    // No row points at the blob, so nothing could ever download it.
    await deleteSpecMarkdown(filePath);
    throw error;
  }

  return id;
}
