"use client";

import { iOrderDelivering } from "@/modules/orders/dtos/kanban.dto";
import { KanbanColumn } from "../kanban-column";
import { KanbanCardDelivering } from "./kanban-card-delivering";

export function KanbanColumnDelivering({
  orders,
}: {
  orders: (iOrderDelivering | { error: string })[];
}) {
  return (
    <KanbanColumn
      title="Entrega"
      items={orders || []}
      renderItem={(item, index) => {
        if ("error" in item)
          return (
            <div
              key={index}
              className="rounded-md bg-destructive/10 p-4 border border-destructive"
            >
              <p className="text-sm text-destructive">{item.error}</p>
            </div>
          );
        else return <KanbanCardDelivering key={item.id} order={item} />;
      }}
    />
  );
}
