"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeliveryPeriod } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { BadgeDollarSign, CircleDollarSign, Clock, Info } from "lucide-react";
import { useMemo } from "react";

type OrderDisplayProps = {
  deliveryUntil: string;
  deliveryPeriod: DeliveryPeriod;
  isPaid: boolean;
  hasRefunded: boolean;
  internalNote?: string | null;
};

export function OrderDisplay({
  deliveryUntil,
  deliveryPeriod,
  isPaid,
  hasRefunded,
  internalNote,
}: OrderDisplayProps) {
  const period = useMemo(() => {
    switch (deliveryPeriod) {
      case DeliveryPeriod.MORNING:
        return "Manhã";
      case DeliveryPeriod.AFTERNOON:
        return "Tarde";
      case DeliveryPeriod.EVENING:
        return "Noite";
      case DeliveryPeriod.EXPRESS:
        return "Expresso";
    }
  }, [deliveryPeriod]);

  const formattedDate =
    deliveryPeriod === DeliveryPeriod.EXPRESS
      ? format(deliveryUntil, "HH:mm")
      : format(deliveryUntil, "dd/MM");

  return (
    <div
      className={cn("flex items-center text-xs font-medium transition-colors")}
    >
      <div className="flex items-center leading-none sm:flex-row gap-1">
        <Clock className="size-3.5 shrink-0" />
        <span>{formattedDate}</span>
        <span className="hidden opacity-50 sm:inline">•</span>
        <span className="uppercase tracking-wide opacity-80">{period}</span>
      </div>

      {/* Right Side: Status Icons (Only show if relevant) */}
      {(hasRefunded || !isPaid || internalNote) && (
        <div className="flex items-center gap-2 pl-2 border-l border-border/50 ml-2">
          {/* Unpaid Warning */}
          {!isPaid && (
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <CircleDollarSign className="size-3.5 text-destructive" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pagamento pendente</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Refunded Info */}
          {hasRefunded && (
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <BadgeDollarSign className="size-3.5 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Houve reembolso</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Internal Note */}
          {internalNote && (
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Info
                    className={cn(
                      "size-3.5",
                      status === "warning"
                        ? "text-amber-600"
                        : "text-muted-foreground",
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-50 text-wrap">
                  <p>{internalNote}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  );
}
