import { OrderStatus, SupplierPanelStatus } from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { scheduleUrlCall } from "@/lib/scheduler";
import {
  buildRequestMessage,
  sendMessageToSupplierWithButtons,
} from "@/lib/zapi";
import { format } from "date-fns";
import createHttpError from "http-errors";
import { DateTime } from "luxon";
import z from "zod";

export const POST = createRoute(
  async (req, { body }) => {
    const { supplierId, orderId } = body;

    const { supplierPanel, order } = await prisma.$transaction(async (tx) => {
      const orders = await tx.order.updateManyAndReturn({
        data: { orderStatus: OrderStatus.PENDING_WAITING },
        where: {
          id: orderId,
          orderStatus: {
            in: [
              OrderStatus.PENDING_PREPARATION,
              OrderStatus.PENDING_CANCELLED,
            ],
          },
        },
        include: {
          product: true,
        },
      });

      if (!orders[0])
        throw new createHttpError.BadRequest("Operação não disponivel");

      const order = orders[0];

      const supplier = await tx.supplier.findUniqueOrThrow({
        where: { id: supplierId },
        include: {
          coverageAreas: {
            where: {
              start: { lte: order.deliveryZipCode },
              end: { gte: order.deliveryZipCode },
            },
          },
          products: {
            where: {
              productId: order.productId,
              supplierId,
            },
          },
        },
      });

      if (!supplier.coverageAreas[0] || !supplier.products[0])
        throw new createHttpError.BadRequest(
          "Este fornecedor não é aplicavel para este pedido",
        );

      const expiresIn = 10;
      const supplierPanel = await tx.supplierPanel.create({
        data: {
          orderId: orderId,
          supplierId: supplierId,
          status: SupplierPanelStatus.WAITING,
          expireAt: DateTime.now().plus({ minutes: expiresIn }).toJSDate(),
          freight: supplier.coverageAreas[0].freight,
          cost: supplier.products[0].amount,
        },
        include: {
          supplier: true,
        },
      });

      await scheduleUrlCall({
        triggerIn: expiresIn * 60,
        url: `${env.NEXT_PUBLIC_WEBSITE_URL}/api/webhooks/orders/expire-panel`,
        data: {
          panelId: supplierPanel.id,
          minutesToExpire: expiresIn,
        },
      });

      return {
        supplierPanel,
        order: orders[0],
      };
    });

    const message = buildRequestMessage({
      orderId: order.id,
      deliveryLocal: `${order.deliveryAddress || ""}`,
      time: format(order.deliveryUntil, "dd/MM/yyyy HH:mm"),
      productName: order.product.name,
      size: order.product.size,
      supplierNote: order.supplierNote,
    });

    try {
      await sendMessageToSupplierWithButtons(
        supplierPanel.supplier.jid,
        message,
        [
          {
            id: `cancel_${supplierPanel.id}`,
            label: "Recusar",
          },
          {
            id: `approve_${supplierPanel.id}`,
            label: "Aceitar",
          },
        ],
      );
    } catch (e: any) {
      console.error(
        "Erro ao enviar mensagem de aceite para fornecedor:",
        e.response?.data || e,
      );
    }

    return "Fornecedor selecionado com sucesso";
  },
  {
    body: z.object({
      supplierId: z.string().min(1),
      orderId: z.string().min(1),
    }),
  },
);
