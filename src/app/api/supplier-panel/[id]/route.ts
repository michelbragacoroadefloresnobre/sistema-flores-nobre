import { OrderStatus, SupplierPanelStatus } from "@/generated/prisma/enums";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import createHttpError from "http-errors";
import z from "zod";

export const PATCH = createRoute(
  async (req, { body, params }) => {
    const { id } = params;

    await prisma.supplierPanel.update({
      data: {
        cost: Number(body.cost) || undefined,
        freight: Number(body.freight) || undefined,
      },
      where: { id, status: SupplierPanelStatus.CONFIRMED },
    });

    return "Valor atualizado com sucesso!";
  },
  {
    body: z.object({
      cost: z.string(),
      freight: z.string(),
    }),
  },
);

export const DELETE = createRoute(
  async (req, { searchParams, params }) => {
    const { reason } = searchParams;
    const { id: panelId } = params;

    await prisma.$transaction(async (tx) => {
      const { count } = await tx.supplierPanel.updateMany({
        data: {
          status: SupplierPanelStatus.CANCELLED,
          cancelReason: reason,
        },
        where: {
          id: panelId,
          status: SupplierPanelStatus.CONFIRMED,
        },
      });

      if (!count) throw new createHttpError.NotFound("Painel não encontrado");

      await tx.order.updateMany({
        data: { orderStatus: OrderStatus.PENDING_CANCELLED },
        where: {
          supplierPanels: { some: { id: panelId } },
        },
      });
    });

    return "Pedido cancelado com sucesso";
  },
  {
    public: true,
    searchParams: z.object({
      reason: z.string().min(1),
    }),
  },
);
