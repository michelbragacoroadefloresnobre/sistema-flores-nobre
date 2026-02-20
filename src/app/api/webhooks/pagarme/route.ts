import {
  OrderStatus,
  Payment,
  PaymentStatus,
  PaymentType,
} from "@/generated/prisma/client";
import { sendMessage } from "@/lib/helena";
import prisma from "@/lib/prisma";
import { finishOrder } from "@/modules/orders/order.service";
import createHttpError, { isHttpError } from "http-errors";
import { NextRequest, NextResponse } from "next/server";

type PagarmeOrder = {
  id: string;
  type: "order.paid";
  created_at: string;
  data: {
    id: string;
    code?: string;
    amount?: number;
    status: "paid" | string;
    closed_at?: string;
    charges?: Array<{
      id: string;
      amount?: number;
      status: string;
      payment_method?: "credit_card" | "pix" | "boleto" | string;
      paid_at?: string;
      last_transaction?: {
        installments?: number;
        status?: string;
      };
    }>;
    customer?: {
      id?: string;
      name?: string;
      email?: string;
      document?: string;
      type?: string;
    };
    integration: {
      code: string;
    };
    metadata: any;
  };
};

export async function POST(req: NextRequest) {
  try {
    const event: PagarmeOrder = await req.json();

    if (!event.data?.code)
      throw new createHttpError.BadRequest("Evento não possui 'code'");

    console.log(JSON.stringify(event, null, 2));

    if (event.type === "order.paid") proccessPaidOrder(event);
    else if (
      event.type === "order.canceled" ||
      event.type === "checkout.canceled"
    )
      proccessCancelPayment(event);
  } catch (e: any) {
    if (isHttpError(e)) console.warn(e.message);
    else console.log("Erro desconhecido ao processar pagamento");
  }
  return new NextResponse(null);
}

async function proccessPaidOrder(event: PagarmeOrder) {
  const data = event.data;

  let payment: Payment | null = null;
  if (data.metadata?.platformVersion?.toLowerCase()?.includes("woocommerce")) {
    payment = await prisma.payment.findFirst({
      where: {
        isSiteSale: true,
        order: {
          woocommerceId: data.code,
        },
      },
    });

    if (!payment)
      throw new createHttpError.NotFound("Pedido/pagamento não encontrado");
  } else
    payment = await prisma.payment.findUnique({
      where: {
        id: data.code,
      },
    });

  if (!payment) throw new createHttpError.NotFound("Pagamento não encontrado");

  const charge = data.charges![0];

  if (!charge || charge.status !== "paid")
    throw new createHttpError.NotFound("Não é evento de pagamento");

  let paymentMethod: PaymentType = payment.type;
  if (payment.isSiteSale) {
    switch (charge.payment_method) {
      case "pix":
        paymentMethod = PaymentType.PIX;
        break;
      case "boleto":
        paymentMethod = PaymentType.BOLETO;
        break;
      case "credit_card":
        paymentMethod = PaymentType.CARD_CREDIT;
        break;
    }
  }

  let amount = data.amount;

  if (data.amount) amount = data.amount / 100;

  await prisma.payment.update({
    data: {
      status: PaymentStatus.PAID,
      amount: amount,
      type: paymentMethod,
      externalId: charge.id,
      paidAt: new Date(),
    },
    where: {
      id: payment.id,
    },
  });

  const order = await prisma.order.findUniqueOrThrow({
    where: {
      id: payment.orderId,
    },
    include: {
      contact: true,
    },
  });

  await sendMessage(
    order.contact.phone,
    `*✅ Pagamento no valor de *R$ ${((charge.amount || 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}* confirmado*\nMuito obrigado por comprar com a Coroa de Flores Nobre!\n\nPedido: *#NOBRE${order.id}*`,
  );

  if (order.orderStatus === OrderStatus.DELIVERING_DELIVERED)
    finishOrder(order.id);
}

async function proccessCancelPayment(event: PagarmeOrder) {
  const data = event.data;

  let payment: Payment | null = null;
  if (data.metadata?.platformVersion?.toLowerCase()?.includes("woocommerce")) {
    payment = await prisma.payment.findFirst({
      where: {
        isSiteSale: true,
        order: {
          woocommerceId: data.code,
        },
      },
    });

    if (!payment)
      throw new createHttpError.NotFound("Pedido/pagamento não encontrado");
  } else
    payment = await prisma.payment.findUnique({
      where: {
        id: data.code,
      },
    });

  if (!payment) throw new createHttpError.NotFound("Pagamento não encontrado");

  await prisma.payment.update({
    data: { status: PaymentStatus.CANCELLED },
    where: {
      id: payment.id,
    },
  });
}
