import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";

export const POST = createRoute(async (req, { params }) => {
  await prisma.supplier.update({
    where: { id: params.id },
    data: {
      disabledUntil: null,
    },
  });

  return "Fornecedor reativado com sucesso";
});
