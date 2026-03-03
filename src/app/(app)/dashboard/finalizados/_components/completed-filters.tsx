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
import {
  ContactOrigin,
  PaymentStatus,
  PersonType,
  SupplierPaymentStatus,
} from "@/generated/prisma/enums";
import { DateTime } from "luxon";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return digits;
}

export interface CompletedFilterOptions {
  createdAtStart?: string;
  createdAtEnd?: string;
  idOrder?: string;
  canceledOrders?: string;
  paidStatus?: string;
  paidAtStart?: string;
  paidAtEnd?: string;
  supplierPaymentStatus?: string;
  contact?: string;
  contactType?: string;
  contactOrigin?: string;
  taxId?: string;
  sellers?: Array<string>;
  suppliers?: Array<string>;
  product?: string;
  coverageAreaStart?: string;
  coverageAreaEnd?: string;
}

interface SupplierOption {
  id: string;
  name: string;
}

interface FormFiltersProps {
  onApplyFilter: (data: CompletedFilterOptions) => void;
  initialFilters: CompletedFilterOptions;
  sellers: User[];
  suppliers: SupplierOption[];
}

export default function FormFilters({
  onApplyFilter,
  sellers,
  suppliers,
  initialFilters: initialFilter,
}: FormFiltersProps) {
  const [open, setOpen] = useState(false);

  const { control, handleSubmit } = useForm<CompletedFilterOptions>({
    defaultValues: initialFilter,
  });

  const onSubmit = (data: CompletedFilterOptions) => {
    const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
      if (
        value &&
        value !== "none" &&
        (Array.isArray(value) ? value.length > 0 : true)
      ) {
        acc[key as keyof CompletedFilterOptions] = value;
      }
      return acc;
    }, {} as CompletedFilterOptions);

    onApplyFilter(filteredData);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">Abrir Filtros</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-100 overflow-y-auto">
        <SheetTitle className="hidden">Filtros de Pesquisa</SheetTitle>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <h2 className="text-xl font-bold mb-4">Filtros</h2>

          <div className="mb-4 space-y-2">
            <Label>Período de Criação:</Label>
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

          <div className="mb-4 space-y-2">
            <Label>ID do Pedido:</Label>
            <Controller
              name="idOrder"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="ID do Pedido"
                />
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>Pedidos Cancelados:</Label>
            <Controller
              name="canceledOrders"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent className="overflow-y-auto">
                    <SelectItem value="none">Não Definido</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>Status de Pagamento:</Label>
            <Controller
              name="paidStatus"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent className="overflow-y-auto">
                    <SelectItem value="none">Não Definido</SelectItem>
                    <SelectItem value={PaymentStatus.ACTIVE}>
                      Ativo
                    </SelectItem>
                    <SelectItem value={PaymentStatus.PAID}>Pago</SelectItem>
                    <SelectItem value={PaymentStatus.CANCELLED}>
                      Cancelado
                    </SelectItem>
                    <SelectItem value={PaymentStatus.PROCESSING}>
                      Processando
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>Período de Pagamento:</Label>
            <Controller
              name="paidAtStart"
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
              name="paidAtEnd"
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

          <div className="mb-4 space-y-2">
            <Label>Pagamento do Fornecedor:</Label>
            <Controller
              name="supplierPaymentStatus"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent className="overflow-y-auto">
                    <SelectItem value="none">Não Definido</SelectItem>
                    <SelectItem value={SupplierPaymentStatus.WAITING}>
                      Aguardando
                    </SelectItem>
                    <SelectItem value={SupplierPaymentStatus.PAID}>
                      Pago
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>Contato:</Label>
            <Controller
              name="contact"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Nome, email ou telefone"
                />
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>Tipo de Contato:</Label>
            <Controller
              name="contactType"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent className="overflow-y-auto">
                    <SelectItem value="none">Não Definido</SelectItem>
                    <SelectItem value={PersonType.PF}>
                      Pessoa Física
                    </SelectItem>
                    <SelectItem value={PersonType.PJ}>
                      Pessoa Jurídica
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>Origem do Contato:</Label>
            <Controller
              name="contactOrigin"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || "none"}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent className="overflow-y-auto">
                    <SelectItem value="none">Não Definido</SelectItem>
                    <SelectItem value={ContactOrigin.WHATSAPP}>
                      WhatsApp
                    </SelectItem>
                    <SelectItem value={ContactOrigin.PHONE}>
                      Telefone
                    </SelectItem>
                    <SelectItem value={ContactOrigin.NONE}>Nenhum</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>CPF/CNPJ:</Label>
            <Controller
              name="taxId"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="CPF ou CNPJ"
                />
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>Vendedores:</Label>
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
            <Label>Fornecedores:</Label>
            <Controller
              name="suppliers"
              control={control}
              render={({ field }) => (
                <Combobox
                  items={suppliers || []}
                  multiple
                  value={field.value}
                  onValueChange={(items) => field.onChange(items)}
                >
                  <ComboboxChips>
                    <ComboboxValue>
                      {(field.value || []).map((v) => (
                        <ComboboxChip key={v}>
                          {suppliers?.find((s) => s.id === v)?.name}
                        </ComboboxChip>
                      ))}
                    </ComboboxValue>
                    <ComboboxChipsInput placeholder="Adicione um fornecedor" />
                  </ComboboxChips>
                  <ComboboxContent>
                    <ComboboxEmpty>
                      Nenhum fornecedor encontrado
                    </ComboboxEmpty>
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
            <Label>Produto:</Label>
            <Controller
              name="product"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Nome do Produto"
                />
              )}
            />
          </div>

          <div className="mb-4 space-y-2">
            <Label>Área de Cobertura (CEP):</Label>
            <Controller
              name="coverageAreaStart"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  className="mb-2"
                  value={field.value ? formatCep(field.value) : ""}
                  onChange={(e) =>
                    field.onChange(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  placeholder="CEP Inicial (00000-000)"
                  maxLength={9}
                />
              )}
            />
            <Controller
              name="coverageAreaEnd"
              control={control}
              render={({ field }) => (
                <Input
                  type="text"
                  value={field.value ? formatCep(field.value) : ""}
                  onChange={(e) =>
                    field.onChange(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  placeholder="CEP Final (99999-999)"
                  maxLength={9}
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