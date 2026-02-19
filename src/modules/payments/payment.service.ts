import {
  City,
  Customer,
  Order,
  Payment,
  Product,
} from "@/generated/prisma/client";
import {
  PaymentStatus,
  PaymentType,
  PersonType,
} from "@/generated/prisma/enums";
import { TransactionClient } from "@/generated/prisma/internal/prismaNamespace";
import { CNPJ, env, SP_TIMEZONE } from "@/lib/env";
import { buildLinkPaymentMessage, sendMessage } from "@/lib/helena";
import { Pagarme } from "@/lib/pagarme";
import createHttpError from "http-errors";
import { DateTime } from "luxon";
import { sendBoleto } from "../message/boleto.service";

const shouldHandleInternally = (data: {
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
  customer: Customer;
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
  tx: TransactionClient;
  body: {
    type: PaymentType;
    status: PaymentStatus;
    amount: string;
    boletoDue?: string;
    orderId: string;
    productName: string;
  };
  customer: Customer;
  city: City;
};

export async function processPayment({
  tx,
  body,
  customer,
  city,
}: ProcessPaymentParams) {
  if (
    shouldHandleInternally({
      type: body.type,
      status: body.status,
    })
  ) {
    let payment = await tx.payment.create({
      data: {
        amount: body.amount,
        orderId: body.orderId,
        status: body.status,
        type: body.type,
      },
    });

    if (body.type === PaymentType.CARD_CREDIT) {
      payment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          url: `${env.NEXT_PUBLIC_WEBSITE_URL}/checkout/${payment.id}`,
        },
      });
    } else if (body.type === PaymentType.PIX_CNPJ) {
      payment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          text: CNPJ.FN,
        },
      });
    }

    return { payment };
  }

  if (body.type === PaymentType.BOLETO || body.type === PaymentType.PIX) {
    let payment = await tx.payment.create({
      data: {
        type: body.type,
        amount: body.amount,
        orderId: body.orderId,
        status: PaymentStatus.ACTIVE,
        boletoDueAt:
          body.type === PaymentType.BOLETO ? body.boletoDue : undefined,
      },
    });

    const customerName =
      customer.personType === PersonType.PJ
        ? customer.legalName!
        : customer.name;

    const paymentPayload = Pagarme.buildOrderPayload({
      id: payment.id,
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

    payment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        externalId: paymentData.id,
        url: paymentData.url,
        text: paymentData.text,
      },
    });

    return { payment };
  }

  throw new createHttpError.BadRequest("Método de pagamento desconhecido");
}
