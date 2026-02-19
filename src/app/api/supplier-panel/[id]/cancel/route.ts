import { OrderStatus, SupplierPanelStatus } from "@/generated/prisma/enums";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import createHttpError from "http-errors";

export const POST = createRoute(async (req, { params }) => {
  try {
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.supplierPanel.updateMany({
        data: {
          status: SupplierPanelStatus.CANCELLED,
        },
        where: {
          id: params.id,
          status: SupplierPanelStatus.WAITING,
          order: {
            orderStatus: OrderStatus.PENDING_WAITING,
          },
        },
      });

      if (!count)
        throw new createHttpError.BadRequest("Este pedido já foi processado");

      await tx.order.updateMany({
        data: { orderStatus: OrderStatus.PENDING_CANCELLED },
        where: {
          supplierPanels: { some: { id: params.id } },
        },
      });
    });
  } catch (e) {
    throw e;
  }

  return "Cancelado com sucesso";
});
