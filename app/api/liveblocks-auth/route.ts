import { currentUser } from "@clerk/nextjs/server";

import { ensureRoom, getCursorColor, getLiveblocks } from "@/lib/liveblocks";
import { getAccessibleProject, getCurrentIdentity } from "@/lib/project-access";
import {
  errorResponse,
  forbidden,
  readJsonObject,
  unauthorized,
} from "@/lib/project-api";

const FALLBACK_USER_NAME = "Anonymous";

// Issues a Liveblocks session token for one room. The room ID is the project ID.
export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return errorResponse(400, "Invalid JSON body");

  const roomId = body.room;
  if (typeof roomId !== "string" || !roomId) {
    return errorResponse(400, "A room ID is required");
  }

  // A missing project and one without access both end here, so room IDs cannot be probed.
  const project = await getAccessibleProject(roomId, identity);
  if (!project) return forbidden();

  const user = await currentUser();
  if (!user) return unauthorized();

  await ensureRoom(roomId);

  const session = getLiveblocks().prepareSession(identity.userId, {
    userInfo: {
      name:
        user.fullName ||
        user.username ||
        identity.primaryEmail ||
        FALLBACK_USER_NAME,
      avatar: user.imageUrl,
      color: getCursorColor(identity.userId),
    },
  });
  session.allow(roomId, session.FULL_ACCESS);

  const { status, body: token } = await session.authorize();
  return new Response(token, { status });
}
