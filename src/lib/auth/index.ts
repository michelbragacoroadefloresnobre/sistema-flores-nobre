import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import createHttpError from "http-errors";
import prisma from "../prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, minPasswordLength: 6 },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { banned: true },
          });

          if (!user || user?.banned)
            throw new createHttpError.Unauthorized("Sua conta foi desativada");

          return { data: session };
        },
      },
    },
  },
  plugins: [nextCookies(), admin()],
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: true,
      },
      helenaId: {
        type: "string",
        input: true,
      },
    },
  },
});
