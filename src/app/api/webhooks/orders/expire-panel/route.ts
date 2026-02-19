import { OrderStatus, SupplierPanelStatus } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { sendMessageToSupplier } from "@/lib/zapi";
import createHttpError from "http-errors";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { panelId, minutesToExpire } = await request.json();

  const { phone, orderId } = await prisma.$transaction(async (tx) => {
    const panels = await tx.supplierPanel.updateManyAndReturn({
      data: {
        status: SupplierPanelStatus.CANCELLED,
      },
      where: {
        id: panelId,
        status: SupplierPanelStatus.WAITING,
        order: {
          orderStatus: OrderStatus.PENDING_WAITING,
        },
      },
      include: {
        supplier: true,
      },
    });

    if (!panels[0])
      throw new createHttpError.NotFound(
        "Painel não disponivel para está ação",
      );

    const panel = panels[0];

    if (!panel)
      throw new createHttpError.NotFound("Painel do pedido não encontrado");

    const order = await tx.order.update({
      where: {
        id: panel.orderId,
      },
      data: {
        orderStatus: OrderStatus.PENDING_CANCELLED,
      },
    });

    return { phone: panel.supplier.jid, orderId: order.id };
  });

  await sendMessageToSupplier(
    phone,
    `O prazo para aprovação do pedido expirou.\n\nO tempo máximo para aprovar o pedido é de ${
      minutesToExpire
    } minutos.\n\nPedido: *#NOBRE${orderId}*`,
  );

  return NextResponse.json({ message: "Expirado com sucesso" });
}
