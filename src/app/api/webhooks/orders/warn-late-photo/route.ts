import { OrderStatus, SupplierPanelStatus } from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import { sendMessageToSupplier } from "@/lib/zapi";
import { subSeconds } from "date-fns";
import createHttpError from "http-errors";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { panelId } = await request.json();

  const panel = await prisma.supplierPanel.findUnique({
    where: {
      id: panelId,
      status: SupplierPanelStatus.CONFIRMED,
      order: {
        orderStatus: OrderStatus.PRODUCING_PREPARATION,
      },
    },
    include: {
      supplier: true,
      order: { include: { product: true } },
    },
  });

  if (!panel) throw createHttpError.NotFound("");

  const triggerAt = subSeconds(panel.order.deliveryUntil, 1800);

  if (triggerAt < new Date() && panel.supplier.jid)
    await sendMessageToSupplier(
      panel.supplier.jid,
      `⚠️ Precisamos da foto do produto: *${panel.order.product.name}*.\n\n` +
        `Pedido: *#NOBRE${panel.order.id}*\n\n` +
        `📳 Por favor envie a foto pelo painel:\n${env.NEXT_PUBLIC_WEBSITE_URL}/painel/${panel.id}`,
    );

  return new NextResponse(null, { status: 204 });
}
