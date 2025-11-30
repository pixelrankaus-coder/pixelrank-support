import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with logging in development
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Helper to check if we're using PostgreSQL
export function isPostgres(): boolean {
  const url = process.env.DATABASE_URL || "";
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

// Helper to check if we're using SQLite
export function isSQLite(): boolean {
  const url = process.env.DATABASE_URL || "";
  return url.startsWith("file:");
}
