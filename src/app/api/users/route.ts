import { Role } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { userFormSchema } from "@/modules/users/user.dto";
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

export const POST = createRoute(
  async (req, { body }) => {
    await auth.api.createUser({
      body: {
        email: body.email,
        name: body.name,
        password: body.password,
        data: {
          role: body.role,
          helenaId: body.helenaId,
        },
      },
    });
    return "Usuario criado com sucesso";
  },
  { body: userFormSchema },
);
