import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { supplierFormSchema } from "@/modules/suppliers/dtos/supplier-form.dto";
import createHttpError from "http-errors";

export const PUT = createRoute(
  async (req, { body, params }) => {
    await prisma.productSupplier.deleteMany({
      where: {
        supplierId: params.id,
      },
    });
    await prisma.coverageArea.deleteMany({
      where: {
        supplierId: params.id,
      },
    });
    await prisma.supplier.update({
      where: { id: params.id },
      data: {
        name: body.name,
        email: body.email,
        cnpj: body.cnpj,
        phone: body.phone,
        jid: body.isRatified ? body.groupId : undefined,
        isRatified: body.isRatified,
        products: {
          create: body.products.map((p) => ({
            productId: p.id,
            amount: Number(p.amount) || undefined,
            rating: p.rating || 0,
          })),
        },
        coverageAreas: {
          create: body.regions.map((r) => ({
            name: r.name,
            start: Number(r.zipCodeStart),
            end: Number(r.zipCodeEnd),
            freight: Number(r.freight) || undefined,
          })),
        },
      },
    });
    return "Fornecedor atualizado com sucesso!";
  },
  { body: supplierFormSchema },
);

export const DELETE = createRoute(async (req, { params }) => {
  const count = await prisma.order.count({
    where: {
      supplierPanels: {
        some: {
          supplierId: params.id,
        },
      },
    },
  });

  if (count)
    throw new createHttpError.Conflict(
      "Há pedidos que utilizam este fornecedor",
    );

  await prisma.supplier.delete({
    where: { id: params.id },
  });

  return "Fornecedor excluido com sucesso";
});
