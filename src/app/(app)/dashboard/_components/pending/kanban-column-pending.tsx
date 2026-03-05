"use client";

import { iOrderPending } from "@/modules/orders/dtos/kanban.dto";
import { KanbanColumn } from "../kanban-column";
import { KanbanCardPending } from "../pending/kanban-card-pending";
import { OrderStatus } from "@/generated/prisma/enums";

export function KanbanColumnPending({ orders }: { orders: iOrderPending[] }) {

  const sortedOrders = orders.sort(
                      (a, b) =>
                        Number(a.orderStatus === OrderStatus.PENDING_WAITING) - Number(a.orderStatus === OrderStatus.PENDING_WAITING) ||
                        Number(b.orderStatus === OrderStatus.PENDING_CANCELLED) - Number(a.orderStatus === OrderStatus.PENDING_CANCELLED) ||
                        Number(b.woocommerceId) - Number(a.woocommerceId),
                    )

  return (
    <KanbanColumn
      title="Pendente"
      items={sortedOrders || []}
      renderItem={(item) => <KanbanCardPending key={item.id} order={item} />}
    />
  );
}
