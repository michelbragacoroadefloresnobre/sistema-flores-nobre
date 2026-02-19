import { PaymentStatus } from "@/generated/prisma/enums";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";

export const POST = createRoute(async (req, { params }) => {
  const { id } = params;

  await prisma.payment.update({
    where: { id, status: PaymentStatus.ACTIVE },
    data: { status: PaymentStatus.PAID },
  });

  return "Pagamento confirmado com sucesso";
});
