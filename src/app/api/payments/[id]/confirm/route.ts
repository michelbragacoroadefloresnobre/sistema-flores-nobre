import { PaymentStatus } from "@/generated/prisma/enums";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { sendPromotionalMessage } from "@/modules/payments/payment.service";

export const POST = createRoute(async (req, { params }) => {
  const { id } = params;

  const payment = await prisma.payment.update({
    where: { id, status: PaymentStatus.ACTIVE },
    data: { status: PaymentStatus.PAID },
    include: { order: { include: { contact: true } } },
  });

  sendPromotionalMessage(payment.order.contact.phone, payment.order.id)
    .catch((e) => console.error("[Promocional] Erro ao enviar:", e));

  return "Pagamento confirmado com sucesso";
});
