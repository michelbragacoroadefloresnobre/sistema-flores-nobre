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
import { ContactOrigin, DeliveryPeriod, Role } from "@/generated/prisma/enums";
import { authClient } from "@/lib/auth/client";
import { canPerformAction } from "@/lib/utils";
import { EditOrderData } from "@/modules/orders/dtos/edit-order.dto";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ChevronRight } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { DeliveryExpressTimeInput } from "./delivery-express-time-input";

interface DetalhesSectionProps {
  form: UseFormReturn<EditOrderData>;
  onNext: () => void;
}

export function EditOrderFormSectionDetails({
  form,
  onNext,
}: DetalhesSectionProps) {
  const isExpressDelivery =
    form.watch("deliveryPeriod") === DeliveryPeriod.EXPRESS;

  const onComplete = async () => {
    const isValidated = await form.trigger([
      "deliveryPeriod",
      "deliveryDate",
      "deliveryUntil",
      "sellerId",
      "contactOrigin",
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
      (
        await axios.get("/api/users", {
          params: { role: [Role.SELLER, Role.SUPERVISOR] },
        })
      ).data.data,
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
                      form.setValue("deliveryUntil", "");
                    } else {
                      form.setValue("deliveryDate", "");
                      form.unregister("deliveryUntil");
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
              name="deliveryUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Entrega Até <b className="text-red-600">*</b>
                  </FormLabel>
                  <DeliveryExpressTimeInput
                    value={field.value}
                    onChange={field.onChange}
                  />
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

          {isAdmin && (
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
          )}

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
                      Sem Comunicação
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
