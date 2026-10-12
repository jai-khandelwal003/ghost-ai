import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export interface ProjectListItem {
  id: string;
  name: string;
}

export interface SidebarProjects {
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
}

interface Viewer {
  userId: string;
  // Verified addresses only; collaborators are matched by email.
  emails: string[];
}

const listSelect = { id: true, name: true } as const;

// Signed-in user for server components; redirects to sign-in when there is no session.
export async function getViewer(): Promise<Viewer> {
  const { userId } = await auth.protect();
  const user = await currentUser();
  const emails =
    user?.emailAddresses
      .filter((address) => address.verification?.status === "verified")
      .map((address) => address.emailAddress) ?? [];

  return { userId, emails };
}

export async function getSidebarProjects({
  userId,
  emails,
}: Viewer): Promise<SidebarProjects> {
  const [ownedProjects, sharedProjects] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: listSelect,
    }),
    emails.length > 0
      ? prisma.project.findMany({
          where: {
            ownerId: { not: userId },
            collaborators: { some: { email: { in: emails } } },
          },
          orderBy: { createdAt: "desc" },
          select: listSelect,
        })
      : [],
  ]);

  return { ownedProjects, sharedProjects };
}

// Resolves to `null` unless the viewer owns the project or is one of its collaborators.
export async function getAccessibleProject(
  projectId: string,
  { userId, emails }: Viewer
): Promise<ProjectListItem | null> {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        { collaborators: { some: { email: { in: emails } } } },
      ],
    },
    select: listSelect,
  });
}
