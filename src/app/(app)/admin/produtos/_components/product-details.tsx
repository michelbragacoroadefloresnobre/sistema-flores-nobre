import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { convertCurrencyInput } from "@/lib/utils";
import { ProductFormData } from "@/modules/products/dto/create-product.dto";
import { UseFormReturn } from "react-hook-form";

export function ProductDetails({
  form,
}: {
  form: UseFormReturn<ProductFormData>;
}) {
  return (
    <section className="space-y-5 rounded-xl border bg-card p-6 shadow-sm animate-fade-in">
      <h2 className="text-lg font-semibold font-display text-foreground flex items-center gap-2">
        Informações Básicas
      </h2>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-body">Nome do Produto</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Buquê de Rosas"
                  {...field}
                  className="font-body"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="basePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-body">Preço Base (R$)</FormLabel>
              <FormControl>
                <Input
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
      </div>
    </section>
  );
}
