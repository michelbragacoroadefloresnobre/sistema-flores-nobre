import { OrderStatus, SupplierPanelStatus } from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import { sendMessageToSupplier } from "@/lib/zapi";
import createHttpError from "http-errors";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { panelId } = await request.json();

  const panel = await prisma.supplierPanel.findUnique({
    where: {
      id: panelId,
      status: SupplierPanelStatus.CONFIRMED,
      order: {
        orderStatus: OrderStatus.DELIVERING_ON_ROUTE,
      },
    },
    include: {
      supplier: true,
      order: { include: { product: true } },
    },
  });

  if (!panel) throw createHttpError.NotFound("");

  const triggerAt = panel.order.deliveryUntil;

  if (triggerAt <= new Date() && panel.supplier.jid)
    await sendMessageToSupplier(
      panel.supplier.jid,
      `⚠️ O pedido *#NOBRE${panel.order.id}* está com a entrega atrasada\n\n` +
        "📳 Por favor confirme a entrega pelo painel assim que concluída:\n" +
        `${env.NEXT_PUBLIC_WEBSITE_URL}/painel/${panel.id}`,
    );

  return new NextResponse(null, { status: 204 });
}
