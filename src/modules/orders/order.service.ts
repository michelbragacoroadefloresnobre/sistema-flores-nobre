import { OrderStatus, SupplierPanelStatus } from "@/generated/prisma/enums";
import { env, SP_TIMEZONE } from "@/lib/env";
import { PaymentUtils } from "@/lib/payment-utils";
import prisma from "@/lib/prisma";
import axios from "axios";
import createHttpError from "http-errors";
import { DateTime } from "luxon";

export async function finishOrder(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId, orderStatus: OrderStatus.DELIVERING_DELIVERED },
    include: {
      payments: true,
      supplierPanels: {
        where: { status: SupplierPanelStatus.CONFIRMED },
      },
    },
  });

  if (PaymentUtils.hasRequiredPayments(order.payments))
    throw new createHttpError.BadRequest("Pedido possui pagamentos em aberto");

  const supplierPanel = order.supplierPanels[0];

  if (!supplierPanel.cost)
    throw new createHttpError.BadRequest("Custo de repasse não definido");

  await prisma.order.update({
    data: { orderStatus: OrderStatus.FINALIZED },
    where: {
      id: orderId,
    },
  });

  sendConversionToN8n(orderId).catch((e) =>
    console.error("Erro ao enviar conversão para n8n:", e),
  );
}

async function sendConversionToN8n(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      contact: true,
      orderProducts: {
        include: { variant: true },
      },
    },
  });

  const twoMonthsAgo = DateTime.now()
    .setZone(SP_TIMEZONE)
    .minus({ months: 2 })
    .toJSDate();

  const form = await prisma.form.findFirst({
    where: {
      phone: order.contact.phone,
      createdAt: { gte: twoMonthsAgo },
      OR: [
        { gclid: { not: null } },
        { gbraid: { not: null } },
        { wbraid: { not: null } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const valorVenda = order.orderProducts.reduce(
    (sum, op) => sum + (op.variant.price?.toNumber() ?? 0),
    0,
  );

  await axios.post(`${env.N8N_URL}/webhook/fn-conversion`, {
    ClienteNome: order.contact.name,
    ClienteEmail: order.contact.email,
    ClienteTelefone: order.contact.phone,
    ValorVenda: valorVenda,
    FinalizadoEm: DateTime.now()
      .setZone(SP_TIMEZONE)
      .toFormat("yyyy-MM-dd HH:mm:ssZZ"),
    Gclid: form?.gclid || "",
    Gbraid: form?.gbraid || "",
    Wbraid: form?.wbraid || "",
    PedidoId: order.id,
  });
}
