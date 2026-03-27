import { createRoute } from "@/lib/handler/route-handler";
import { createOccasion } from "@/modules/occasions/occasion.service";
import { createOccasionSchema } from "@/modules/occasions/occasion.dto";
import prisma from "@/lib/prisma";
import createHttpError from "http-errors";

export const POST = createRoute(
  async (req, { body }) => {
    const panel = await prisma.customerPanel.findUnique({
      where: { id: body.customerPanelId },
    });

    if (!panel)
      throw new createHttpError.NotFound("Painel não encontrado");

    const occasion = await createOccasion(body);

    return { data: occasion };
  },
  {
    public: true,
    body: createOccasionSchema,
  },
);
