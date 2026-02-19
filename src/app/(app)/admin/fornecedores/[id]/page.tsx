import prisma from "@/lib/prisma";
import EditSupplierPàge from "./edit-supplier-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      coverageAreas: true,
      products: { include: { product: true } },
    },
  });

  return <EditSupplierPàge supplier={JSON.parse(JSON.stringify(supplier))} />;
}
