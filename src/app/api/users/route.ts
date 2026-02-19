import { Role } from "@/generated/prisma/enums";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import z from "zod";

export const GET = createRoute(
  async (request, { searchParams }) => {
    const users = await prisma.user.findMany({
      where: {
        role: searchParams.roles ? { in: searchParams.roles } : undefined,
      },
    });
    return {
      data: users,
    };
  },
  {
    searchParams: z.object({ roles: z.array(z.enum(Role)).optional() }),
  },
);
