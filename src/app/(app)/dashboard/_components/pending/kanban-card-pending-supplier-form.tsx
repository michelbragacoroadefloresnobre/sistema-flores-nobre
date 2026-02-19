"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { OrderStatus } from "@/generated/prisma/browser";
import { Prisma } from "@/generated/prisma/client";
import { KANBAN_QUERY_KEY } from "@/modules/orders/constants";
import { iOrderPending } from "@/modules/orders/dtos/kanban.dto";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { AlertCircle, MapPin, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function KanbanCardPendingSupplierForm({
  order,
  onSubmitted,
}: {
  order: iOrderPending;
  onSubmitted: () => void;
}) {
  const [cancelReason, setCancelReason] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [selectedSupplierId, setSelectedSupplierId] = useState("");

  const queryClient = useQueryClient();
  const { mutate, isPending: isPendingMutation } = useMutation({
    mutationFn: async () => {
      const res = await axios.post(`/api/supplier-panel`, {
        supplierId: selectedSupplierId,
        orderId: order.id,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Fornecedor definido com sucesso");
      setSelectedSupplierId("");
      onSubmitted();
    },
    onError: (e: any) => {
      console.error(e.message);
      toast.error(e.response?.data.error || "Algo deu errado");
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
    },
  });

  const { isPending, data, error } = useQuery({
    queryKey: ["available-suppliers", order.productName, order.deliveryZipCode],
    queryFn: async () => {
      const res = await axios.get<{
        data: Prisma.SupplierGetPayload<{
          include: { supplierPanels: true };
        }>[];
      }>(`/api/orders/${order.id}/available-suppliers`);
      return res.data.data;
    },
  });

  const isSubmitableStatus =
    order.orderStatus === OrderStatus.PENDING_CANCELLED ||
    order.orderStatus === OrderStatus.PENDING_PREPARATION;

  let message: string | null = null;

  if (order.isWaited) message = "Pedido em empera";
  else if (order.supplierPanel) message = order.supplierPanel?.supplierName;
  else if (isPending) message = "Carregando fornecedores...";
  else if (!data || !!error)
    message =
      (error as any)?.response?.data.error || "Erro ao buscar fornecedores";
  else if (!data.length) message = "Sem fornecedores para este pedido";
  else if (!isSubmitableStatus) message = "Fornecedores não disponiveis";

  const handleCancelOrder = async () => {
    try {
      setIsCancelling(true);
      const { message } = await axios
        .delete(`/api/orders/${order.id}`, {
          params: {
            cancelReason,
          },
        })
        .then((res) => res.data);

      toast.success(message);
    } catch (e: any) {
      console.error("Erro ao cancelar pedido:", e);
      toast.error(e.response?.data.error || "Erro ao cancelar pedido");
    } finally {
      queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
      setIsCancelling(false);
    }
    setIsPopoverOpen(false);
    setCancelReason("");
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || order.supplierPanel) return;
    mutate();
  };

  return (
    <div className="bg-muted/30 rounded-lg p-3 border border-border/50 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground pb-1 border-b border-border/40">
        <MapPin className="size-3.5 shrink-0 text-primary/70" />
        <span className="font-medium text-foreground/80 truncate">
          {(order as any).location || "Localização não definida"}
        </span>
      </div>

      <form onSubmit={handleSupplierSubmit} className="flex flex-col gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-semibold tracking-wider">
            Definir Fornecedor
          </Label>
          <Select
            disabled={!!message || !isSubmitableStatus}
            value={selectedSupplierId}
            onValueChange={setSelectedSupplierId}
          >
            <SelectTrigger className="w-full h-9 text-xs bg-background">
              {message ? (
                <span>{message}</span>
              ) : (
                <SelectValue placeholder="Selecione um fornecedor..." />
              )}
            </SelectTrigger>
            <SelectContent>
              {data?.map((sp) => (
                <SelectItem key={sp.id} value={sp.id}>
                  {sp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                type="button"
                size="sm"
                className="w-full text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 h-8"
                disabled={!isSubmitableStatus}
              >
                <XCircle className="mr-1.5 size-3.5" />
                Cancelar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="start" sideOffset={10}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none text-sm flex items-center gap-2 text-destructive">
                    <AlertCircle className="size-3.5" />
                    Cancelar Pedido
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Informe o motivo para prosseguir com o cancelamento.
                  </p>
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Cliente desistiu, falta de estoque..."
                    maxLength={255}
                    className="h-20 resize-none bg-muted/50 focus:bg-background transition-colors md:text-xs"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full text-xs"
                    onClick={handleCancelOrder}
                    disabled={cancelReason.length < 3 || isCancelling}
                  >
                    {isCancelling ? "Cancelando..." : "Confirmar Cancelamento"}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="submit"
            size="sm"
            className="w-full h-8 text-xs bg-primary hover:bg-primary/90"
            disabled={
              !!message ||
              !selectedSupplierId ||
              !isSubmitableStatus ||
              isPendingMutation
            }
          >
            {isPendingMutation ? (
              <>
                <Spinner className="mr-1.5 size-3.5" /> Enviando...
              </>
            ) : (
              <>
                <Send className="mr-1.5 size-3.5" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
