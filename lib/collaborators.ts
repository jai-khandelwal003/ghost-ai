import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export interface Collaborator {
  id: string;
  email: string;
  // From Clerk; `null` when no Clerk user has this email.
  name: string | null;
  imageUrl: string | null;
}

interface ClerkProfile {
  name: string | null;
  imageUrl: string | null;
}

const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Clerk's user list accepts up to 100 email addresses per request.
const CLERK_EMAIL_BATCH_SIZE = 100;

// Returns the trimmed, lowercased email, or `null` when the value is not a valid address.
export function parseCollaboratorEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const email = value.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return null;
  }
  return email;
}

// Clerk profiles keyed by lowercased email. Emails without a Clerk user are absent; if Clerk
// cannot be reached the map is empty and callers fall back to showing the email only.
async function getClerkProfiles(
  emails: string[]
): Promise<Map<string, ClerkProfile>> {
  const profiles = new Map<string, ClerkProfile>();
  if (emails.length === 0) return profiles;

  try {
    const client = await clerkClient();

    for (let start = 0; start < emails.length; start += CLERK_EMAIL_BATCH_SIZE) {
      const batch = emails.slice(start, start + CLERK_EMAIL_BATCH_SIZE);
      const { data: users } = await client.users.getUserList({
        emailAddress: batch,
        limit: batch.length,
      });

      for (const user of users) {
        const profile: ClerkProfile = {
          name: user.fullName || user.username || null,
          imageUrl: user.imageUrl || null,
        };

        // Only verified addresses, so a user cannot attach their profile to someone else's email.
        for (const address of user.emailAddresses) {
          if (address.verification?.status === "verified") {
            profiles.set(address.emailAddress.toLowerCase(), profile);
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to load collaborator profiles from Clerk", error);
    return new Map();
  }

  return profiles;
}

// Collaborators of a project, oldest first, enriched with Clerk name and avatar where available.
export async function getProjectCollaborators(
  projectId: string
): Promise<Collaborator[]> {
  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  });

  const profiles = await getClerkProfiles(rows.map((row) => row.email));

  return rows.map(({ id, email }) => {
    const profile = profiles.get(email.toLowerCase());

    return {
      id,
      email,
      name: profile?.name ?? null,
      imageUrl: profile?.imageUrl ?? null,
    };
  });
}
