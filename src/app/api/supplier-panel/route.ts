import {
  OrderStatus,
  SupplierPanelPhotoStatus,
  SupplierPanelStatus,
} from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { scheduleUrlCall } from "@/lib/scheduler";
import { getVariantLabel } from "@/lib/utils";
import {
  buildItemMessage,
  buildRequestMessage,
  sendMessageToSupplierWithButtons,
  sendPhotoToSupplier,
} from "@/lib/zapi";
import { format } from "date-fns";
import createHttpError from "http-errors";
import { DateTime } from "luxon";
import z from "zod";

export const POST = createRoute(
  async (req, { body }) => {
    const { supplierId, orderId } = body;

    const orderProducts = await prisma.orderProduct.findMany({
        where: {
          orderId: orderId,
        },
        include: {
          variant: { include: { product: true } },
        },
      });

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
      });

      const order = orders[0];
      if (!order)
        throw new createHttpError.BadRequest("Operação não disponivel");     

      const coverageArea = await tx.coverageArea.findFirst({
        where: {
          supplierId,
          start: { lte: order.deliveryZipCode },
          end: { gte: order.deliveryZipCode },
        },
      });

      if (!coverageArea)
        throw new createHttpError.BadRequest(
          "Fornecedor invalido para este pedido",
        );

      const productConditions = orderProducts.map((op) => ({
        productId: op.variant.productId,
        size: op.variant.size,
      }));

      const supplierProducts = await tx.productSupplier.findMany({
        where: {
          supplierId: supplierId,
          OR: productConditions,
        },
      });

      const totalCost = orderProducts.reduce((total, op) => {
        const sp = supplierProducts.find(
          (sp) =>
            sp.productId === op.variant.productId &&
            sp.size === op.variant.size,
        );
        return total + (Number(sp?.amount) || 0);
      }, 0);

      const expiresIn = 30;
      const supplierPanel = await tx.supplierPanel.create({
        data: {
          orderId: orderId,
          supplierId: supplierId,
          status: SupplierPanelStatus.WAITING,
          expireAt: DateTime.now().plus({ minutes: expiresIn }).toJSDate(),
          freight: coverageArea.freight,
          cost: totalCost || undefined,
          supplierPanelPhotos: {
            createMany: {
              data: orderProducts.map((op) => ({
                status: SupplierPanelPhotoStatus.PENDING,
                orderProductId: op.id,
              })),
            },
          },
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
      supplierNote: order.supplierNote,
    });

    try {
      const messageWithBUttonsResponse = await sendMessageToSupplierWithButtons(
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

      orderProducts.forEach(async (op) => {
        const itemMessage = buildItemMessage({ itemName: `${op.variant.product.name} - ${getVariantLabel({ size: op.variant.size, color: op.variant.color })}` }); 
        await sendPhotoToSupplier(supplierPanel.supplier.jid, itemMessage, op.variant.imageUrl, messageWithBUttonsResponse.messageId)
      });
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
