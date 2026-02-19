"use client";

import { iOrderPending } from "@/modules/orders/dtos/kanban.dto";
import { KanbanColumn } from "../kanban-column";
import { KanbanCardPending } from "../pending/kanban-card-pending";

export function KanbanColumnPending({ orders }: { orders: iOrderPending[] }) {
  return (
    <KanbanColumn
      title="Pendente"
      items={orders || []}
      renderItem={(item) => <KanbanCardPending key={item.id} order={item} />}
    />
  );
}
