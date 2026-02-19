"use client";

import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Prisma } from "@/generated/prisma/browser";
import { KANBAN_QUERY_KEY } from "@/modules/orders/constants";
import {
  CreateOrderData,
  CreateOrderFormSection,
} from "@/modules/orders/dtos/create-order.dto";
import { editOrderSchema } from "@/modules/orders/dtos/edit-order.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { EditOrderFormHeader } from "./edit-order-form-header";
import { EditOrderFormSectionContact } from "./edit-order-form-section-customer";
import { EditOrderFormSectionDetails } from "./edit-order-form-section-details";
import { EditOrderFormSectionOrder } from "./edit-order-form-section-order";
import { PaymentsSection } from "./payments-section";

interface Props {
  order: Prisma.OrderGetPayload<{
    include: {
      contact: { include: { city: true } };
      city: true;
      product: true;
      payments: true;
    };
  }>;
}

export const EditOrderForm = ({ order }: Props) => {
  const [currentSection, setCurrentSection] =
    useState<CreateOrderFormSection>("Detalhes");

  const router = useRouter();
  const queryClient = useQueryClient();

  const isExpressDelivery = order.deliveryPeriod === "EXPRESS";

  const form = useForm({
    resolver: zodResolver(editOrderSchema),
    defaultValues: {
      // Detalhes
      deliveryPeriod: order.deliveryPeriod || ("" as any),
      deliveryDate: !isExpressDelivery
        ? format(order.deliveryUntil, "yyyy-MM-dd")
        : undefined,
      deliveryUntil: isExpressDelivery
        ? String(order.deliveryUntil)
        : undefined,
      sellerId: order.userId || "",
      contactOrigin: order.contactOrigin || ("" as any),
      internalNote: order.internalNote || "",

      // Pedido
      honoreeName: order.honoreeName || "",
      tributeCardPhrase: order.tributeCardPhrase || "",
      tributeCardType: order.tributeCardType || ("" as any),
      productSize: order.product.size || ("" as any),
      productId: order.productId || "",
      supplierNote: order.supplierNote || "",
      deliveryZipCode: String(order.deliveryZipCode).padStart(8, "0") || "",
      deliveryAddress: order.deliveryAddress || "",
      deliveryAddressNumber: order.deliveryAddressNumber || "",
      deliveryAddressComplement: order.deliveryAddressComplement || "",
      deliveryNeighboorhood: order.deliveryNeighboorhood || "",
      deliveryIbge: order.city.ibge || "",
      deliveryCity: order.city.name || "",
      deliveryUf: order.city.uf || ("" as any),

      customerName: order.contact.name || "",
      customerLegalName: order.contact.legalName || "",
      customerIe: order.contact.ie || "",
      customerEmail: order.contact.email || "",
      customerPhone: order.contact.phone || "",
      customerTaxId: order.contact.taxId || "",
      customerPersonType: order.contact.personType || ("" as any),
      needInvoice: false,

      customerZipCode: String(order.contact.zipCode).padStart(8, "0") || "",
      customerAddress: order.contact.address || "",
      customerAddressNumber: order.contact.addressNumber || "",
      customerAddressComplement: order.contact.addressComplement || "",
      customerNeighboorhood: order.contact.neighboorhood || "",
      customerIbge: order.contact.ibge || "",
      customerCity: order.contact.city.name || "",
      customerUf: order.contact.city.uf || ("" as any),
    },
  });

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: CreateOrderData) => {
      const res = await axios.put(`/api/orders/${order.id}`, data);

      return res.data;
    },
    onSuccess: ({ message }) => {
      queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
      toast.success(message || "Pedido atualizado com sucesso!");
      router.push("/dashboard");
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.error || "Erro ao salvar pedido");
    },
  });

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8">
      <div className="space-y-6">
        <EditOrderFormHeader
          form={form as any}
          disabledClick={false}
          currentSection={currentSection}
          onSectionChange={(section) => setCurrentSection(section)}
        />

        <Card className="py-6 px-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutate(data as any))}>
              {currentSection === "Detalhes" && (
                <EditOrderFormSectionDetails
                  form={form as any}
                  onNext={() => setCurrentSection("Pedido")}
                />
              )}
              {currentSection === "Pedido" && (
                <EditOrderFormSectionOrder
                  form={form as any}
                  onBack={() => setCurrentSection("Detalhes")}
                  onNext={() => setCurrentSection("Contato")}
                />
              )}

              {currentSection === "Contato" && (
                <EditOrderFormSectionContact
                  form={form as any}
                  isSubmitting={isPending}
                  onBack={() => setCurrentSection("Pedido")}
                />
              )}
            </form>
          </Form>
        </Card>
        <PaymentsSection orderId={order.id} data={order.payments} />
      </div>
    </div>
  );
};
