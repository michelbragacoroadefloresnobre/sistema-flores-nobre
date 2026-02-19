import prisma from "@/lib/prisma";
import { EditOrderForm } from "./_components/edit-order-form";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      form: true,
      contact: { include: { city: true } },
      city: true,
      product: true,
      payments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        Pedido não encontrado
      </div>
    );
  }

  return <EditOrderForm order={JSON.parse(JSON.stringify(order))} />;
}
