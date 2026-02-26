import prisma from "@/lib/prisma";
import { SupplierProductFormData } from "@/modules/suppliers/dtos/supplier-form.dto";
import EditSupplierPàge from "./edit-supplier-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUniqueOrThrow({
    where: { id },
    include: {
      coverageAreas: true,
      products: true,
    },
  });

  const productMaps = new Map(
    supplier.products.map((p) => [
      `${p.productId}::${p.size}`,
      {
        amount: p.amount,
      },
    ]),
  );

  const productIds = new Set(supplier.products.map((p) => p.productId));

  const products = await prisma.product.findMany({
    where: {
      id: { in: Array.from(productIds) },
    },
    include: {
      productVariants: true,
    },
  });

  const supplierProducts = products.map((p) => {
    const sizes = new Set(p.productVariants.map((pv) => pv.size));
    return {
      id: p.id,
      name: p.name,
      sizeOptions: Array.from(sizes).map((size) => {
        const options = productMaps.get(`${p.id}::${size}`);
        return {
          size: size,
          amount: Number(options?.amount)
            ? Number(options?.amount).toFixed(2)
            : "",
        };
      }),
    } as SupplierProductFormData;
  });

  return (
    <EditSupplierPàge
      supplier={JSON.parse(JSON.stringify(supplier))}
      supplierProducts={supplierProducts}
    />
  );
}
