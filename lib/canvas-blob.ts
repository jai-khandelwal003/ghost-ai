import { del, get, put } from "@vercel/blob";

import type { CanvasSnapshot } from "@/types/canvas";

// The Blob store is private: snapshots are only readable server side with the store token, so
// the canvas API route (which checks project access) is the only way to read one.
const CANVAS_BLOB_ACCESS = "private";

// Each save is a new blob with a random suffix, so no cached copy of an older snapshot is ever
// served under the URL the project points to.
const CANVAS_BLOB_PREFIX = "canvases";

// Returns the snapshot when the value has `nodes` and `edges` arrays, otherwise `null`.
export function parseCanvasSnapshot(value: unknown): CanvasSnapshot | null {
  if (typeof value !== "object" || value === null) return null;
  const { nodes, edges } = value as Record<string, unknown>;
  if (!Array.isArray(nodes) || !Array.isArray(edges)) return null;
  return { nodes, edges } as CanvasSnapshot;
}

// Uploads the snapshot and resolves to the new blob's URL.
export async function uploadCanvasSnapshot(
  projectId: string,
  snapshot: CanvasSnapshot
): Promise<string> {
  const blob = await put(
    `${CANVAS_BLOB_PREFIX}/${projectId}.json`,
    JSON.stringify(snapshot),
    {
      access: CANVAS_BLOB_ACCESS,
      addRandomSuffix: true,
      contentType: "application/json",
    }
  );
  return blob.url;
}

// Resolves to the stored snapshot; throws when the blob cannot be read or is not a snapshot.
export async function downloadCanvasSnapshot(
  url: string
): Promise<CanvasSnapshot> {
  const result = await get(url, { access: CANVAS_BLOB_ACCESS });
  if (result?.statusCode !== 200) {
    throw new Error(`Canvas blob not found: ${url}`);
  }

  const text = await new Response(result.stream).text();
  const snapshot = parseCanvasSnapshot(JSON.parse(text));
  if (!snapshot) throw new Error("Canvas blob is not a canvas snapshot");
  return snapshot;
}

// Removes a replaced snapshot. Best effort: a leftover blob only costs storage.
export async function deleteCanvasSnapshot(url: string) {
  try {
    await del(url);
  } catch (error) {
    console.error("Failed to delete old canvas blob", error);
  }
}
