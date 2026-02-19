"use client";

import { QueryFormType } from "@/app/api/forms/query-form.dto.";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatPhoneInput } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  onSuccess: (data: QueryFormType, phone: string) => void;
}

export function SearchOrderForm({ onSuccess }: Props) {
  const [phone, setPhone] = useState("");
  const { isPending, mutate } = useMutation<QueryFormType>({
    mutationFn: async () =>
      (await axios.get("/api/tables/forms", { params: { phone } })).data,
    onSuccess: (data) => onSuccess(data, phone),
    onError(e: any) {
      console.error("Erro ao buscar formulario:", e);
      toast.error(e.response?.data?.error || "Algo deu errado");
    },
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const currentNumbers = input.replace(/\D/g, "");
    const previousNumbers = phone || "";

    const isTyping = currentNumbers.length > previousNumbers.length;

    if (isTyping) {
      if (!previousNumbers && !currentNumbers.startsWith("55")) {
        setPhone("55" + currentNumbers);
        return;
      }
    } else {
      if (previousNumbers.length === 3 && currentNumbers.length === 2) {
        setPhone("");
        return;
      }
    }

    if (currentNumbers.length > 13) return;

    setPhone(currentNumbers);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutate();
      }}
      className="space-y-6"
    >
      <div className="space-y-3">
        <Label className="text-foreground">Telefone do Cliente</Label>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
          </div>

          <Input
            placeholder="+55 (11) 99999-9999"
            value={formatPhoneInput(phone)}
            inputMode="numeric"
            className="pl-10 h-14 text-lg bg-background border-input font-medium shadow-sm transition-all duration-200 focus-visible:ring-primary"
            onChange={handlePhoneChange}
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={phone.length < 12 || isPending}
        className={cn(
          "w-full h-14 text-base font-bold shadow-md transition-all",
          "hover:-translate-y-0.5 active:translate-y-0",
        )}
      >
        {isPending ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Verificando...</span>
          </div>
        ) : (
          "Buscar Cliente"
        )}
      </Button>
    </form>
  );
}
