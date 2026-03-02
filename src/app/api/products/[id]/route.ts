import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { productFormSchema } from "@/modules/products/dto/create-product.dto";
import createHttpError from "http-errors";

export const PUT = createRoute(
  async (req, { body, params }) => {
    if (body.variations.length === 0)
      throw new createHttpError.BadRequest("Especifique ao menos 1 variante");

    await prisma.$transaction(async (tx) => {
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: params.id },
        select: { id: true, size: true, color: true },
      });

      await tx.productVariant.updateMany({
        where: { productId: params.id },
        data: { active: false },
      });

      for (const pv of body.variations) {
        const matchedVariant = existingVariants.find(
          (ev) => ev.size === pv.size && ev.color === pv.color,
        );

        if (matchedVariant) {
          await tx.productVariant.update({
            where: { id: matchedVariant.id },
            data: {
              active: true,
              imageUrl: pv.imageUrl,
              price: pv.price || undefined,
              siteId: pv.siteId || undefined,
            },
          });
        } else {
          await tx.productVariant.create({
            data: {
              productId: params.id,
              color: pv.color,
              size: pv.size,
              imageUrl: pv.imageUrl,
              price: pv.price || undefined,
              siteId: pv.siteId || undefined,
              active: true,
            },
          });
        }
      }

      await tx.product.update({
        where: { id: params.id },
        data: {
          name: body.name,
          basePrice: body.basePrice,
        },
      });
    });

    return "Produto editado com sucesso";
  },
  {
    body: productFormSchema,
  },
);

export const DELETE = createRoute(async (req, { params }) => {
  const count = await prisma.order.count({
    where: {
      orderProducts: {
        some: {
          variant: {
            productId: params.id,
          },
        },
      },
    },
  });

  if (count)
    throw new createHttpError.Conflict("Há pedidos que utilizam este produto");

  await prisma.product.delete({
    where: { id: params.id },
  });

  return "Produto excluido com sucesso";
});
