import { createRoute } from "@/lib/handler/route-handler";
import { FormStatus, Role } from "@/generated/prisma/enums";
import { hasRoles } from "@/lib/utils";
import createHttpError from "http-errors";
import prisma from "@/lib/prisma";
import { z } from "zod";

const ALLOWED_ROLES = [Role.SUPERVISOR, Role.ADMIN, Role.OWNER];

export const PATCH = createRoute(
  async (req, { params, body, auth }) => {
    const userRole = (auth!.user as any).role as Role;

    if (!hasRoles(ALLOWED_ROLES, userRole)) {
      throw createHttpError.Forbidden(
        "Usuário sem permissão para atualizar status",
      );
    }

    const form = await prisma.form.update({
      where: { id: params.id },
      data: { status: body.status },
    });

    return { data: form };
  },
  { body: z.object({ status: z.nativeEnum(FormStatus) }) },
);
