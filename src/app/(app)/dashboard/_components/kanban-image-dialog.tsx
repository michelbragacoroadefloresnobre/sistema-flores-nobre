/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { PositiveResponseType } from "@/lib/handler/route-handler";
import { KANBAN_QUERY_KEY } from "@/modules/orders/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PhotoDialogProps {
  imageUrl: string | undefined | null;
  productName: string;
  panelId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showActionsButton?: boolean;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
}

export function KanbanImageDialog({
  open,
  onOpenChange,
  panelId,
  imageUrl,
  showActionsButton = false,
  productName,
}: PhotoDialogProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const queryClient = useQueryClient();

  const { mutate: mutateApprovation, isPending: isPendingApprovation } =
    useMutation({
      mutationFn: async () => {
        return axios
          .put(`/api/supplier-panel/${panelId}/image`, {
            action: "approve",
          })
          .then((res) => res.data);
      },
      onSuccess(data: PositiveResponseType) {
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
        toast.success(data.message);
      },
      onError(e: any) {
        console.error("Erro ao fazer submit de resposta para foto:", e);
        toast.error(e.response?.data.error || "Algo deu errado");
      },
    });

  const { mutate: mutateRejection, isPending: isPendingRejection } =
    useMutation({
      mutationFn: async () => {
        if (!rejectReason.trim()) return;
        return axios
          .put(`/api/supplier-panel/${panelId}/image`, {
            action: "reject",
            reason: rejectReason,
          })
          .then((res) => res.data);
      },
      onSuccess() {
        setRejectReason("");
        setPopoverOpen(false);
        onOpenChange(false);
        queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
        toast.success("Foto rejeitada com sucesso!");
      },
      onError(e: any) {
        console.error("Erro ao rejeitar foto:", e);
        toast.error(e.response?.data.error || "Algo deu errado");
      },
    });

  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {productName}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <div className="overflow-hidden rounded-lg border border-border">
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-auto object-cover aspect-square"
            />
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            {showActionsButton && (
              <>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive hover:bg-destructive/10"
                    >
                      <X className="mr-1.5 h-4 w-4" />
                      Recusar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80"
                    align="center"
                    side="top"
                    sideOffset={10}
                  >
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Motivo da recusa</p>
                      <Textarea
                        placeholder="Descreva o motivo..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPopoverOpen(false);
                            setRejectReason("");
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={
                            !rejectReason.trim() ||
                            isPendingApprovation ||
                            isPendingRejection
                          }
                          onClick={() => mutateRejection()}
                        >
                          {isPendingRejection ? "Confirmando..." : "Confirmar"}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  disabled={isPendingApprovation || isPendingRejection}
                  size="sm"
                  onClick={() => mutateApprovation()}
                >
                  <Check className="mr-1.5 h-4 w-4" />
                  {isPendingApprovation ? "Aprovando..." : "Aprovar"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
