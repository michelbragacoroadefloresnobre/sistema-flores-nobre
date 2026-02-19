import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/generated/prisma/browser";
import {
  ContactOrigin,
  DeliveryPeriod,
  PaymentStatus,
  PaymentType,
  Role,
} from "@/generated/prisma/enums";
import { authClient } from "@/lib/auth/client";
import { canPerformAction } from "@/lib/utils";
import { CreateOrderData } from "@/modules/orders/dtos/create-order.dto";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface DetalhesSectionProps {
  form: UseFormReturn<CreateOrderData>;
  onNext: () => void;
}

export function CreateOrderFormSectionDetails({
  form,
  onNext,
}: DetalhesSectionProps) {
  const isExpressDelivery =
    form.watch("deliveryPeriod") === DeliveryPeriod.EXPRESS;
  const isBoleto = form.watch("paymentType") === PaymentType.BOLETO;

  const onComplete = async () => {
    const isValidated = await form.trigger([
      "deliveryPeriod",
      "deliveryDate",
      "deliveryExpressTime",
      "sellerId",
      "contactOrigin",
      "paymentType",
      "boletoDue",
      "paymentStatus",
      "isWaited",
      "internalNote",
    ]);
    if (isValidated) onNext();
  };

  const { data: sessionData } = authClient.useSession();

  const { data: sellersData, isPending: isSellersDataPending } = useQuery<
    User[]
  >({
    queryKey: ["sellers"],
    queryFn: async () =>
      axios
        .get("/api/users", {
          params: { role: [Role.SELLER, Role.SUPERVISOR] },
        })
        .then((res) => res.data.data),
  });

  const handleSelectedSeller = (v: string) => {
    form.setValue("sellerId", v);
  };
  const isAdmin = canPerformAction([], sessionData?.user.role as any);

  return (
    <div className="space-y-6">
      <CardContent className="space-y-6">
        <p className="text-lg font-semibold">Detalhes</p>
        <div className="grid gap-4 gap-x-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="deliveryPeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Entrega no Periodo <b className="text-red-600">*</b>
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    if (v === DeliveryPeriod.EXPRESS) {
                      form.unregister("deliveryDate");
                      form.setValue("deliveryExpressTime", "" as any);
                    } else {
                      form.setValue("deliveryDate", "");
                      form.unregister("deliveryExpressTime");
                    }
                  }}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um periodo" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    <SelectItem value={DeliveryPeriod.EXPRESS}>
                      Expresso
                    </SelectItem>
                    <SelectItem value={DeliveryPeriod.MORNING}>
                      Manhã
                    </SelectItem>
                    <SelectItem value={DeliveryPeriod.AFTERNOON}>
                      Tarde
                    </SelectItem>
                    {/* <SelectItem value={DeliveryPeriod.EVENING}>Noite</SelectItem> */}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          {isExpressDelivery ? (
            <FormField
              control={form.control}
              name="deliveryExpressTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Entregar em até <b className="text-red-600">*</b>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl className="w-full">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tempo máximo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PT1H">1 hora</SelectItem>
                      <SelectItem value="PT2H">2 horas</SelectItem>
                      <SelectItem value="PT3H">3 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Data de Entrega <b className="text-red-600">*</b>
                  </FormLabel>
                  <FormControl className="w-full">
                    <Input
                      {...field}
                      className="w-full"
                      type="date"
                      placeholder="Data de Entrega"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="sellerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Vendedor Responsável <b className="text-red-600">*</b>
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => handleSelectedSeller(v)}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      {isSellersDataPending ? (
                        "Carregando..."
                      ) : (
                        <SelectValue placeholder="Selecione o vendedor" />
                      )}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sellersData?.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactOrigin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Origem do Contato <b className="text-red-600">*</b>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma origem do contato" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ContactOrigin.NONE}>
                      Sem Contato
                    </SelectItem>
                    <SelectItem value={ContactOrigin.PHONE}>
                      Telefone
                    </SelectItem>
                    <SelectItem value={ContactOrigin.WHATSAPP}>
                      WhatsApp
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Tipo de Pagamento <b className="text-red-600">*</b>
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    if (v === PaymentType.BOLETO)
                      form.setValue("boletoDue", "");
                    else form.unregister("boletoDue");
                  }}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um método de pagamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={PaymentType.BOLETO}>Boleto</SelectItem>
                    <SelectItem value={PaymentType.CARD_CREDIT}>
                      Cartão de Crédito
                    </SelectItem>
                    <SelectItem value={PaymentType.PIX}>Pix</SelectItem>
                    <SelectItem value={PaymentType.PIX_CNPJ}>
                      Pix (CNPJ)
                    </SelectItem>
                    <SelectItem value={PaymentType.MONEY}>Dinheiro</SelectItem>
                    <SelectItem value={PaymentType.PATNERSHIP}>
                      Parceria
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {isBoleto && (
            <FormField
              control={form.control}
              name="boletoDue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Vencimento do Boleto <b className="text-red-600">*</b>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl className="w-full">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o vencimento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={"7"}>
                        7 dias (
                        {format(addDays(new Date(), 7), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                        )
                      </SelectItem>
                      <SelectItem value={"15"}>
                        15 dias (
                        {format(addDays(new Date(), 15), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                        )
                      </SelectItem>
                      <SelectItem value={"30"}>
                        30 dias (
                        {format(addDays(new Date(), 30), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                        )
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="paymentStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Status do Pagamento <b className="text-red-600">*</b>
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status de pagamento" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    <SelectItem value={PaymentStatus.PAID}>Pago</SelectItem>
                    <SelectItem value={PaymentStatus.ACTIVE}>
                      Não Pago
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isWaited"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Colocar em modo espera
                  <b className="text-red-600">*</b>
                </FormLabel>
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(v === "true")}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a opção..." />
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
        </div>

        <FormField
          control={form.control}
          name="internalNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observação interna</FormLabel>
              <FormControl>
                <Textarea
                  maxLength={255}
                  {...field}
                  placeholder="Digite uma observação interna"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button type="button" disabled={true} variant="outline">
          Voltar
        </Button>
        <Button type="button" onClick={onComplete}>
          Próximo
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </div>
  );
}
