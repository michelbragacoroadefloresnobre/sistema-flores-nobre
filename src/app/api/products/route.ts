import { createRoute } from "@/lib/handler/route-handler";
import prisma from "@/lib/prisma";
import { productFormSchema } from "@/modules/products/dto/create-product.dto";
import { revalidatePath } from "next/cache";

export const POST = createRoute(
  async (req, { body }) => {
    await prisma.product.create({
      data: {
        name: body.name,
        amount: body.amount,
        size: body.size,
        width: body.width,
        height: body.height,
        imageUrl: body.imageUrl,
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
  async () => {
    const products = await prisma.product.findMany();

    return { data: products };
  },
  {
    body: productFormSchema,
  },
);
