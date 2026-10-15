export const FALLBACK_ERROR = "Something went wrong. Please try again.";

// Reads the `{ error }` message of a failed API response, or the generic message without one.
export async function readError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null && "error" in body) {
      return typeof body.error === "string" ? body.error : FALLBACK_ERROR;
    }
  } catch {
    // Not a JSON error body; fall through to the generic message.
  }
  return FALLBACK_ERROR;
}
