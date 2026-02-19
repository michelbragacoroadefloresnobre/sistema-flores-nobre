import { OrderStatus, SupplierPanelStatus } from "@/generated/prisma/enums";
import { SP_TIMEZONE } from "@/lib/env";
import { createRoute } from "@/lib/handler/route-handler";
import { sendMessage } from "@/lib/helena";
import prisma from "@/lib/prisma";
import { finishOrder } from "@/modules/orders/order.service";
import { isHttpError } from "http-errors";
import { DateTime } from "luxon";
import z from "zod";

export const POST = createRoute(
  async (req, { params, body }) => {
    console.log({ body });

    const { order } = await prisma.$transaction(async (tx) => {
      const supplierPanels = await tx.supplierPanel.updateManyAndReturn({
        where: {
          id: params.id,
          status: SupplierPanelStatus.CONFIRMED,
          order: {
            orderStatus: OrderStatus.DELIVERING_ON_ROUTE,
          },
        },
        data: {
          deliveredAt: new Date(body.deliveredAt),
          receiverName: body.receiverName,
        },
      });

      if (!supplierPanels[0])
        throw new Error("Painel não encontrado ou não confirmado");

      const order = await tx.order.update({
        where: {
          id: supplierPanels[0].orderId,
        },
        data: {
          orderStatus: OrderStatus.DELIVERING_DELIVERED,
        },
        include: { contact: true },
      });

      return { order, supplierPanel: supplierPanels[0] };
    });

    try {
      await finishOrder(order.id);
    } catch (e: any) {
      if (isHttpError(e)) console.warn(e.message);
      else console.error("Erro ao finalizar pedido:", e);
    }

    await sendMessage(
      order.contact.phone,
      `*🌸 Pedido entregue.*\nSeu pedido foi entregue com sucesso. Agradecemos a confiança.\n\n` +
        `Entregue em:\n${DateTime.fromJSDate(new Date(body.deliveredAt), { zone: SP_TIMEZONE }).toFormat("dd/MM/yy 'às' HH:mm")}\n\n` +
        `Pedido:\n #NOBRE${order.id}`,
    );

    return "Entrega confirmada com sucesso!";
  },
  {
    public: true,
    body: z.object({
      receiverName: z.string().min(1),
      deliveredAt: z.coerce.date(),
    }),
  },
);
