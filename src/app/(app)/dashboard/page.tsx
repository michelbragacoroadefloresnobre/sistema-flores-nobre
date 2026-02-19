"use client";

import { useViewOnlyMyOrders } from "@/hooks/use-app-storage";
import { authClient } from "@/lib/auth/client";
import { KANBAN_QUERY_KEY } from "@/modules/orders/constants";
import { iKanbanOrders } from "@/modules/orders/dtos/kanban.dto";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { KanbanColumnDelivering } from "./_components/delivering/kanban-column-delivering";
import { KanbanBoardSkeleton } from "./_components/kanban-board-skeleton";
import { KanbanColumnPending } from "./_components/pending/kanban-column-pending";
import { KanbanColumnProducing } from "./_components/producing/kanban-column-producing";

export default function Page() {
  const searchParams = useSearchParams();

  const success = searchParams.get("success");
  const viewOnlyMyOrders = useViewOnlyMyOrders();

  const { data, isPending, error } = useQuery<iKanbanOrders>({
    queryKey: KANBAN_QUERY_KEY,
    queryFn: async () => {
      return await axios.get("/api/kanban").then((res) => res.data.data);
    },
    refetchInterval: 1 * 60 * 1000,
  });

  const { data: sessionData, isPending: isPendingSession } =
    authClient.useSession();

  const orders: iKanbanOrders = useMemo(() => {
    if (data && viewOnlyMyOrders) {
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => {
          return [
            key,
            value?.filter((order) => order.seller.id === sessionData?.user.id),
          ];
        }),
      ) as any;
    } else if (data) return data;
    return {
      pending: [],
      producing: [],
      delivering: [],
    };
  }, [data, viewOnlyMyOrders, sessionData]);

  if (isPendingSession || isPending) return <KanbanBoardSkeleton />;
  else if (!data || error)
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-destructive">
          Ocorreu um erro ao carregar os pedidos. Contate o suporte.
        </p>
      </div>
    );

  return (
    <div className="h-full">
      {success && (
        <div className="bg-primary p-1 text-center text-sm font-semibold text-primary-foreground">
          {success}
        </div>
      )}
      <div className="grid h-full w-full grid-cols-1 gap-4 pb-4 md:grid-cols-2 lg:grid-cols-3 p-6">
        <KanbanColumnPending orders={orders.pending} />
        <KanbanColumnProducing orders={orders.producing} />
        <KanbanColumnDelivering orders={orders.delivering} />
      </div>
    </div>
  );
}
