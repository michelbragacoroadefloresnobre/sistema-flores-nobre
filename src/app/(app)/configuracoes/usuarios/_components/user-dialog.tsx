/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { KeyRound, Loader2, Pencil, Plus } from "lucide-react";
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
  const [showPasswordField, setShowPasswordField] = useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema as any),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      helenaId: user?.helenaId || "",
      role: user?.role || ("" as any),
      password: "",
    },
  });

  useEffect(() => {
    form.reset();
    setShowPasswordField(!user);
  }, [open, user, form]);

  const mutation = useMutation({
    mutationFn: async (values: UserFormData) => {
      const payload = { ...values };
      if (!payload.password) delete payload.password;

      if (user) return axios.put(`/api/users/${user.id}`, payload);
      return axios.post("/api/users", payload);
    },
    onSuccess: async ({ message }: any) => {
      toast.success(message);
      await revalidatePath("/settings/users");
      setOpen(false);
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.response?.data.error || "Erro ao salvar o usuário.");
    },
  });

  function onSubmit(values: UserFormData) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {user ? (
          <Button variant="ghost" size="sm">
            <Pencil className="size-3.5" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 size-4" /> Novo Usuário
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para gerenciar o acesso ao sistema.
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
                    <Input placeholder="Nome Completo" {...field} />
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
                        type="email"
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
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione..." />
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

            {!showPasswordField ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <KeyRound className="size-4" />
                  <span>A senha não será alterada</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordField(true)}
                >
                  Alterar Senha
                </Button>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex justify-between">
                      Nova Senha
                      {user && (
                        <button
                          type="button"
                          className="text-xs text-destructive underline"
                          onClick={() => {
                            setShowPasswordField(false);
                            form.setValue("password", "");
                          }}
                        >
                          Cancelar alteração
                        </button>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Digite a nova senha"
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormDescription>Mínimo de 6 caracteres.</FormDescription>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="helenaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Helena (UUID)</FormLabel>
                  <FormControl>
                    <Input placeholder="00000000-0000..." {...field} />
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
                Salvar Usuário
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
