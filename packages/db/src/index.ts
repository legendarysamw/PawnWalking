import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __pawnwalkingPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__pawnwalkingPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__pawnwalkingPrisma = prisma;
}

export * from "@prisma/client";
