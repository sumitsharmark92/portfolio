import { PrismaClient } from "@prisma/client";

/* ═══════════════════════════════════════════════════════════
   Prisma Singleton Client
   Prevents connection pool exhaustion during Next.js hot reload
   ═══════════════════════════════════════════════════════════ */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
