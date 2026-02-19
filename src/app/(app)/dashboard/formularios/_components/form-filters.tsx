/* eslint-disable react-hooks/set-state-in-effect */
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { User } from "@/generated/prisma/browser";
import { FormStatus } from "@/generated/prisma/enums";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

export interface FormFilterOptions {
  status?: FormStatus;
  createdAtStart?: string;
  createdAtEnd?: string;
  isCustomer?: boolean;
  name?: string;
  email?: string;
  phone?: string;
  sellers?: Array<string>;
}

interface FormFiltersProps {
  onApplyFilter: (data: FormFilterOptions) => void;
  initialFilters: FormFilterOptions;
  sellers: User[];
}

export default function FormFilters({
  onApplyFilter,
  sellers,
  initialFilters: initialFilter,
}: FormFiltersProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [initialFilter]);

  const { control, handleSubmit } = useForm<FormFilterOptions>({
    defaultValues: initialFilter,
  });

  const onSubmit = (data: FormFilterOptions) => {
    const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
      if (
        value &&
        value !== "none" &&
        (Array.isArray(value) ? value.length > 0 : true)
      ) {
        acc[key as keyof FormFilterOptions] = value;
      }
      return acc;
    }, {} as FormFilterOptions);

    onApplyFilter(filteredData);
  };

  // const sellers = useMemo(() => {
  //   if (!sellersQuery.data) return [];

  //   const options = [
  //     {
  //       id: "not_answered",
  //       value: "not_answered",
  //       label: "Não Atendido",
  //     },
  //   ];

  //   const vendedores = sellersQuery.data
  //     .filter((v) =>
  //       hasRoles([Role.SELLER, Role.SUPERVISOR], v.Permissao as any),
  //     )
  //     .map((v) => ({
  //       id: v.HelenaId,
  //       value: v.HelenaId,
  //       label: v.Nome,
  //     }));

  //   return options.concat(vendedores);
  // }, [sellersQuery.data]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Abrir Filtros</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-100 overflow-y-auto">
        <SheetTitle>Filtros de Pesquisa</SheetTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <h2 className="text-xl font-bold mb-4">Filtros</h2>

          <div className="mb-4 space-y-2">
            <Label>Já comprou com a gente?</Label>
            <Controller
              name="isCustomer"
              control={control}
              render={({ field }) => (
                <Select
                  value={String(field.value || "")}
                  onValueChange={(v) => field.onChange(v === "true")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent className="overflow-y-auto">
                    <SelectItem value="none">Não Definido</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label htmlFor="status">Status:</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      id="status"
                      placeholder="Status do formulario"
                    />
                  </SelectTrigger>
                  <SelectContent className="overflow-y-auto">
                    <SelectItem value="none">Não Definido</SelectItem>
                    <SelectItem value={FormStatus.NOT_CONVERTED}>
                      Não Convertido
                    </SelectItem>
                    <SelectItem value={FormStatus.CANCELLED}>
                      Cancelado
                    </SelectItem>
                    <SelectItem value={FormStatus.CONVERTED}>
                      Convertido
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>Nome:</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Nome do Cliente"
                />
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>Email:</Label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Nome do Cliente"
                />
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>Telefone:</Label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Telefone do Cliente"
                />
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>Vendedores</Label>
            <Controller
              name="sellers"
              control={control}
              render={({ field }) => (
                <Combobox
                  items={sellers || []}
                  multiple
                  value={field.value}
                  onValueChange={(items) => field.onChange(items)}
                >
                  <ComboboxChips>
                    <ComboboxValue>
                      {(field.value || []).map((v) => (
                        <ComboboxChip key={v}>
                          {sellers?.find((s) => s.id === v)?.name}
                        </ComboboxChip>
                      ))}
                    </ComboboxValue>
                    <ComboboxChipsInput placeholder="Adicione um vendedor" />
                  </ComboboxChips>
                  <ComboboxContent>
                    <ComboboxEmpty>Nenhum vendedor encontrado</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item.id} value={item.id}>
                          {item.name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>Periodo:</Label>
            <Controller
              name="createdAtStart"
              control={control}
              render={({ field }) => (
                <Input
                  type="date"
                  className="mb-2"
                  value={
                    field.value
                      ? DateTime.fromISO(field.value).toFormat("yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) => {
                    field.onChange(
                      e.target.value
                        ? DateTime.fromFormat(
                            e.target.value,
                            "yyyy-MM-dd",
                          ).toISO()
                        : "",
                    );
                  }}
                  placeholder="Data de Início"
                />
              )}
            />
            <Controller
              name="createdAtEnd"
              control={control}
              render={({ field }) => (
                <Input
                  type="date"
                  value={
                    field.value
                      ? DateTime.fromISO(field.value).toFormat("yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        ? DateTime.fromFormat(e.target.value, "yyyy-MM-dd")
                            .endOf("day")
                            .toISO()
                        : "",
                    )
                  }
                  placeholder="Data de Fim"
                />
              )}
            />
          </div>

          <Button type="submit" className="w-full">
            Aplicar Filtros
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
