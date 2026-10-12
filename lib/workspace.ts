import { slugify } from "@/lib/slug";

const MAX_SLUG_LENGTH = 48;
const MAX_ROOM_ID_LENGTH = 64;
const ROOM_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Short random suffix that keeps room IDs unique when two projects share a name.
export function createRoomIdSuffix(): string {
  return crypto.randomUUID().slice(0, 6);
}

// The room ID doubles as the project ID, so the project and its Liveblocks room stay aligned.
export function createRoomId(name: string, suffix: string): string {
  const slug = slugify(name).slice(0, MAX_SLUG_LENGTH).replace(/-+$/, "");
  return slug ? `${slug}-${suffix}` : "";
}

export function isValidRoomId(value: string): boolean {
  return value.length <= MAX_ROOM_ID_LENGTH && ROOM_ID_PATTERN.test(value);
}

export function getWorkspacePath(projectId: string): string {
  return `/editor/${projectId}`;
}
