import {
  PaymentStatus,
  PaymentType,
  PersonType,
} from "@/generated/prisma/enums";
import { CNPJ } from "@/lib/env";
import { createRoute } from "@/lib/handler/route-handler";
import { Pagarme } from "@/lib/pagarme";
import prisma from "@/lib/prisma";
import createHttpError from "http-errors";
import z from "zod";

export const POST = createRoute(
  async (req, { params, body }) => {
    const { id } = await params;

    const payment = await prisma.payment.update({
      where: {
        id,
        status: PaymentStatus.ACTIVE,
        type: PaymentType.CARD_CREDIT,
      },
      data: { status: PaymentStatus.PROCESSING },
      include: {
        order: {
          include: {
            product: true,
            contact: { include: { city: true } },
          },
        },
      },
    });

    try {
      const installments = Number(body.installments);
      const contact = payment.order.contact;

      const paymentPayload = Pagarme.buildOrderPayload({
        id,
        orderId: payment.order.id,
        customer: {
          name:
            contact.personType === PersonType.PJ
              ? contact.legalName!
              : contact.name,
          cpfCnpj: contact.taxId,
          personType: contact.personType,
          email: contact.email,
          phone: contact.phone,
          cep: String(contact.zipCode).padStart(8, "0"),
          street: contact.address,
          number: contact.addressNumber || "N/A",
          neighborhood: contact.neighboorhood,
          city: contact.city.name,
          state: contact.city.uf,
        },
        value: Number(payment.amount),
        product: payment.order.product.name,
        paymentMethod: "credit_card",
        card: {
          cardName: body.cardName,
          cardNumber: body.cardNumber,
          cvv: body.cvv,
          expiryDate: body.expiryDate,
          installments: installments,
        },
      });

      const cnpjType: any = CNPJ.FN;

      const pagarmeOrder = await Pagarme.createOrder(cnpjType, paymentPayload);

      await prisma.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.PAID,
          externalId: pagarmeOrder.charges[0].id,
          paidAt: new Date().toISOString(),
        },
      });

      return "Pagamento finalizado com sucesso!";
    } catch (error: any) {
      console.warn("Pagamento reprovado:", error);

      await prisma.payment.update({
        where: { id },
        data: { status: PaymentStatus.ACTIVE },
      });

      throw new createHttpError.InternalServerError(
        "Falha ao processar o pagamento na operadora.",
      );
    }
  },
  {
    body: z.object({
      installments: z.string().length(1),
      cardName: z.string().min(1),
      cardNumber: z.string().min(1),
      cvv: z.string().min(1),
      expiryDate: z.string().min(1),
    }),
  },
);
