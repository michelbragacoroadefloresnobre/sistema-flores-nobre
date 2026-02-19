import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { z } from "zod";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatZipCodeInput } from "@/lib/utils";
import { SupplierFormData } from "@/modules/suppliers/dtos/supplier-form.dto";

const rangeSchema = z
  .object({
    name: z.string().min(1, "Nome inválido"),
    start: z.string().min(8, "CEP inválido").regex(/^\d+$/, "Apenas números"),
    end: z.string().min(8, "CEP inválido").regex(/^\d+$/, "Apenas números"),
  })
  .refine((data) => Number(data.end) >= Number(data.start), {
    message: "CEP final deve ser maior ou igual ao inicial",
    path: ["root"],
  });

export function SupplierFormRegionsCoverageArea() {
  const [open, setOpen] = useState(false);
  const parentForm = useFormContext<SupplierFormData>();

  const form = useForm({
    resolver: zodResolver(rangeSchema),
    defaultValues: {
      name: "",
      start: "",
      end: "",
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => form.reset(), [open]);

  const onSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const data = form.getValues() as z.infer<typeof rangeSchema>;
    const currentRegions = parentForm.watch("regions") || [];
    const newStart = Number(data.start);
    const newEnd = Number(data.end);

    if (newEnd < newStart) {
      form.setError("root", {
        message: "Inicio não pode ser maior que o final",
      });
      return;
    }

    const hasOverlap = currentRegions.some((region) => {
      const existingStart = Number(region.zipCodeStart);
      const existingEnd = Number(region.zipCodeEnd);
      return newStart <= existingEnd && newEnd >= existingStart;
    });

    if (hasOverlap) {
      form.setError("root", {
        message: "O intervalo conflita com uma região já cadastrada.",
      });
      return;
    }

    const currentValues = parentForm.getValues("regions") || [];
    parentForm.setValue(
      "regions",
      [
        ...currentValues,
        {
          name: data.name,
          zipCodeStart: data.start,
          zipCodeEnd: data.end,
          freight: "",
        },
      ].sort((a, b) => Number(a.zipCodeStart) - Number(b.zipCodeStart)),
    );

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Faixa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Faixa de CEP</DialogTitle>
          <DialogDescription>Adicione uma nova faixa de cep</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      className="w-full"
                      placeholder="Grande São Paulo"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP Início</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="06000-000"
                        {...field}
                        value={formatZipCodeInput(field.value)}
                        onChange={(e) => {
                          const input = e.target.value;
                          const raw = input.replace(/\D/g, "");

                          if (raw.length > 8) return;

                          field.onChange(raw);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP Final</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="09999-999"
                        value={formatZipCodeInput(field.value)}
                        onChange={(e) => {
                          const input = e.target.value;
                          const raw = input.replace(/\D/g, "");

                          if (raw.length > 8) return;

                          field.onChange(raw);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.formState.errors.root && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <DialogFooter>
              <Button type="button" onClick={() => onSubmit()}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
