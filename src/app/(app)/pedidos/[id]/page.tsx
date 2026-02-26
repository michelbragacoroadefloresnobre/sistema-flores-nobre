import prisma from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import EditOrderScreen from "./_components/edit-order-screen";

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
      orderProducts: {
        include: {
          variant: { include: { product: { select: { name: true } } } },
        },
      },
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

  return <EditOrderScreen order={serialize(order)} />;
}
