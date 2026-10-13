import { prisma } from "@/lib/prisma";
import type { ClerkIdentity } from "@/lib/project-access";

export interface ProjectListItem {
  id: string;
  name: string;
}

export interface SidebarProjects {
  ownedProjects: ProjectListItem[];
  sharedProjects: ProjectListItem[];
}

const listSelect = { id: true, name: true } as const;

export async function getSidebarProjects({
  userId,
  primaryEmail,
}: ClerkIdentity): Promise<SidebarProjects> {
  const [ownedProjects, sharedProjects] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: listSelect,
    }),
    primaryEmail
      ? prisma.project.findMany({
          where: {
            ownerId: { not: userId },
            collaborators: { some: { email: primaryEmail } },
          },
          orderBy: { createdAt: "desc" },
          select: listSelect,
        })
      : [],
  ]);

  return { ownedProjects, sharedProjects };
}
