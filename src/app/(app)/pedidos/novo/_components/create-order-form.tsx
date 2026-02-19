"use client";

import { QueryFormType } from "@/app/api/forms/query-form.dto.";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { PaymentStatus, PaymentType } from "@/generated/prisma/enums";
import { authClient } from "@/lib/auth/client";
import { KANBAN_QUERY_KEY } from "@/modules/orders/constants";
import {
  CreateOrderData,
  CreateOrderFormSection,
  createOrderSchema,
} from "@/modules/orders/dtos/create-order.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { addDays } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CreateOrderFormHeader } from "./create-order-form-header";
import { CreateOrderFormSectionCustomer } from "./create-order-form-section-customer";
import { CreateOrderFormSectionDetails } from "./create-order-form-section-details";
import { CreateOrderFormSectionOrder } from "./create-order-form-section-order";

interface Props {
  serverData: QueryFormType | undefined;
  phone: string;
}

export const CreateOrderForm = ({ serverData, phone }: Props) => {
  const [currentSection, setCurrentSection] =
    useState<CreateOrderFormSection>("Detalhes");
  const { data: sessionData } = authClient.useSession();

  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      // Detalhes
      deliveryPeriod: "" as any,
      deliveryDate: "",
      deliveryExpressTime: "" as any,
      sellerId: sessionData?.user.id,
      contactOrigin: "" as any,
      paymentType: "" as any,
      paymentStatus: PaymentStatus.ACTIVE,
      boletoDue: "" as any,
      internalNote: "",
      isWaited: false,

      // Pedido
      honoreeName: "",
      tributeCardPhrase: "",
      tributeCardType: "" as any,
      productSize: "" as any,
      productId: "",
      amount: "",
      supplierNote: "",
      deliveryZipCode: "",
      deliveryAddress: "",
      deliveryAddressNumber: "",
      deliveryAddressComplement: "",
      deliveryNeighboorhood: "",
      deliveryIbge: "",
      deliveryCity: "",
      deliveryUf: "" as any,

      customerName: serverData?.name || "",
      customerLegalName: "",
      customerIe: "",
      customerEmail: serverData?.email || "",
      customerPhone: phone || "",
      customerTaxId: "",
      customerPersonType: "" as any,
      needInvoice: false,

      customerZipCode: "",
      customerAddress: "",
      customerAddressNumber: "",
      customerAddressComplement: "",
      customerNeighboorhood: "",
      customerIbge: "",
      customerCity: "",
      customerUf: "" as any,
    },
  });

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: CreateOrderData) => {
      if (data.boletoDue && data.paymentType === PaymentType.BOLETO)
        data.boletoDue = addDays(
          new Date(),
          parseInt(data.boletoDue || ""),
        ).toISOString();

      const res = await axios.post("/api/orders", data);

      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
      router.push("/dashboard");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.error || "Erro ao salvar pedido");
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="space-y-6">
        <CreateOrderFormHeader
          form={form as any}
          disabledClick={false}
          currentSection={currentSection}
          onSectionChange={(section) => setCurrentSection(section)}
        />

        <Card className="py-6 px-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutate(data as any))}>
              {currentSection === "Detalhes" && (
                <CreateOrderFormSectionDetails
                  form={form as any}
                  onNext={() => setCurrentSection("Pedido")}
                />
              )}
              {currentSection === "Pedido" && (
                <CreateOrderFormSectionOrder
                  form={form as any}
                  onBack={() => setCurrentSection("Detalhes")}
                  onNext={() => setCurrentSection("Contato")}
                />
              )}

              {currentSection === "Contato" && (
                <CreateOrderFormSectionCustomer
                  form={form as any}
                  isSubmitting={isPending}
                  onBack={() => setCurrentSection("Pedido")}
                />
              )}
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
};
