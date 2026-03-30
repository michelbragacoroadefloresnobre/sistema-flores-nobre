"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  discountValue: z.string().min(1, "Valor é obrigatório"),
  validUntil: z.string().min(1, "Validade é obrigatória"),
  maxUses: z.number().int().min(1, "Mínimo 1 uso"),
  isActive: z.boolean(),
  contactId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type CouponProp = {
  id: string;
  code: string;
  discountValue: string;
  validUntil: string;
  maxUses: number;
  isActive: boolean;
  contactId: string | null;
};

export function CouponDialog({ coupon }: { coupon?: CouponProp }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEditing = !!coupon;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      discountValue: "",
      validUntil: "",
      maxUses: 1,
      isActive: true,
      contactId: "",
    },
  });

  useEffect(() => {
    if (open && coupon) {
      form.reset({
        code: coupon.code,
        discountValue: String(coupon.discountValue),
        validUntil: new Date(coupon.validUntil).toISOString().split("T")[0],
        maxUses: coupon.maxUses,
        isActive: coupon.isActive,
        contactId: coupon.contactId || "",
      });
    } else if (open) {
      form.reset({
        code: "",
        discountValue: "",
        validUntil: "",
        maxUses: 1,
        isActive: true,
        contactId: "",
      });
    }
  }, [open, coupon, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormData) => {
      const payload = {
        code: values.code,
        discountValue: values.discountValue,
        validUntil: new Date(values.validUntil).toISOString(),
        maxUses: values.maxUses,
        isActive: values.isActive,
        contactId: values.contactId || undefined,
      };

      if (isEditing) {
        return axios
          .patch(`/api/coupons/${coupon.id}`, payload)
          .then((res) => res.data);
      }

      return axios.post("/api/coupons", payload).then((res) => res.data);
    },
    onSuccess: async ({ message }) => {
      toast.success(message || (isEditing ? "Cupom atualizado!" : "Cupom criado!"));
      await queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Erro ao salvar o cupom.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm">
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 size-4" /> Novo Cupom
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Cupom" : "Novo Cupom"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados do cupom."
              : "Crie um novo cupom de desconto para o sistema de ocasiões."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4 py-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="FLORES10" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="10.00"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Válido até</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxUses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo de usos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID do Contato (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Deixe vazio para cupom genérico"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="text-sm font-medium">
                    Cupom ativo
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Salvar" : "Criar Cupom"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
