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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Supplier } from "@/generated/prisma/browser";
import { revalidatePath } from "@/lib/revalidate-sc";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Power, PowerOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const SupplierDisableButton = ({ supplier }: { supplier: Supplier }) => {
  const [open, setOpen] = useState(false);
  const [option, setOption] = useState<"disable" | "delete">("disable");
  const [duration, setDuration] = useState<string>("");

  const { isPending: isReactivating, mutate: reactivate } = useMutation({
    mutationFn: async () => {
      return axios
        .post(`/api/suppliers/${supplier.id}/reactivate`)
        .then((res) => res.data);
    },
    onSuccess: ({ message }) => {
      toast.success(message);
    },
    onError: (e: any) => {
      console.error("Erro ao reativar fornecedor:", e);
      toast.error(e.response?.data.error);
    },
    onSettled() {
      revalidatePath("/admin/fornecedores");
    },
  });

  const { isPending: isDisabling, mutate: disable } = useMutation({
    mutationFn: async () => {
      if (option === "delete")
        return axios
          .delete(`/api/suppliers/${supplier.id}`)
          .then((res) => res.data);
      else if (option === "disable") {
        if (!duration) return toast.error("Selecione um tempo");
        return axios
          .post(`/api/suppliers/${supplier.id}/disable`, { duration })
          .then((res) => res.data);
      }
    },
    onSuccess: ({ message }) => {
      toast.success(message);
      setOpen(false);
    },
    onError: (e: any) => {
      console.error("Erro ao reativar fornecedor:", e);
      toast.error(e.response?.data.error);
    },
    onSettled() {
      revalidatePath("/admin/fornecedores");
    },
  });

  const isSupplierDisabled = supplier.disabledUntil
    ? new Date(supplier.disabledUntil) > new Date()
    : false;

  if (isSupplierDisabled)
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled={isReactivating}
        onClick={() => reactivate()}
      >
        <Power className="h-4 w-4" />
      </Button>
    );
  else
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isDisabling}
            className="hover:bg-destructive/50 hover:text-destructive transition-colors"
          >
            <PowerOff className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Desligar fornecedor do sistema
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Escolha uma das opções abaixo para desativar temporariamente ou
              excluir o fornecedor
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <RadioGroup
              value={option}
              onValueChange={(v) => {
                setDuration("");
                setOption(v as any);
              }}
            >
              <FieldLabel htmlFor="disable">
                <Field orientation={"horizontal"}>
                  <FieldContent>
                    <FieldTitle>Desativar Temporariamente</FieldTitle>
                    <FieldDescription>
                      Fornecedor não poderá ser selecionado
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value="disable" id="disable" />
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="delete">
                <Field orientation={"horizontal"}>
                  <FieldContent>
                    <FieldTitle>Excluir Permanentemente</FieldTitle>
                    <FieldDescription>
                      Fornecedor será excluido do sistema
                    </FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value="delete" id="delete" />
                </Field>
              </FieldLabel>
            </RadioGroup>

            {option === "disable" && (
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm">
                  Tempo
                </Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration" className="w-full">
                    <SelectValue placeholder="Selecione um tempo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PT30M">30 minutos</SelectItem>
                    <SelectItem value="PT1H">1 hora</SelectItem>
                    <SelectItem value="PT3H">3 horas</SelectItem>
                    <SelectItem value="PT6H">6 horas</SelectItem>
                    <SelectItem value="PT12H">12 horas</SelectItem>
                    <SelectItem value="P1D">24 horas</SelectItem>
                    <SelectItem value="P3D">3 dias</SelectItem>
                    <SelectItem value="P7D">7 dias</SelectItem>
                    <SelectItem value="P30D">30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {option === "delete" && (
              <div className="">
                <p className="text-sm text-destructive">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => disable()}
              disabled={isDisabling || (option === "disable" && !duration)}
              variant={option === "delete" ? "destructive" : "default"}
            >
              {isDisabling ? (
                "Processando..."
              ) : (
                <>{option === "delete" ? "Deletar" : `Desativar`}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
};
