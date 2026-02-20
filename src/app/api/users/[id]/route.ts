import { auth } from "@/lib/auth";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { userFormSchema } from "@/modules/users/user.dto";
import createHttpError from "http-errors";

export const PUT = createRoute(
  async (req, { body, params }) => {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: {
          id: params.id,
        },
        data: {
          email: body.email,
          name: body.name,
          role: body.role,
          helenaId: body.helenaId,
        },
      });
      if (body.password && body.password.length > 6) {
        const ctx = await auth.$context;
        const hash = await ctx.password.hash(body.password);
        const { count } = await tx.account.updateMany({
          data: {
            password: hash,
          },
          where: {
            userId: user.id,
          },
        });
        if (!count)
          throw new createHttpError.BadRequest(
            "Não foi possivel atualizar a senha",
          );
      }
    });
    return "Usuario editado com sucesso";
  },
  { body: userFormSchema },
);

export const DELETE = createRoute(async (req, { params }) => {
  await prisma.user.update({
    data: {
      banned: true,
      banReason: "Usuario Demitido",
    },
    where: {
      id: params.id,
    },
  });
  await prisma.session.deleteMany({
    where: { userId: params.id },
  });
  return "Usuario deletado com sucesso";
});
