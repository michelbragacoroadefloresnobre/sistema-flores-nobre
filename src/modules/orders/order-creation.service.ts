import { City, Contact } from "@/generated/prisma/browser";
import {
  PaymentStatus,
  PaymentType,
  PersonType,
} from "@/generated/prisma/enums";
import { TransactionClient } from "@/generated/prisma/internal/prismaNamespace";
import { CNPJ, env } from "@/lib/env";
import { Pagarme } from "@/lib/pagarme";
import { createId } from "@paralleldrive/cuid2";
import createHttpError from "http-errors";
import { shouldHandleInternally } from "../payments/payment.service";

type ProcessPaymentParams = {
  tx: TransactionClient;
  body: {
    type: PaymentType;
    status: PaymentStatus;
    amount: string;
    boletoDue?: string;
    orderId: string;
    productName: string;
  };
  customer: Contact;
  city: City;
};

export async function createPayment({
  tx,
  body,
  customer,
  city,
}: ProcessPaymentParams) {
  const paymentId = createId();

  if (
    shouldHandleInternally({
      type: body.type,
      status: body.status,
    })
  ) {
    const payment = await tx.payment.create({
      data: {
        id: paymentId,
        amount: body.amount,
        orderId: body.orderId,
        status: body.status,
        type: body.type,
        url:
          body.type === PaymentType.CARD_CREDIT
            ? `${env.NEXT_PUBLIC_WEBSITE_URL}/checkout/${paymentId}`
            : undefined,
        text: body.type === PaymentType.PIX_CNPJ ? CNPJ.FN : undefined,
      },
    });

    return { payment };
  }

  if (body.type === PaymentType.BOLETO || body.type === PaymentType.PIX) {
    const customerName =
      customer.personType === PersonType.PJ
        ? customer.legalName!
        : customer.name;

    const paymentPayload = Pagarme.buildOrderPayload({
      id: paymentId,
      orderId: body.orderId,
      customer: {
        name: customerName,
        cpfCnpj: customer.taxId,
        personType: customer.personType,
        email: customer.email,
        phone: customer.phone,
        cep: String(customer.zipCode).padStart(8, "0"),
        street: customer.address,
        number: customer.addressNumber || "S/N",
        neighborhood: customer.neighboorhood,
        city: city.name,
        state: city.uf,
      },
      boletoDue:
        body.type === PaymentType.BOLETO
          ? new Date(body.boletoDue!)
          : undefined,
      value: Number(body.amount),
      product: body.productName,
      paymentMethod: body.type.toLowerCase() as any,
    });

    const orderPayment = await Pagarme.createOrder(CNPJ.FN, paymentPayload);
    const paymentData = Pagarme.extractPaymentData(orderPayment);

    const payment = await tx.payment.create({
      data: {
        id: paymentId,
        type: body.type,
        amount: body.amount,
        orderId: body.orderId,
        status: PaymentStatus.PROCESSING,
        boletoDueAt:
          body.type === PaymentType.BOLETO ? body.boletoDue : undefined,
        externalId: paymentData.id,
        url: paymentData.url,
        text: paymentData.text,
      },
    });

    return { payment };
  }

  throw new createHttpError.BadRequest("Método de pagamento desconhecido");
}
