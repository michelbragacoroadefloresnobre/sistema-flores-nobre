import { OrderStatus, SupplierPanelStatus } from "@/generated/prisma/enums";
import { PaymentUtils } from "@/lib/payment-utils";
import prisma from "@/lib/prisma";
import createHttpError from "http-errors";

export async function finishOrder(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId, orderStatus: OrderStatus.DELIVERING_DELIVERED },
    include: {
      payments: true,
      supplierPanels: {
        where: { status: SupplierPanelStatus.CONFIRMED },
      },
    },
  });

  if (PaymentUtils.hasRequiredPayments(order.payments))
    throw new createHttpError.BadRequest("Pedido possui pagamentos em aberto");

  const supplierPanel = order.supplierPanels[0];

  if (!supplierPanel.cost)
    throw new createHttpError.BadRequest("Custo de repasse não definido");

  await prisma.order.update({
    data: { orderStatus: OrderStatus.FINALIZED },
    where: {
      id: orderId,
    },
  });
}
