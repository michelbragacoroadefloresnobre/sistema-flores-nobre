import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { DateTime, Duration } from "luxon";
import z from "zod";

export const POST = createRoute(
  async (req, { params, body }) => {
    await prisma.supplier.update({
      where: { id: params.id },
      data: {
        disabledUntil: DateTime.now()
          .plus(Duration.fromISO(body.duration))
          .toJSDate(),
      },
    });

    return "Fornecedor desativado com sucesso";
  },
  {
    body: z.object({
      duration: z.string().refine((val) => Duration.fromISO(val).isValid, {
        message:
          "Formato de duração inválido. Use o padrão ISO 8601 (ex: PT1H, P1D).",
      }),
    }),
  },
);
