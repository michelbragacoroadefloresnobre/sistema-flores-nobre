import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
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
import { formatCNPJInput, formatPhoneInput } from "@/lib/utils";
import { SupplierFormData } from "@/modules/suppliers/dtos/supplier-form.dto";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { UseFormReturn } from "react-hook-form";

interface SupplierDataFormProps {
  form: UseFormReturn<SupplierFormData>;
}

export const SupplierFormDetails = ({ form }: SupplierDataFormProps) => {
  const groupsQuery = useQuery<any[]>({
    queryKey: ["groups"],
    queryFn: () =>
      axios.get("/api/suppliers/groups").then((res) => res.data.data),
  });

  const isRatified = form.watch("isRatified");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Nome <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="Nome do fornecedor" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail</FormLabel>
            <FormControl>
              <Input type="email" placeholder="email@exemplo.com" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="cnpj"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CNPJ</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={"00.000.000/0000-00"}
                value={formatCNPJInput(field.value)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  if (raw.length < 15) field.onChange(raw);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Telefone <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="+55 (11) 00000-0000"
                value={formatPhoneInput(field.value)}
                inputMode="numeric"
                onChange={(e) => {
                  const input = e.target.value;
                  const currentNumbers = input.replace(/\D/g, "");
                  const previousNumbers = field.value || "";

                  const isTyping =
                    currentNumbers.length > previousNumbers.length;

                  if (isTyping) {
                    if (!previousNumbers && !currentNumbers.startsWith("55")) {
                      field.onChange("55" + currentNumbers);
                      return;
                    }
                  } else {
                    if (
                      previousNumbers.length === 3 &&
                      currentNumbers.length === 2
                    ) {
                      field.onChange("");
                      return;
                    }
                  }

                  if (currentNumbers.length > 13) return;

                  field.onChange(currentNumbers);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isRatified"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Homologado <span className="text-destructive">*</span>
            </FormLabel>
            <Select
              value={String(field.value ?? "")}
              onValueChange={(v) => field.onChange(v === "true")}
            >
              <FormControl className="w-full">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma opção..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="true">Sim</SelectItem>
                <SelectItem value="false">Não</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {isRatified ? (
        <FormField
          control={form.control}
          name="groupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Grupo <span className="text-destructive">*</span>
              </FormLabel>
              <Combobox
                items={groupsQuery.data?.filter((g) => g.name) || []}
                value={
                  groupsQuery.data?.find((g) => g.phone === field.value) || null
                }
                itemToStringLabel={(g: any) => g.name}
                itemToStringValue={(g) => g.phone}
                onValueChange={(g) => field.onChange(g.phone)}
              >
                <FormControl className="w-full">
                  <ComboboxInput placeholder="Selecione um grupo..." />
                </FormControl>
                <ComboboxContent>
                  <ComboboxEmpty>Nenhum grupo encontrado</ComboboxEmpty>
                  <ComboboxList>
                    {(g) => (
                      <ComboboxItem key={g.phone} value={g}>
                        {g.name}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </FormItem>
          )}
        />
      ) : null}
    </div>
  );
};
