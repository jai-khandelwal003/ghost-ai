"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import { useOthers } from "@liveblocks/react/suspense";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";

const MAX_VISIBLE_AVATARS = 5;

// Shared by the collaborator avatars and the Clerk avatar so the group lines up.
const AVATAR_SIZE = "2rem";

const USER_BUTTON_APPEARANCE = {
  elements: {
    userButtonAvatarBox: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  },
};

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
}

// Selector result changes only when someone joins, leaves or changes their user info, not on
// every cursor move.
function sameCollaborators(a: Collaborator[], b: Collaborator[]) {
  return (
    a.length === b.length &&
    a.every(
      (user, index) =>
        user.id === b[index].id &&
        user.name === b[index].name &&
        user.avatar === b[index].avatar,
    )
  );
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return initials || "?";
}

// Top right of the canvas: other people in the room, then the current user's Clerk button.
// Must render inside the room (see `CanvasRoom`).
export function PresenceAvatars() {
  const { userId } = useAuth();
  const collaborators = useOthers((others) => {
    const byId = new Map<string, Collaborator>();
    for (const other of others) {
      // The current user, in this or another tab, is shown by the Clerk button instead.
      if (!other.id || other.id === userId || byId.has(other.id)) continue;
      byId.set(other.id, {
        id: other.id,
        name: other.info.name,
        avatar: other.info.avatar,
      });
    }
    return [...byId.values()];
  }, sameCollaborators);

  const visible = collaborators.slice(0, MAX_VISIBLE_AVATARS);
  const overflow = collaborators.length - visible.length;

  return (
    <div className="absolute top-3 right-3 z-20 flex items-center gap-2 rounded-full border border-surface-border bg-elevated p-1 shadow-lg">
      {collaborators.length > 0 && (
        <>
          <AvatarGroup
            aria-label="Collaborators in this room"
            className="*:data-[slot=avatar]:ring-surface-border-subtle"
          >
            {visible.map((user) => (
              <Avatar key={user.id} style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="text-xs text-copy-secondary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {overflow > 0 && (
              <AvatarGroupCount
                className="text-xs text-copy-secondary ring-surface-border-subtle"
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
                aria-label={`${overflow} more`}
              >
                +{overflow}
              </AvatarGroupCount>
            )}
          </AvatarGroup>
          <div aria-hidden className="h-5 w-px bg-surface-border" />
        </>
      )}
      <div className="flex" style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
        <UserButton appearance={USER_BUTTON_APPEARANCE} />
      </div>
    </div>
  );
}
