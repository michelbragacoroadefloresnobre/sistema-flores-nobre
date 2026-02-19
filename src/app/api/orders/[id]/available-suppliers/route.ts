import { SupplierPanelStatus } from "@/generated/prisma/enums";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import createHttpError from "http-errors";

export const revalidate = 0;

export const GET = createRoute(async (req, { params }) => {
  const order = await prisma.order.findUnique({
    where: {
      id: params?.id,
    },
  });

  if (!order)
    throw new createHttpError.NotFound("Fornecedores não disponiveis");

  const suppliers = await prisma.supplier.findMany({
    where: {
      OR: [{ disabledUntil: null }, { disabledUntil: { lt: new Date() } }],
      coverageAreas: {
        some: {
          start: { lte: order.deliveryZipCode },
          end: { gte: order.deliveryZipCode },
        },
      },
    },
    include: {
      supplierPanels: {
        where: { orderId: order.id, status: SupplierPanelStatus.CANCELLED },
      },
    },
  });

  return {
    data: suppliers,
  };
});
