"use client";

import { iOrderProducing } from "@/modules/orders/dtos/kanban.dto";
import { KanbanColumn } from "../kanban-column";
import { KanbanCardProducing } from "./kanban-card-producing";

const PERIOD_PRIORITY: Record<string, number> = {
  EXPRESS: 0,
  MORNING: 1,
  AFTERNOON: 2,
  EVENING: 3,
};

function sortOrderCards<
  T extends { deliveryUntil: Date | string; deliveryPeriod: string },
>(orders: T[]): T[] {
  return [...orders].sort((a, b) => {
    const aIsExpress = a.deliveryPeriod === "EXPRESS";
    const bIsExpress = b.deliveryPeriod === "EXPRESS";

    if (aIsExpress && !bIsExpress) return -1;
    if (!aIsExpress && bIsExpress) return 1;

    const dateDiff =
      new Date(a.deliveryUntil).getTime() - new Date(b.deliveryUntil).getTime();
    if (dateDiff !== 0) return dateDiff;

    return (
      (PERIOD_PRIORITY[a.deliveryPeriod] ?? 99) -
      (PERIOD_PRIORITY[b.deliveryPeriod] ?? 99)
    );
  });
}

export function KanbanColumnProducing({
  orders,
}: {
  orders: (iOrderProducing | { error: string })[]
}) {


  return (
    <KanbanColumn
      title="Produção"
      items={sortOrderCards(orders as iOrderProducing[]) || []}
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
        else return <KanbanCardProducing key={item.id} order={item} />;
      }}
    />
  );
}
