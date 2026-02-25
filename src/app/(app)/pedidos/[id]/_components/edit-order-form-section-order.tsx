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
import { Textarea } from "@/components/ui/textarea";
import { UFS } from "@/lib/env";
import { formatZipCodeInput } from "@/lib/utils";
import { EditOrderData } from "@/modules/orders/dtos/edit-order.dto";
import { ChevronLeft, ChevronRight, SearchIcon } from "lucide-react";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";

interface EditFormOrderSectionProps {
  form: UseFormReturn<EditOrderData>;
  onBack: () => void;
  onNext: () => void;
}

export function EditOrderFormSectionOrder({
  form,
  onBack,
  onNext: onComplete,
}: EditFormOrderSectionProps) {
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const searchZipCode = async (raw: string) => {
    setIsSearchingCep(true);
    if (raw.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
        const data = await response.json();

        if (!data.erro) {
          form.setValue("deliveryAddress", data.logradouro || "");
          form.setValue("deliveryNeighboorhood", data.bairro || "");
          form.setValue("deliveryIbge", data.ibge);
          form.setValue("deliveryCity", data.localidade || "");
          form.setValue("deliveryUf", data.uf || "");
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

    form.setValue("deliveryZipCode", raw);

    if (raw?.length === 8) searchZipCode(raw);
  };

  const onClickedNextButton = async () => {
    const isValidated = await form.trigger([
      "honoreeName",
      "tributeCardPhrase",
      "tributeCardType",
      "supplierNote",
    ]);
    if (isValidated) onComplete();
  };

  const zipCode = form.watch("deliveryZipCode");

  return (
    <div className="space-y-6">
      <CardContent className="space-y-6">
        <p className="text-lg font-semibold">Pedido</p>
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="honoreeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nome do Homenageado <b className="text-red-600">*</b>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Digite o nome do homenageado"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="tributeCardPhrase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Cartão de Homenagem <b className="text-red-600">*</b>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Digite o cartão de homenagem"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tributeCardType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tipo de Cartão <b className="text-red-600">*</b>
                  </FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v)}
                    value={field.value}
                  >
                    <FormControl className="w-full">
                      <SelectTrigger>
                        <SelectValue placeholder="Quem é o remetente da homenagem?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PJ">PJ</SelectItem>
                      <SelectItem value="PF">PF</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="supplierNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observação para o Fornecedor</FormLabel>
                <FormControl className="w-full">
                  <Textarea
                    maxLength={255}
                    {...field}
                    placeholder="Adicionar flores do campo, 10cm..."
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="deliveryZipCode"
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
              name="deliveryAddress"
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
              name="deliveryAddressNumber"
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
              name="deliveryAddressComplement"
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
              name="deliveryNeighboorhood"
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
              name="deliveryCity"
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
              name="deliveryUf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    UF <b className="text-red-600">*</b>
                  </FormLabel>
                  <Combobox
                    disabled
                    items={UFS}
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
          type="button"
          disabled={isSearchingCep}
          onClick={onClickedNextButton}
        >
          Próximo
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </div>
  );
}
