import { OrderStatus, SupplierPanelStatus } from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import { sendMessage } from "@/lib/helena";
import prisma from "@/lib/prisma";
import { scheduleUrlCall } from "@/lib/scheduler";
import { buildConfirmationMessage, sendMessageToSupplier } from "@/lib/zapi";
import { format, subSeconds } from "date-fns";
import createHttpError from "http-errors";
import { NextRequest, NextResponse } from "next/server";
import { NewWhatsAppButtonCallback } from "./type";

export async function POST(req: NextRequest) {
  const body: NewWhatsAppButtonCallback | undefined = await req.json();

  if (!body) return new NextResponse(null);

  console.log(JSON.stringify(body, null, 2));

  const buttonId = body.buttonsResponseMessage?.buttonId;
  if (!buttonId) return new NextResponse(null);

  try {
    if (buttonId.startsWith("cancel_"))
      await handleCancelOrder(buttonId.replace("cancel_", ""), body.phone);
    else if (buttonId.startsWith("approve_"))
      await handleApproveOrder(buttonId.replace("approve_", ""), body.phone);
  } catch (e) {
    console.error("Erro no webhook da zapi:", e);
    return NextResponse.json({ buttonId });
  }

  return NextResponse.json({ buttonId });
}

async function handleCancelOrder(panelId: string, phone: string) {
  console.log({ panelId, phone });

  await prisma.$transaction(async (tx) => {
    const supplierPanels = await tx.supplierPanel.updateManyAndReturn({
      data: {
        status: SupplierPanelStatus.CANCELLED,
      },
      where: {
        id: panelId,
        status: {
          in: [SupplierPanelStatus.CONFIRMED, SupplierPanelStatus.WAITING],
        },
        order: {
          orderStatus: {
            in: [
              OrderStatus.PENDING_WAITING,
              OrderStatus.PENDING_PREPARATION,
              OrderStatus.PRODUCING_PREPARATION,
              OrderStatus.PRODUCING_CONFIRMATION,
              OrderStatus.DELIVERING_ON_ROUTE,
            ],
          },
        },
      },
      include: { order: true },
    });

    if (!supplierPanels[0]) {
      await sendMessageToSupplier(phone, "❌ Ação não está mais indisponivel");
      throw new createHttpError.BadRequest("Ação não está mais disponivel");
    }
    const supplierPanel = supplierPanels[0];

    const order = await tx.order.update({
      where: { id: supplierPanel.orderId },
      data: { orderStatus: OrderStatus.PENDING_CANCELLED },
      include: { contact: true, product: true },
    });

    return { order };
  });

  await sendMessageToSupplier(phone, "✅ Pedido recusado com sucesso!");
}

async function handleApproveOrder(panelId: string, phone: string) {
  console.log({ panelId, phone });

  const { order } = await prisma.$transaction(async (tx) => {
    const supplierPanels = await tx.supplierPanel.updateManyAndReturn({
      data: {
        status: SupplierPanelStatus.CONFIRMED,
      },
      where: {
        id: panelId,
        status: SupplierPanelStatus.WAITING,
        order: {
          orderStatus: OrderStatus.PENDING_WAITING,
        },
      },
      include: { order: true },
    });

    if (!supplierPanels[0]) {
      await sendMessageToSupplier(phone, "❌ Ação não está mais indisponivel");
      throw new createHttpError.BadRequest("Ação não está mais disponivel");
    }
    const supplierPanel = supplierPanels[0];

    const order = await tx.order.update({
      where: { id: supplierPanel.orderId },
      data: { orderStatus: OrderStatus.PRODUCING_PREPARATION },
      include: { contact: true, product: true },
    });

    return { order };
  });

  const triggerAt = subSeconds(order.deliveryUntil, 1800);

  try {
    await scheduleUrlCall({
      triggerAt,
      url: `${env.NEXT_PUBLIC_WEBSITE_URL}/api/webhooks/orders/warn-late-photo`,
      data: {
        panelId,
      },
    });
  } catch (e: any) {
    console.error("Erro ao cadastrar scheduler", e.response?.data || e);
  }

  try {
    const message = buildConfirmationMessage({
      panelId,
      orderId: order.id,
      honoreeName: order.honoreeName,
      deliveryLocal: `${order.deliveryAddress || ""}`,
      time: format(order.deliveryUntil, "dd/MM/yyyy HH:mm"),
      tributeCardPhrase: order.tributeCardPhrase,
      productName: order.product.name,
      size: order.product.size,
      supplierNote: order.supplierNote,
    });

    await sendMessageToSupplier(phone, message);
  } catch (e: any) {
    console.error("Erro ao enviar confirmação:", e.response?.data || e);
  }

  await sendMessage(
    order.contact.phone,
    `PEDIDO 📦 #NOBRE${order.id}\n\n*💐 Pedido em produção*\nEstamos montando sua coroa de flores com todo o cuidado. Avisaremos quando estiver pronta`,
  );
}
