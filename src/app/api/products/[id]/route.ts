import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { productFormSchema } from "@/modules/products/dto/create-product.dto";
import createHttpError from "http-errors";

export const PUT = createRoute(
  async (req, { body, params }) => {
    await prisma.product.update({
      where: { id: params?.id },
      data: {
        name: body.name,
        amount: body.amount,
        size: body.size,
        width: body.width,
        height: body.height,
        helenaId: body.helenaId,
        imageUrl: body.imageUrl,
      },
    });

    return "Produto editado com sucesso";
  },
  {
    body: productFormSchema,
  },
);

export const DELETE = createRoute(async (requestAnimationFrame, { params }) => {
  const count = await prisma.order.count({
    where: { productId: params.id },
  });

  if (count)
    throw new createHttpError.Conflict("Há pedidos que utilizam este produto");

  await prisma.product.delete({
    where: { id: params.id },
  });

  return "Produto excluido com sucesso";
});
