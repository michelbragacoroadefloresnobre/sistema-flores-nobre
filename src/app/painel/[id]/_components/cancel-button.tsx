"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { revalidatePath } from "@/lib/revalidate-sc";
import axios from "axios";
import { Package, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const DEFAULT_REASONS = [
  { value: "reason1", label: "Não tenho essas flores" },
  { value: "reason2", label: "Não consigo entregar nesse prazo" },
  { value: "reason3", label: "Local muito distante" },
  { value: "other", label: "Outro" },
];

export const CancelButton = ({ panelId }: { panelId: string }) => {
  const [open, setOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const reasons = DEFAULT_REASONS;

  const isOther = selected === "other";

  const canSubmit = useMemo(() => {
    if (!selected) return false;
    if (isOther) return customReason.trim().length > 0;
    return true;
  }, [selected, isOther, customReason]);

  const resetState = () => {
    setSelected("");
    setCustomReason("");
    setIsLoading(false);
    setSelectOpen(false);
  };

  const handleConfirm = async () => {
    if (!canSubmit || isLoading) return;
    try {
      setIsLoading(true);

      const label =
        reasons.find((r) => r.value === selected)?.label ?? selected;
      const finalReason = isOther ? customReason.trim() : label;

      const { message } = await axios
        .delete(`/api/supplier-panel/${panelId}`, {
          params: { reason: finalReason },
        })
        .then((res) => res.data);

      toast.success(message);

      setOpen(false);
      resetState();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error ||
          "Falha ao cancelar o pedido. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
      revalidatePath(`/painel/${panelId}`);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive"
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar Pedido
        </Button>
      </DialogTrigger>

      <DialogContent
        onPointerDownOutside={(e) => {
          if ((e as any).target?.closest?.("[data-radix-select-content]")) {
            e.preventDefault();
          }
        }}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Cancelar Pedido
          </DialogTitle>
          <DialogDescription>
            Por favor, selecione o motivo do cancelamento. Se nenhum se aplicar,
            escolha “Outro”.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Motivo do cancelamento</Label>
            <Select
              open={selectOpen}
              onOpenChange={setSelectOpen}
              value={selected}
              onValueChange={(val) => setSelected(val)}
            >
              <SelectTrigger
                className="w-full"
                id="cancel-reason"
                aria-label="Motivo do cancelamento"
              >
                <SelectValue
                  onClick={() => setSelectOpen(!open)}
                  placeholder="Selecione um motivo"
                />
              </SelectTrigger>
              <SelectContent
                className="z-9999"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isOther && (
            <div className="space-y-2">
              <Label htmlFor="cancel-reason-other">Descreva o motivo</Label>
              <Textarea
                id="cancel-reason-other"
                placeholder="Digite o motivo..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <DialogFooter
          className={`flex gap-2 ${selectOpen ? "pointer-events-none" : ""}`}
        >
          <DialogTrigger asChild>
            <Button variant="outline" disabled={isLoading}>
              Voltar
            </Button>
          </DialogTrigger>
          <Button
            variant="destructive"
            disabled={!canSubmit || isLoading}
            onClick={handleConfirm}
          >
            {isLoading ? "Cancelando..." : "Confirmar Cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
