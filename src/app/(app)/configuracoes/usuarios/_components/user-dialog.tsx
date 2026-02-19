"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, Pencil, Plus } from "lucide-react"; // Adicionado icones
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

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
  FormDescription,
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
import { User } from "@/generated/prisma/browser";
import { Role } from "@/generated/prisma/enums";
import { revalidatePath } from "@/lib/revalidate-sc";
import { UserFormData, userFormSchema } from "@/modules/users/user.dto";
import { toast } from "sonner";

export function UserDialog({ user }: { user?: User }) {
  const [open, setOpen] = useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema as any),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      helenaId: user?.helenaId || "",
      role: user?.role || ("" as any),
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => form.reset(), [open]);

  const mutation = useMutation({
    mutationFn: async (values: UserFormData) => {
      if (user) return axios.put(`/api/users/${user.id}`, values);
      return axios.post("/api/users", values);
    },
    onSuccess: async () => {
      toast.success("Operação realizada com sucesso.");
      await revalidatePath("/settings/users");
      setOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Erro ao salvar o produto.");
    },
  });

  function onSubmit(values: UserFormData) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {user ? (
          <Button variant="ghost" size="sm" className="">
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 size-4" /> Criar Produto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo sobre o produto no sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do Vendedor" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="exemplo@exemplo.com"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissão</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma permissão..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={Role.OWNER}>Super Admin</SelectItem>
                        <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                        <SelectItem value={Role.SUPERVISOR}>
                          Supervisor
                        </SelectItem>
                        <SelectItem value={Role.SELLER}>Vendedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="helenaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Helena (UUID)</FormLabel>
                  <FormControl>
                    <Input placeholder="00000000-0000..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Identificador único externo.
                  </FormDescription>
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
                {"Salvar Usuario"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
