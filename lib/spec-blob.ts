import { del, get, put } from "@vercel/blob";

// Same private store as the canvas snapshots (`canvas-blob.ts`): a spec is only readable server
// side with the store token, so the download route (which checks project access) is the only
// way to read one.
const SPEC_BLOB_ACCESS = "private";

const SPEC_BLOB_PREFIX = "specs";

// Uploads the Markdown to `specs/<projectId>/<specId>.md` and resolves to the blob's URL. Each
// spec gets its own ID and is never rewritten, so no random suffix is needed.
export async function uploadSpecMarkdown(
  projectId: string,
  specId: string,
  content: string
): Promise<string> {
  const blob = await put(
    `${SPEC_BLOB_PREFIX}/${projectId}/${specId}.md`,
    content,
    {
      access: SPEC_BLOB_ACCESS,
      addRandomSuffix: false,
      contentType: "text/markdown; charset=utf-8",
    }
  );
  return blob.url;
}

// Resolves to the stored Markdown as a stream, or `null` when the blob does not exist.
export async function downloadSpecMarkdown(
  url: string
): Promise<ReadableStream<Uint8Array> | null> {
  const result = await get(url, { access: SPEC_BLOB_ACCESS });
  if (result?.statusCode !== 200) return null;
  return result.stream;
}

// Removes a spec blob that never got a database record. Best effort: a leftover blob only
// costs storage.
export async function deleteSpecMarkdown(url: string) {
  try {
    await del(url);
  } catch (error) {
    console.error("Failed to delete spec blob", error);
  }
}
