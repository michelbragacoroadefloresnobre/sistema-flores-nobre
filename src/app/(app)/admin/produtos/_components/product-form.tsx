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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product } from "@/generated/prisma/browser";
import { ProductSize } from "@/generated/prisma/enums";
import { revalidatePath } from "@/lib/revalidate-sc";
import { convertCurrencyInput } from "@/lib/utils";
import {
  ProductFormData,
  productFormSchema,
} from "@/modules/products/dto/create-product.dto";
import { toast } from "sonner";

export function ProductDialog({ product }: { product?: Product }) {
  const [open, setOpen] = useState(false);

  const defaultAmount = Number(product?.amount) || 0;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema as any),
    defaultValues: {
      name: product?.name || "",
      amount: defaultAmount ? defaultAmount.toFixed(2) : "",
      width: product?.width || "",
      height: product?.height || "",
      size: product?.size || ("" as any),
      imageUrl: product?.imageUrl || "",
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => form.reset(), [open]);

  const mutation = useMutation({
    mutationFn: async (values: ProductFormData) => {
      if (product)
        return (await axios.put(`/api/products/${product.id}`, values)).data;
      return (await axios.post("/api/products", values)).data;
    },
    onSuccess: async ({ message }) => {
      toast.success(message);
      await revalidatePath("/admin/products");
      setOpen(false);
    },
    onError: (error: any) => {
      console.error("Erro ao salvar o produto:", error);
      toast.error(error.response?.data.error || "Erro ao salvar o produto.");
    },
  });

  function onSubmit(values: ProductFormData) {
    mutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {product ? (
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
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem do Produto</FormLabel>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input placeholder="Cole a URL..." {...field} />
                      </FormControl>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Buquê de Flores" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="R$ 0.00"
                        value={field.value ? "R$ " + field.value : ""}
                        onChange={(e) => {
                          const input = convertCurrencyInput(e.target.value);
                          field.onChange(input);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tamanho..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ProductSize.DEFAULT}>
                          Padrão
                        </SelectItem>
                        <SelectItem value={ProductSize.LARGE}>
                          Grande
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Largura</FormLabel>
                    <InputGroup>
                      <FormControl>
                        <InputGroupInput
                          {...field}
                          type="text"
                          placeholder="0"
                          maxLength={10}
                          value={field.value}
                          onChange={(e) => {
                            const input = e.target.value;
                            field.onChange(input.replace(/\D/g, ""));
                          }}
                        />
                      </FormControl>
                      <InputGroupAddon align={"inline-end"}>cm</InputGroupAddon>
                    </InputGroup>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altura</FormLabel>{" "}
                    <InputGroup>
                      <FormControl>
                        <InputGroupInput
                          {...field}
                          type="text"
                          placeholder="0"
                          maxLength={10}
                          value={field.value}
                          onChange={(e) => {
                            const input = e.target.value;
                            field.onChange(input.replace(/\D/g, ""));
                          }}
                        />
                      </FormControl>
                      <InputGroupAddon align={"inline-end"}>cm</InputGroupAddon>
                    </InputGroup>
                  </FormItem>
                )}
              />
            </div>

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
                {"Salvar Produto"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
