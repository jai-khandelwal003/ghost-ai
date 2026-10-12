import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/app/genrated/prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  if (databaseUrl.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: databaseUrl });
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse the client across hot reloads in development.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
