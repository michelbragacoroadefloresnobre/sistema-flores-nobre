"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { revalidatePath } from "@/lib/revalidate-sc";
import axios from "axios";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Truck,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner"; // Opcional: para feedback visual

interface DeliveringSectionProps {
  panelId: string;
}

export function DeliveringSection({ panelId }: DeliveringSectionProps) {
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState<string>(format(new Date(), "HH:mm"));
  const [receiverName, setReceiverName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleConfirm = async () => {
    if (!date || !time || !receiverName.trim()) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);

    const deliveredAt = new Date(date + "T" + time);

    try {
      const res = await axios
        .post(`/api/supplier-panel/${panelId}/confirm-delivery`, {
          deliveredAt,
          receiverName: receiverName.trim(),
        })
        .then((res) => res.data);

      toast.success(res.message || "Entrega confirmada com sucesso!");
    } catch (e: any) {
      console.error("Erro ao confirmar entrega:", e);
      toast.error(
        e.response?.data?.error ||
          "Erro ao confirmar entrega. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
      revalidatePath(`/painel/${panelId}`);
    }

    console.log({
      deliveredAt,
      receiverName,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
          <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Confirmar Entrega</h2>
        <p className="text-muted-foreground text-sm">
          Informe os dados de quem recebeu o pedido para finalizar.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="receiver"
            className="text-sm font-medium flex items-center gap-2"
          >
            <User className="w-4 h-4 text-muted-foreground" />
            Recebido por
          </Label>
          <Input
            id="receiver"
            placeholder="Ex: Porteiro João, Maria Silva..."
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 flex flex-col">
            <Label className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              Data
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="time"
              className="text-sm font-medium flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-muted-foreground" />
              Horário
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <Button
          onClick={handleConfirm}
          disabled={isLoading || !receiverName || !date || !time}
          className="w-full font-medium shadow-sm"
        >
          {isLoading ? (
            "Processando..."
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Confirmar Entrega
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
