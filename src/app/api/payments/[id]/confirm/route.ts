import { PaymentStatus } from "@/generated/prisma/enums";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { createCustomerPanelAndNotify } from "@/modules/occasions/occasion.service";

export const POST = createRoute(async (req, { params }) => {
  const { id } = params;

  const payment = await prisma.payment.update({
    where: { id, status: PaymentStatus.ACTIVE },
    data: { status: PaymentStatus.PAID },
    include: { order: { include: { contact: true } } },
  });

  createCustomerPanelAndNotify(payment.order.contact.phone)
    .catch((e) => console.error("[Ocasiões] Erro ao criar painel:", e));

  return "Pagamento confirmado com sucesso";
});
