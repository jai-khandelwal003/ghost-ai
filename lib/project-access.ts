import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import type { ProjectListItem } from "@/lib/projects";

export interface ClerkIdentity {
  userId: string;
  // Primary address, only when verified; collaborators are matched by email.
  primaryEmail: string | null;
}

const SIGN_IN_PATH = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in";

// Current Clerk identity, or `null` when there is no session.
export async function getCurrentIdentity(): Promise<ClerkIdentity | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const primary = (await currentUser())?.primaryEmailAddress;
  // Lowercased to match how collaborator emails are stored on invite.
  const primaryEmail =
    primary?.verification?.status === "verified"
      ? primary.emailAddress.toLowerCase()
      : null;

  return { userId, primaryEmail };
}

// Identity for server components; redirects to sign-in when there is no session.
export async function requireIdentity(): Promise<ClerkIdentity> {
  const identity = await getCurrentIdentity();
  if (!identity) redirect(SIGN_IN_PATH);

  return identity;
}

// Resolves to `null` when the project does not exist or the identity neither owns it nor
// collaborates on it. Callers cannot tell the two cases apart, by design.
export async function getAccessibleProject(
  projectId: string,
  { userId, primaryEmail }: ClerkIdentity
): Promise<ProjectListItem | null> {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        ...(primaryEmail
          ? [{ collaborators: { some: { email: primaryEmail } } }]
          : []),
      ],
    },
    select: { id: true, name: true },
  });
}
