import { PaymentStatus, PaymentType } from "@/generated/prisma/enums";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { paymentFormSchema } from "@/modules/payments/payment.dto";
import {
  notifyPayment,
  processPayment,
} from "@/modules/payments/payment.service";

export const POST = createRoute(
  async (req, { body }) => {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: body.orderId },
      include: { product: true, customer: { include: { city: true } } },
    });

    const { payment } = await processPayment({
      tx: prisma,
      body: {
        amount: body.amount,
        type: body.paymentType,
        orderId: order.id,
        status: PaymentStatus.ACTIVE,
        boletoDue:
          body.paymentType === PaymentType.BOLETO ? body.boletoDue : undefined,
        productName: order.product.name,
      },
      customer: order.customer,
      city: order.customer.city,
    });

    try {
      await notifyPayment({
        payment,
        order,
        customer: order.customer,
        product: order.product,
      });
    } catch (e) {
      console.error("Erro ao enviar mensagem para o cliente:", e);

      return "Pagamento criado com sucesso, mas houve um erro ao enviar a mensagem para o cliente.";
    }

    return "Pagamento criado com sucesso";
  },
  {
    body: paymentFormSchema,
  },
);
