import {
  OrderStatus,
  SupplierPanelPhotoStatus,
  SupplierPanelStatus,
} from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { sendMessageToSupplier } from "@/lib/zapi";
import createHttpError from "http-errors";
import z from "zod";

export const POST = createRoute(
  async (req, { body, params }) => {
    if (
      body.status === SupplierPanelPhotoStatus.REJECTED &&
      !body.rejectionReason
    )
      throw new createHttpError.BadRequest("Especifique o motivo");

    const { imageId, id } = params;

    const { isStartDelivering } = await prisma.$transaction(async (tx) => {
      const spPhoto = await tx.supplierPanelPhoto.update({
        data: {
          status: body.status,
          rejectionReason: body.rejectionReason || undefined,
        },
        where: {
          id: imageId,
          status: SupplierPanelPhotoStatus.SUBMITTED,
          imageUrl: { not: null },
        },
      });
      const all = await tx.supplierPanelPhoto.findMany({
        where: {
          supplierPanelId: spPhoto.supplierPanelId,
        },
      });

      const isStartDelivering = all.every(
        (spp) => spp.status === SupplierPanelPhotoStatus.APPROVED,
      );

      if (isStartDelivering) {
        await prisma.order.updateMany({
          data: {
            orderStatus: OrderStatus.DELIVERING_ON_ROUTE,
          },
          where: {
            orderStatus: OrderStatus.PRODUCING,
            supplierPanels: {
              some: {
                id: spPhoto.supplierPanelId,
                status: SupplierPanelStatus.CONFIRMED,
              },
            },
          },
        });
      }
      return { isStartDelivering };
    });

    const supplierPanel = await prisma.supplierPanel.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        order: true,
        supplier: true,
      },
    });

    try {
      if (supplierPanel.supplier.jid) {
        if (
          body.status === SupplierPanelPhotoStatus.APPROVED &&
          isStartDelivering
        )
          await sendMessageToSupplier(
            supplierPanel.supplier.jid,
            `✅ Pedido liberado para entrega. Por favor, confirme a entrega pelo painel abaixo:\n${env.NEXT_PUBLIC_WEBSITE_URL}/painel/${supplierPanel.id}\n\nPedido:\n *#NOBRE${supplierPanel.orderId}*`,
          );
        else
          await sendMessageToSupplier(
            supplierPanel.supplier.jid,
            `❌ A foto enviada foi rejeitada pelo seguinte motivo:\n*${body.rejectionReason}*\n\nPor favor, envie uma nova foto pelo painel abaixo:\n${env.NEXT_PUBLIC_WEBSITE_URL}/painel/${supplierPanel.id}\n\nPedido:\n *#NOBRE${supplierPanel.orderId}*`,
          );
      }
    } catch (e: any) {
      console.error(
        "Erro ao enviar confirmação de aprovação:",
        e.response?.data || e,
      );
      return "Foto aprovada com sucesso, mas houve um erro ao enviar notificação para o fornecedor";
    }

    return `Foto ${body.status === SupplierPanelPhotoStatus.APPROVED ? "aprovada" : "recusada"} com sucesso!`;
  },
  {
    body: z.object({
      status: z.enum([
        SupplierPanelPhotoStatus.REJECTED,
        SupplierPanelPhotoStatus.APPROVED,
      ]),
      rejectionReason: z.string().nullish(),
    }),
  },
);
