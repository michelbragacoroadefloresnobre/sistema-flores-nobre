import prisma from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { ProductForm } from "./_components/product-form";

export default async function Page({ params }) {
  const { id } = await params;

  console.log({ id });

  const product = await prisma.product.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      productVariants: {
        where: {
          active: true,
        },
      },
    },
  });

  return <ProductForm product={serialize(product)} />;
}
