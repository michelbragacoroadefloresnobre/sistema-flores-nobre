import { Prisma } from "@/generated/prisma/client";
import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { productFormSchema } from "@/modules/products/dto/create-product.dto";
import createHttpError from "http-errors";
import { revalidatePath } from "next/cache";
import z from "zod";

export const POST = createRoute(
  async (req, { body }) => {
    if (body.variations.length === 0)
      throw new createHttpError.BadRequest("Especifique ao menos 1 variante");

    await prisma.product.create({
      data: {
        name: body.name,
        basePrice: body.basePrice,
        productVariants: {
          createMany: {
            data: body.variations.map((pv) => ({
              color: pv.color,
              active: true,
              imageUrl: pv.imageUrl,
              size: pv.size,
              price: pv.price || undefined,
            })),
          },
        },
      },
    });

    revalidatePath("/admin/produtos");

    return "Produto criado com sucesso";
  },
  {
    body: productFormSchema,
  },
);

export const GET = createRoute(
  async (req, { searchParams }) => {
    const where: Prisma.ProductVariantFindFirstArgs["where"] = {};

    if (!(searchParams.inactive === "true")) where.active = true;

    const products = await prisma.product.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        productVariants: {
          where,
        },
      },
    });

    return {
      data: products,
    };
  },
  {
    searchParams: z.object({
      inactive: z.enum(["true"]).optional(),
    }),
  },
);

export const revalidate = 0;
