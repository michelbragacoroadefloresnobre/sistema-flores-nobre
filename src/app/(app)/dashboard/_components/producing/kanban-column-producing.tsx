"use client";

import { iOrderProducing } from "@/modules/orders/dtos/kanban.dto";
import { KanbanColumn } from "../kanban-column";
import { KanbanCardProducing } from "./kanban-card-producing";

export function KanbanColumnProducing({
  orders,
}: {
  orders: (iOrderProducing | { error: string })[];
}) {
  return (
    <KanbanColumn
      title="Produção"
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
        else return <KanbanCardProducing key={item.id} order={item} />;
      }}
    />
  );
}
