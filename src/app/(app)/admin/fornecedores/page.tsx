import prisma from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import SupplierTable from "./_components/supplier-table";

export default async function Page() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "desc" },
  });
  return <SupplierTable data={serialize(suppliers)} />;
}
