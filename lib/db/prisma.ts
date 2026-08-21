import { PrismaClient } from "@prisma/client";

/**
 * En développement, Next.js recharge les modules à chaud (HMR), ce qui
 * recréerait une nouvelle instance de PrismaClient à chaque sauvegarde
 * et finirait par épuiser les connexions à la base.
 * On stocke donc l'instance sur l'objet global pour la réutiliser.
 */

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