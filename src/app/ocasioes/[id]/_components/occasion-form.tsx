"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { OccasionItem } from "./occasion-list";

const occasionTypeOptions = [
  { value: "BIRTHDAY", label: "Aniversário" },
  { value: "WEDDING_ANNIVERSARY", label: "Bodas" },
  { value: "MOTHERS_DAY", label: "Dia das Mães" },
  { value: "FATHERS_DAY", label: "Dia dos Pais" },
  { value: "VALENTINES_DAY", label: "Dia dos Namorados" },
  { value: "GRADUATION", label: "Formatura" },
  { value: "MEMORIAL", label: "In Memoriam" },
  { value: "OTHER", label: "Outro" },
];

const advanceDaysOptions = [
  { value: 3, label: "3 dias" },
  { value: 7, label: "7 dias" },
  { value: 14, label: "14 dias" },
  { value: 30, label: "30 dias" },
];

const formSchema = z.object({
  type: z.string().min(1, "Selecione o tipo"),
  customName: z.string().optional(),
  personName: z.string().min(1, "Nome do homenageado é obrigatório"),
  date: z.string().min(1, "Data é obrigatória"),
  advanceDays: z.string().min(1, "Selecione a antecedência"),
});

type FormData = z.infer<typeof formSchema>;

export function OccasionForm({
  open,
  onOpenChange,
  customerPanelId,
  occasion,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerPanelId: string;
  occasion?: OccasionItem;
  onSuccess: (occasion: OccasionItem) => void;
}) {
  const isEditing = !!occasion;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      customName: "",
      personName: "",
      date: "",
      advanceDays: "",
    },
  });

  const watchType = form.watch("type");

  useEffect(() => {
    if (open && occasion) {
      form.reset({
        type: occasion.type,
        customName: occasion.customName || "",
        personName: occasion.personName,
        date: new Date(occasion.date).toISOString().split("T")[0],
        advanceDays: String(occasion.advanceDays),
      });
    } else if (open) {
      form.reset({
        type: "",
        customName: "",
        personName: "",
        date: "",
        advanceDays: "",
      });
    }
  }, [open, occasion, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      const payload = {
        type: values.type,
        customName: values.type === "OTHER" ? values.customName : undefined,
        personName: values.personName,
        date: new Date(values.date).toISOString(),
        advanceDays: Number(values.advanceDays),
        ...(isEditing ? {} : { customerPanelId }),
      };

      if (isEditing) {
        return axios
          .patch(`/api/occasions/${occasion.id}`, payload)
          .then((res) => res.data);
      }

      return axios.post("/api/occasions", payload).then((res) => res.data);
    },
    onSuccess: ({ data }) => {
      toast.success(isEditing ? "Ocasião atualizada!" : "Ocasião cadastrada!");
      onSuccess(data);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Erro ao salvar a ocasião.",
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Ocasião" : "Nova Ocasião"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados da ocasião."
              : "Cadastre uma data especial para receber lembretes."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Ocasião</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {occasionTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {watchType === "OTHER" && (
              <FormField
                control={form.control}
                name="customName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Ocasião</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Dia do amigo"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="personName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Homenageado</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da pessoa" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="advanceDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Antecipar lembrete em</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {advanceDaysOptions.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={String(opt.value)}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
