import { PaymentStatus } from "@/generated/prisma/enums";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";

export const DELETE = createRoute(async (req, { params }) => {
  const { id } = params;
  await prisma.payment.update({
    where: { id, status: { in: [PaymentStatus.ACTIVE, PaymentStatus.PAID] } },
    data: { status: PaymentStatus.CANCELLED },
  });
  return "Pagamento cancelado com sucesso";
});
