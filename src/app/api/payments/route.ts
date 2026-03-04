import { PaymentStatus, PaymentType } from "@/generated/prisma/enums";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { paymentFormSchema } from "@/modules/payments/payment.dto";
import {
  createPayment,
  notifyPayment,
} from "@/modules/payments/payment.service";
import createHttpError from "http-errors";

export const POST = createRoute(
  async (req, { body }) => {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: body.orderId },
      include: { contact: { include: { city: true } } },
    });

    if(!order.contact.city) throw new createHttpError.BadRequest("Cidade do contato não cadastrada");

    const { payment } = await createPayment({
      body: {
        amount: body.amount,
        type: body.paymentType,
        orderId: order.id,
        status: PaymentStatus.ACTIVE,
        boletoDue:
          body.paymentType === PaymentType.BOLETO ? body.boletoDue : undefined,
        productName: 'Flores',
      },
      customer: order.contact,
      city: order.contact.city,
    });

    try {
      await notifyPayment({
        payment,
        order,
        customer: order.contact,
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
