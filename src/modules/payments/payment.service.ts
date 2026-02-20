import {
  City,
  Contact,
  Order,
  Payment,
  Product,
} from "@/generated/prisma/client";
import {
  PaymentStatus,
  PaymentType,
  PersonType,
} from "@/generated/prisma/enums";
import { CNPJ, env, SP_TIMEZONE } from "@/lib/env";
import { buildLinkPaymentMessage, sendMessage } from "@/lib/helena";
import { Pagarme } from "@/lib/pagarme";
import prisma from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import createHttpError from "http-errors";
import { DateTime } from "luxon";
import { sendBoleto } from "../message/boleto.service";

export const shouldHandleInternally = (data: {
  type: PaymentType;
  status: PaymentStatus;
}) => {
  const isManualType = [
    PaymentType.MONEY,
    PaymentType.PATNERSHIP,
    PaymentType.PIX_CNPJ,
    PaymentType.CARD_CREDIT,
  ].includes(data.type as any);

  const isAlreadyPaid = data.status === PaymentStatus.PAID;

  return isManualType || isAlreadyPaid;
};

type NotifyPaymentParams = {
  payment: Payment;
  order: Order;
  customer: Contact;
  product: Product;
};

export async function notifyPayment({
  payment,
  order,
  customer,
  product,
}: NotifyPaymentParams) {
  const formattedDate = DateTime.fromJSDate(order.deliveryUntil)
    .setZone(SP_TIMEZONE)
    .toFormat("HH:mm 'do dia' dd 'de' LLLL");

  const baseMessageParams = {
    orderId: order.id,
    honoreeName: order.honoreeName,
    deliveryLocal: order.deliveryAddress,
    tributeCard: order.tributeCardPhrase,
    product: product.name,
    size: product.size,
  };

  if (
    shouldHandleInternally({
      type: payment.type,
      status: payment.status,
    })
  ) {
    const message = buildLinkPaymentMessage({
      ...baseMessageParams,
      payment: payment.url || payment.text || null,
      deliveryHour: `Entrega até ${formattedDate}`,
    });

    await sendMessage(customer.phone, message);
    return;
  }

  if (payment.type === PaymentType.BOLETO && payment.url) {
    const message = buildLinkPaymentMessage({
      ...baseMessageParams,
      payment: null,
      deliveryHour: `Até ${formattedDate}`,
    });

    // scheduleBoletoDueNotification logic here if needed...

    await sendBoleto({
      orderId: order.id,
      message,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      pdfLink: payment.url,
    });
    return;
  }

  if (payment.type === PaymentType.PIX && payment.text && payment.url) {
    const message = buildLinkPaymentMessage({
      ...baseMessageParams,
      payment: null,
      deliveryHour: `Até ${formattedDate}`,
    });

    await sendMessage(customer.phone, message);
    await sendMessage(customer.phone, payment.text, payment.url);
    return;
  }

  console.error("Erro na notificação de pagamento:", { payment });
  throw new createHttpError.InternalServerError("Pagamento mal formatado");
}

type ProcessPaymentParams = {
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
    const payment = await prisma.payment.create({
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

    const payment = await prisma.payment.create({
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
