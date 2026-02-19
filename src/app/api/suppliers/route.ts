import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { supplierFormSchema } from "@/modules/suppliers/dtos/supplier-form.dto";

export const POST = createRoute(
  async (req, { body }) => {
    await prisma.supplier.create({
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
    return "Fornecedor criado com sucesso!";
  },
  { body: supplierFormSchema },
);
