import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface OrderColumnProps<T> {
  isPending?: boolean;
  error?: string;
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}

export function KanbanColumn<
  T extends { amount?: string | number; id?: string; error?: string },
>({ title, items, renderItem, className }: OrderColumnProps<T>) {
  const totalValue = items.reduce(
    (acc, item) => acc + (Number(item.amount) || 0),
    0,
  );

  const averageTicket = items.length > 0 ? totalValue / items.length : 0;

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-xl border-border bg-card shadow-sm pt-0",
        className,
      )}
    >
      <CardHeader className="relative flex flex-auto shrink-0 grow-0 flex-row items-center justify-between bg-muted/50 py-6 text-muted-foreground">
        <CardTitle className="font-bold text-foreground">
          {title}{" "}
          <span className="ml-1 font-normal text-muted-foreground">
            ({items.length})
          </span>
        </CardTitle>
        <div className="text-[0.70rem] text-xs font-semibold border-b border-border space-y-0.5">
          <div className="rounded-sm border border-border bg-background px-2 py-0.5 text-muted-foreground shadow-sm">
            R${" "}
            {totalValue.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </div>
          <div className="rounded-sm border border-border bg-background px-2 py-0.5 text-muted-foreground shadow-sm">
            R${" "}
            {averageTicket.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="scrollbar flex-auto shrink-0 grow-0 overflow-y-scroll px-4">
        <div className="space-y-2">
          {items.map((item, index) => renderItem(item, index))}
        </div>
      </CardContent>
    </Card>
  );
}
