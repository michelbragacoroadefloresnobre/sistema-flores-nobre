import {
  DeliveryPeriod,
  OrderStatus,
  SupplierPanelPhotoStatus,
  SupplierPanelStatus,
} from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { scheduleUrlCall } from "@/lib/scheduler";
import { deliveryPeriodMap, getVariantLabel } from "@/lib/utils";
import {
  buildItemMessage,
  buildRequestMessage,
  sendMessageToSupplierWithButtons,
  sendPhotoToSupplier,
} from "@/lib/zapi";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import createHttpError from "http-errors";
import { DateTime } from "luxon";
import z from "zod";

export const POST = createRoute(
  async (req, { body }) => {
    const { supplierId, orderId } = body;

    const { supplierPanel, order, orderProducts } = await prisma.$transaction(async (tx) => {
      const orderProducts = await tx.orderProduct.findMany({
        where: {
          orderId: orderId,
        },
        include: {
          variant: {
            include: { product: true },
          },
        },
      });

      if (orderProducts.length === 0)
        throw new createHttpError.BadRequest("Pedido não possui produtos");

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
          start: { lte: Number(order.deliveryZipCode) },
          end: { gte: Number(order.deliveryZipCode) },
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
            create: orderProducts.map((op) => ({
              status: SupplierPanelPhotoStatus.PENDING,
              orderProductId: op.id,
            })),
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
        orderProducts,
      };
    });

    const periodLabel = deliveryPeriodMap[order.deliveryPeriod];
    const timeFormatted =
      order.deliveryPeriod === DeliveryPeriod.EXPRESS
        ? `${formatInTimeZone(order.deliveryUntil, "America/Sao_Paulo", "dd/MM/yy HH:mm")} - ${periodLabel}`
        : `${format(order.deliveryUntil, "dd/MM/yy")} - ${periodLabel}`;

    const message = buildRequestMessage({
      orderId: order.id,
      deliveryLocal: `${order.deliveryAddress}, ${order.deliveryAddressNumber} - ${order.deliveryNeighboorhood} - ${order.deliveryZipCode}. ${order.deliveryAddressComplement ? `\n\nComplemento: ${order.deliveryAddressComplement}` : ""} `,
      time: timeFormatted,
      supplierNote: order.supplierNote,
    });

    const photosUrls = orderProducts.map(op => op.variant.imageUrl)

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
        photosUrls,
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
