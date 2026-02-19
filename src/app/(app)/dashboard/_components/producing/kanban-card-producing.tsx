"use client";

import { Button } from "@/components/ui/button";
import { OrderStatus } from "@/generated/prisma/enums";
import { cn, safeCopyToClipboard } from "@/lib/utils";
import { iOrderProducing } from "@/modules/orders/dtos/kanban.dto";
import { Edit, ImageIcon, LinkIcon } from "lucide-react";
import { DateTime } from "luxon";
import { default as Link } from "next/link";
import { useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";
import { BadgeStatus } from "../badge-status";
import { OrderDisplay } from "../kanban-card-footer";
import { KanbanImageDialog } from "../kanban-image-dialog";

export function KanbanCardProducing({ order }: { order: iOrderProducing }) {
  const [isImageOpen, setIsImageOpen] = useState(false);

  const status: "normal" | "warning" | "late" = useMemo(() => {
    const diffMinutes = DateTime.fromISO(order.deliveryUntil).diffNow(
      "minutes",
    ).minutes;

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

  return (
    <>
      <KanbanImageDialog
        panelId={order.supplierPanel.id}
        productName={order.productName}
        imageUrl={order.supplierPanel.imageUrl}
        open={isImageOpen}
        onOpenChange={setIsImageOpen}
        showActionsButton={true}
      />
      <div
        className={cn(
          "group flex flex-col rounded-r-xl rounded-l-sm bg-muted/40 text-card-foreground shadow-sm transition-all hover:shadow-md",
          "border-y border-r border-l-4 border-border",
          statusColorClass,
        )}
      >
        <div className="flex flex-col py-2 px-6">
          {order.orderStatus === OrderStatus.PRODUCING_CONFIRMATION && (
            <div className="flex items-center flex-wrap gap-2">
              {order.orderStatus === OrderStatus.PRODUCING_CONFIRMATION && (
                <BadgeStatus
                  variant="success"
                  icon={ImageIcon}
                  label="Aguardando Aprovação"
                />
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
              <span className="text-xs font-semibold text-foreground truncate leading-none">
                {order.supplierName}
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
                disabled={
                  !order.supplierPanel.imageUrl ||
                  order.orderStatus !== OrderStatus.PRODUCING_CONFIRMATION
                }
                className="size size-7 text-muted-foreground hover:text-foreground"
                onClick={() => setIsImageOpen(true)}
                size={"icon"}
              >
                <ImageIcon className={cn("size-3.5")} />
              </Button>

              <Button
                variant={"ghost"}
                className="size size-7 text-muted-foreground hover:text-foreground cursor-default"
                size={"icon"}
                asChild
              >
                <Link href={`/painel/${order.supplierPanel.id}`}>
                  <LinkIcon className="size-3.5" />
                </Link>
              </Button>

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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
