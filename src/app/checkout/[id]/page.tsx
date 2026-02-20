import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import createHttpError, { isHttpError } from "http-errors";
import { CheckoutPage } from "./_components/checkout-page";
import { CheckoutSuccess } from "./_components/success-page";

export default async function Page({ params }: { params }) {
  const { id } = await params;

  try {
    const payment = await prisma.payment.findUnique({
      where: {
        id,
        order: {
          orderStatus: {
            in: [
              OrderStatus.PENDING_PREPARATION,
              OrderStatus.PENDING_CANCELLED,
              OrderStatus.PENDING_WAITING,
              OrderStatus.PRODUCING_PREPARATION,
              OrderStatus.PRODUCING_CONFIRMATION,
              OrderStatus.DELIVERING_ON_ROUTE,
              OrderStatus.DELIVERING_DELIVERED,
              OrderStatus.FINALIZED,
            ],
          },
        },
      },
      include: { order: { include: { product: true } } },
    });

    if (!payment)
      throw new createHttpError.NotFound("Este link foi cancelado ou expirado");

    if (payment.status === PaymentStatus.PAID)
      return <CheckoutSuccess payment={payment} />;

    if (payment.status !== PaymentStatus.ACTIVE)
      throw new createHttpError.BadRequest(
        "Este link foi cancelado ou expirado",
      );

    return <CheckoutPage payment={serialize(payment) as typeof payment} />;
  } catch (e) {
    let message = "Erro desconhecido. Contate o suporte";
    if (isHttpError(e)) {
      console.error("Status:", e.statusCode);
      message = e.message;
    } else console.error("Erro ao buscar pagamento:", e);
    return (
      <div className="flex justify-center items-center text-destructive grow">
        {message}
      </div>
    );
  }
}
