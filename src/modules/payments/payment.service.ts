import { City, Contact, Order, Payment } from "@/generated/prisma/client";
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
import { deliveryPeriodMap, getVariantLabel } from "@/lib/utils";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Prisma } from "@/generated/prisma/browser";
import { PAYMENT_TYPE_MAP } from "@/lib/constants";

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
  order: Prisma.OrderGetPayload<{
    include: {
      orderProducts: { include: { variant: { include: { product: true } } } };
    };
  }>;
  customer: Contact;
};

export async function notifyPayment({
  payment,
  order,
  customer,
}: NotifyPaymentParams) {
  const periodLabel = deliveryPeriodMap[order.deliveryPeriod];
  const timeFormatted =
    order.deliveryPeriod === "EXPRESS"
      ? `${formatInTimeZone(order.deliveryUntil, "America/Sao_Paulo", "dd/MM/yy HH:mm")} - ${periodLabel}`
      : `${format(order.deliveryUntil, "dd/MM/yy")} - ${periodLabel}`;

  const baseMessageParams = {
    orderId: order.id,
    honoreeName: order.honoreeName,
    deliveryLocal: `${order.deliveryAddress}, ${order.deliveryAddressNumber} - ${order.deliveryNeighboorhood} - ${order.deliveryZipCode}. ${order.deliveryAddressComplement ? `\n\n${order.deliveryAddressComplement}` : ""} `,
    tributeCard: order.tributeCardPhrase,
  };

  const uniqueProducts = order.orderProducts.reduce<
    Map<string, { name: string; quantity: number }>
  >((acc, op) => {
    const key = op.variant.id;
    const existing = acc.get(key);
    if (existing) {
      existing.quantity += 1;
    } else {
      acc.set(key, {
        name: `${op.variant.product.name} - ${getVariantLabel({ size: op.variant.size, color: op.variant.color })}`,
        quantity: 1,
      });
    }
    return acc;
  }, new Map());

  const productList = [...uniqueProducts.values()];

  if (
    shouldHandleInternally({
      type: payment.type,
      status: payment.status,
    })
  ) {
    const message = buildLinkPaymentMessage({
      ...baseMessageParams,
      payment: payment.url || payment.text || null,
      paymentType: PAYMENT_TYPE_MAP[payment.type] || null,
      deliveryHour: `Entrega até ${timeFormatted}`,
      productList
    });

    await sendMessage(customer.phone, message);
    return;
  }

  if (payment.type === PaymentType.BOLETO && payment.url) {
    const message = buildLinkPaymentMessage({
      ...baseMessageParams,
      payment: null,
      paymentType: PAYMENT_TYPE_MAP[payment.type] || null,
      deliveryHour: `Até ${timeFormatted}`,
      productList
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
      paymentType: PAYMENT_TYPE_MAP[payment.type] || null,
      deliveryHour: `Até ${timeFormatted}`,
      productList
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
        status: PaymentStatus.ACTIVE,
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
