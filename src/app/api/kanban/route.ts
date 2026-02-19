import { createRoute } from "@/lib/handler/route-handler";
import { iKanbanOrders } from "@/modules/orders/dtos/kanban.dto";
import {
  getDeliveringOrders,
  getPendingOrders,
  getProducingOrders,
} from "@/modules/orders/kanban.service";

export const GET = createRoute(
  async () => {
    const [pending, producing, delivering] = await Promise.all([
      getPendingOrders(),
      getProducingOrders(),
      getDeliveringOrders(),
    ]);

    const groupedOrders: iKanbanOrders = {
      pending,
      producing,
      delivering,
    };

    return {
      data: groupedOrders,
    };
  },
  {
    logs: {
      suppress: ["RESPONSE"],
    },
  },
);
