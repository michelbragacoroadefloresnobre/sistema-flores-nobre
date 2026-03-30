import { PaymentStatus } from "@/generated/prisma/enums";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { finishOrder } from "@/modules/orders/order.service";

export const POST = createRoute(async (req, { params }) => {
  const { id } = params;

  const payment = await prisma.payment.update({
    where: { id, status: PaymentStatus.ACTIVE },
    data: { status: PaymentStatus.PAID },
    include: { order: { include: { contact: true } } },
  });

  finishOrder(payment.orderId).catch(() => {});

  finishOrder(payment.orderId).catch(() => {});

  return "Pagamento confirmado com sucesso";
});
