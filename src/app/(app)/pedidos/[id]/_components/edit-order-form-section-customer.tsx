import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { PersonType } from "@/generated/prisma/enums";
import { UFS } from "@/lib/env";
import {
  formatCNPJInput,
  formatCPFInput,
  formatPhoneInput,
  formatZipCodeInput,
} from "@/lib/utils";
import { CreateOrderData } from "@/modules/orders/dtos/create-order.dto";
import axios from "axios";
import { ChevronLeft, ChevronRight, SearchIcon } from "lucide-react";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";

interface Props {
  form: UseFormReturn<CreateOrderData>;
  onBack: () => void;
  isSubmitting: boolean;
}

export function EditOrderFormSectionContact({
  form,
  isSubmitting,
  onBack,
}: Props) {
  const personType = form.watch("customerPersonType");
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);

  // const onComplete = async () => {
  //   const isValidated = await form.trigger([
  //     "customerName",
  //     "customerEmail",
  //     "customerPhone",
  //     "customerLegalName",
  //     "customerIe",
  //     "customerTaxId",
  //     "customerPersonType",
  //     "needInvoice",
  //     "customerZipCode",
  //     "customerAddress",
  //     "customerAddressNumber",
  //     "customerAddressComplement",
  //     "customerNeighboorhood",
  //     "customerCity",
  //     "customerUf",
  //   ]);
  //   if (isValidated) onNext();
  // };

  const handleTipoPessoaChange = (value: string) => {
    form.setValue("customerTaxId", "");
    form.setValue("customerLegalName", "");
    form.setValue("customerIe", "");
    // form.setValue("precisaNotaFiscal", "false");
    return value;
  };

  const searchZipCode = async (raw: string) => {
    setIsSearchingCep(true);
    if (raw.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await response.json();

        if (!data.erro) {
          form.setValue("customerAddress", data.logradouro || "");
          form.setValue("customerNeighboorhood", data.bairro || "");
          form.setValue("customerIbge", data.ibge || "");
          form.setValue("customerCity", data.localidade || "");
          form.setValue("customerUf", data.uf || "");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
    setIsSearchingCep(false);
  };

  const handleZipCodeChange = (e: any) => {
    const input = e.target.value;
    const raw = input.replace(/\D/g, "");

    if (raw.length > 8) return;

    form.setValue("customerZipCode", raw);

    if (raw?.length === 8) searchZipCode(raw);
  };

  const searchCnpj = async (raw: string) => {
    setIsSearchingCnpj(true);
    try {
      const response = await axios.get(`https://publica.cnpj.ws/cnpj/${raw}`);
      if (response.data) {
        console.log({ data: response.data });
        const data = response.data;
        const inscricoesEstaduais =
          data.estabelecimento.inscricoes_estaduais?.filter(
            (ie) => ie.estado.id === data.estabelecimento.estado.id && ie.ativo,
          );
        let razaoSocial = data.razao_social || "";
        if (razaoSocial.length > 63) razaoSocial = razaoSocial.slice(0, 63);
        form.setValue("customerLegalName", razaoSocial);
        form.setValue(
          "customerIe",
          inscricoesEstaduais.length
            ? inscricoesEstaduais[0].inscricao_estadual
            : "",
        );
        form.setValue("customerZipCode", data.estabelecimento.cep || "");
        form.setValue("customerAddress", data.estabelecimento.logradouro || "");
        form.setValue(
          "customerNeighboorhood",
          data.estabelecimento.bairro || "",
        );
        form.setValue(
          "customerAddressNumber",
          data.estabelecimento.numero || "",
        );
        form.setValue(
          "customerAddressComplement",
          data.estabelecimento.complemento || "",
        );
        await searchZipCode(data.estabelecimento.cep);
      }
    } catch (error) {
      console.error("Erro ao consultar CNPJ:", error);
    }
    setIsSearchingCnpj(false);
  };

  const isPJ = personType === PersonType.PJ;
  const taxId = form.watch("customerTaxId");
  const zipCode = form.watch("customerZipCode");

  return (
    <div className="space-y-6">
      <CardContent className="space-y-6">
        <p className="text-lg font-semibold">Cliente</p>
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nome do Cliente <b className="text-red-600">*</b>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite o nome completo" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <b className="text-red-600">*</b>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="email@exemplo.com"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Telefone <b className="text-red-600">*</b>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+55 (11) 00000-0000"
                      value={formatPhoneInput(field.value)}
                      inputMode="numeric"
                      disabled
                      onChange={(e) => {
                        const input = e.target.value;
                        const currentNumbers = input.replace(/\D/g, "");
                        const previousNumbers = field.value || "";

                        const isTyping =
                          currentNumbers.length > previousNumbers.length;

                        if (isTyping) {
                          if (
                            !previousNumbers &&
                            !currentNumbers.startsWith("55")
                          ) {
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
              name="needInvoice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Precisa de Nota Fiscal <b className="text-red-600">*</b>
                  </FormLabel>
                  <Select
                    value={field.value.toString()}
                    disabled
                    onValueChange={(v) => field.onChange(v === "true")}
                  >
                    <FormControl className="w-full">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma opção" />
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

            {isPJ && (
              <>
                <FormField
                  control={form.control}
                  name="customerLegalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Razão Social <b className="text-red-600">*</b>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          maxLength={64}
                          placeholder="Razão Social"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerIe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Inscrição Estadual <b className="text-red-600">*</b>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value.replace(/\D/g, ""));
                          }}
                          placeholder="Inscrição Estadual"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="customerPersonType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tipo de Pessoa <b className="text-red-600">*</b>
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(handleTipoPessoaChange(value))
                    }
                  >
                    <FormControl className="w-full">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de pessoa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={PersonType.PF}>PF</SelectItem>
                      <SelectItem value={PersonType.PJ}>PJ</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerTaxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {personType === PersonType.PJ ? "CNPJ" : "CPF"}{" "}
                    <b className="text-red-600">*</b>
                  </FormLabel>
                  <InputGroup>
                    <FormControl>
                      <InputGroupInput
                        placeholder={
                          isPJ ? "00.000.000/0000-00" : "000.000.000-00"
                        }
                        value={
                          isPJ
                            ? formatCNPJInput(field.value)
                            : formatCPFInput(field.value)
                        }
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");
                          if (isPJ ? raw.length > 14 : raw.length > 11) return;
                          field.onChange(raw);
                          if (isPJ && raw.length === 14) searchCnpj(raw);
                        }}
                        disabled={!personType || isSearchingCnpj}
                      />
                    </FormControl>
                    {isPJ && (
                      <InputGroupAddon align={"inline-end"}>
                        {isSearchingCnpj ? (
                          <Spinner />
                        ) : (
                          <InputGroupButton
                            onClick={() => searchCnpj(taxId)}
                            disabled={taxId.length < 14}
                          >
                            <SearchIcon />
                          </InputGroupButton>
                        )}
                      </InputGroupAddon>
                    )}
                  </InputGroup>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerZipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    CEP <b className="text-red-600">*</b>
                  </FormLabel>
                  <InputGroup>
                    <FormControl>
                      <InputGroupInput
                        value={formatZipCodeInput(field.value)}
                        placeholder="00000-000"
                        disabled={isSearchingCep}
                        onChange={handleZipCodeChange}
                      />
                    </FormControl>
                    <InputGroupAddon align="inline-end">
                      {isSearchingCep ? (
                        <Spinner />
                      ) : (
                        <InputGroupButton
                          onClick={() => searchZipCode(zipCode)}
                          disabled={zipCode.length < 8}
                        >
                          <SearchIcon />
                        </InputGroupButton>
                      )}
                    </InputGroupAddon>
                  </InputGroup>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Endereço <b className="text-red-600">*</b>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={255}
                      placeholder="Rua, Avenida, etc"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerAddressNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={10} placeholder="Numero" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerAddressComplement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={255}
                      placeholder="Apto, Sala, etc"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="customerNeighboorhood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Bairro <b className="text-red-600">*</b>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={255} placeholder="Bairro" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Cidade <b className="text-red-600">*</b>
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled
                      {...field}
                      maxLength={255}
                      placeholder="Cidade"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerUf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    UF <b className="text-red-600">*</b>
                  </FormLabel>
                  <Combobox
                    items={UFS}
                    disabled
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl className="w-full">
                      <ComboboxInput disabled placeholder="Selecione uma UF" />
                    </FormControl>
                    <ComboboxContent>
                      <ComboboxEmpty>Nenhuma UF encontrada</ComboboxEmpty>
                      <ComboboxList>
                        {(uf) => (
                          <ComboboxItem key={uf} value={uf}>
                            {uf}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Button
          type="submit"
          disabled={isSearchingCep || isSearchingCnpj || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner /> Salvando
            </>
          ) : (
            <>
              Concluir
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </div>
  );
}
