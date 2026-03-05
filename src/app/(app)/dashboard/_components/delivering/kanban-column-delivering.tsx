"use client";

import { iOrderDelivering } from "@/modules/orders/dtos/kanban.dto";
import { KanbanColumn } from "../kanban-column";
import { KanbanCardDelivering } from "./kanban-card-delivering";
import { OrderStatus } from "@/generated/prisma/browser";

export function KanbanColumnDelivering({
  orders,
}: {
  orders: (iOrderDelivering | { error: string })[];
}) {
  const sortOrders = (deliveringOrders: iOrderDelivering[]) => {
    return deliveringOrders.sort(
      (a, b) =>
        Number(b.isPaid) - Number(a.isPaid) ||
        Number(b.supplierPanel.cost ? 1 : 0) - Number(a.supplierPanel.cost ? 1 : 0),
    );
  };
  return (
    <KanbanColumn
      title="Entrega"
      items={sortOrders(orders as iOrderDelivering[]) || []}
      renderItem={(item, index) => {
        if ("error" in item)
          return (
            <div
              key={index}
              className="rounded-md bg-destructive/10 p-4 border border-destructive"
            >
              <p className="text-sm text-destructive">{item.error as string}</p>
            </div>
          );
        else return <KanbanCardDelivering key={item.id} order={item} />;
      }}
    />
  );
}
