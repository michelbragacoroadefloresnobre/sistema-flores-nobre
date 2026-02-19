"use client";

import { Button } from "@/components/ui/button";
import { OrderStatus } from "@/generated/prisma/enums";
import { env } from "@/lib/env";
import { cn, safeCopyToClipboard } from "@/lib/utils";
import { KANBAN_QUERY_KEY } from "@/modules/orders/constants";
import { iOrderPending } from "@/modules/orders/dtos/kanban.dto";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Edit,
  Info,
  Snowflake,
  X,
} from "lucide-react";
import { DateTime } from "luxon";
import { default as Link } from "next/link";
import { useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";
import { BadgeStatus } from "../badge-status";
import { OrderDisplay } from "../kanban-card-footer";
import { KanbanCardPendingSupplierForm } from "../pending/kanban-card-pending-supplier-form";

export function KanbanCardPending({ order }: { order: iOrderPending }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const status: "normal" | "warning" | "late" = useMemo(() => {
    const diffMinutes = DateTime.fromJSDate(
      new Date(order.deliveryUntil),
    ).diffNow("minutes").minutes;

    if (diffMinutes > 60) return "normal";
    else if (diffMinutes > 0) return "warning";
    else return "late";
  }, [order.deliveryUntil]);

  const statusColorClass = useMemo(() => {
    switch (status) {
      case "late":
        return "border-l-destructive shadow-destructive/10";
      case "warning":
        return "border-l-warning shadow-warning/10";
      default:
        return "border-l-secondary shadow-secondary/10";
    }
  }, [status]);

  const queryClient = useQueryClient();

  const releasePanel = async (type: "cancel" | "approve") => {
    if (!order.supplierPanel) return;
    toast.info("Executando ação...");
    try {
      if (type === "approve")
        await axios.post(`/api/webhooks/zapi`, {
          buttonsResponseMessage: {
            buttonId: "approve_" + order.supplierPanel.id,
          },
          phone:
            order.supplierPanel.supplierJid ||
            env.NEXT_PUBLIC_INTERNAL_SUPPLIER_JID,
        });
      else
        await axios.post(
          `/api/supplier-panel/${order.supplierPanel.id}/cancel`,
        );
      toast.success("Operação realizada com sucesso");
    } catch (e: any) {
      toast.error(e.response?.data.error);
    } finally {
      queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
    }
  };

  return (
    <div
      className={cn(
        "group flex flex-col rounded-r-xl rounded-l-sm bg-muted/40 text-card-foreground shadow-sm transition-all hover:shadow-md",
        "border-y border-r border-l-4 border-border",
        statusColorClass,
      )}
    >
      <div className="flex flex-col py-2 px-6">
        {(order.orderStatus === OrderStatus.PENDING_CANCELLED ||
          order.orderStatus === OrderStatus.PENDING_WAITING ||
          order.isWaited) && (
          <div className="flex items-center flex-wrap gap-2">
            {order.isWaited && (
              <BadgeStatus icon={Snowflake} label="Em Espera" />
            )}
            {order.orderStatus === OrderStatus.PENDING_CANCELLED && (
              <BadgeStatus
                variant="destructive"
                icon={AlertCircle}
                label="Cancelado"
              />
            )}
            {order.orderStatus === OrderStatus.PENDING_WAITING &&
              order.supplierPanel && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/60">
                  <Info className="size-3" />
                  <span>{`Aguardando até ${format(order.supplierPanel.expireAt, "dd/MM HH:mm")}`}</span>
                  <Check
                    onClick={() => releasePanel("approve")}
                    className="size-3 cursor-pointer"
                  />
                  <X
                    onClick={() => releasePanel("cancel")}
                    className="size-3 cursor-pointer"
                  />
                </div>
              )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-2 gap-y-3 py-2 mb-2">
          <div className="flex flex-col gap-0.5 justify-start">
            <button
              onClick={() => {
                const formattedId = `#NOBRE${order.id}`;
                safeCopyToClipboard(formattedId).then(() =>
                  toast.success("ID copiado com sucesso!"),
                );
              }}
              className="text-xs font-bold tracking-wider text-muted-foreground hover:text-primary transition-colors text-left w-28 truncate block pr-3 cursor-pointer"
            >
              #NOBRE{order.id}
            </button>
            <span className="font-semibold text-sm truncate text-foreground leading-tight">
              {order.customerName.split(" ").slice(0, 2).join(" ")}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 text-right items-end justify-start">
            <span className="text-xs text-muted-foreground font-medium">
              {order.seller.name}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {order.productName.trim()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-1">
          <OrderDisplay
            deliveryUntil={order.deliveryUntil}
            deliveryPeriod={order.deliveryPeriod}
            isPaid={order.isPaid}
            hasRefunded={order.hasRefunded}
            internalNote={order.internalNote}
          />

          <div className="flex items-center gap-1">
            <Button
              variant={"ghost"}
              className="size size-7 text-muted-foreground hover:text-foreground cursor-default"
              size={"icon"}
              asChild
            >
              <Link href={`/pedidos/${order.id}`}>
                <Edit className="size-3.5" />
              </Link>
            </Button>

            <Button
              variant={"ghost"}
              className="size size-7 text-muted-foreground hover:text-foreground"
              size={"icon"}
              onClick={async () => {
                await safeCopyToClipboard(
                  order.customerPhone.substring(2) || "",
                );
                toast.success("WhatsApp copiado!");
              }}
            >
              <FaWhatsapp className="size-3.5" />
            </Button>

            <Button
              variant={"ghost"}
              className="size size-7 text-muted-foreground hover:text-foreground"
              onClick={() => setIsExpanded(!isExpanded)}
              size={"icon"}
            >
              <ChevronDown
                className={cn(
                  "size-3.5 transition-all",
                  isExpanded && "rotate-180",
                )}
              />
            </Button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 duration-200">
          <KanbanCardPendingSupplierForm
            onSubmitted={() => setIsExpanded(false)}
            order={order}
          />
        </div>
      )}
    </div>
  );
}
