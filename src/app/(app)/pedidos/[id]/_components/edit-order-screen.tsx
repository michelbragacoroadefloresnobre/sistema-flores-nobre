"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { OrderStatus, Prisma } from "@/generated/prisma/browser";
import { getVariantLabel } from "@/lib/utils";
import { KANBAN_QUERY_KEY } from "@/modules/orders/constants";
import {
  EditOrderData,
  editOrderSchema,
} from "@/modules/orders/dtos/edit-order.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { ClipboardList, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { OrderSummarySection } from "../../_components/order-summary-section";
import { ProductSelectionSection } from "../../_components/product-selection-section";
import { EditOrderForm } from "./edit-order-form";
import { PaymentsSection } from "./payments-section";

interface Props {
  order: Prisma.OrderGetPayload<{
    include: {
      contact: { include: { city: true } };
      city: true;
      product: true;
      payments: true;
      orderProducts: {
        include: {
          variant: { include: { product: { select: { name: true } } } };
        };
      };
    };
  }>;
}

const EditOrderScreen = ({ order }: Props) => {
  const isExpressDelivery = order.deliveryPeriod === "EXPRESS";

  const form = useForm<EditOrderData>({
    resolver: zodResolver(editOrderSchema) as any,
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

      productVariants: Object.values(
        order.orderProducts.reduce((acc, or) => {
          if (acc[or.variantId]) acc[or.variantId].quantity += 1;
          else
            acc[or.variantId] = {
              quantity: 1,
              productId: or.variant.productId,
              productName: or.variant.product.name,
              variantId: or.variantId,
              label: getVariantLabel({
                color: or.variant.color,
                size: or.variant.size,
              }),
            };

          return acc;
        }, {}),
      ),
    },
  });

  const { fields: products, replace: replaceProducts } = useFieldArray({
    control: form.control,
    name: "productVariants",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const queryClient = useQueryClient();

  const onSubmit = async () => {
    const isApproved = await form.trigger();

    if (!isApproved) return;
    const data = form.getValues();

    if (data.productVariants.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { message } = await axios
        .put(`/api/orders/${order.id}`, data)
        .then((res) => res.data);

      toast.success(message);
      queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
      router.push("/dashboard");
    } catch (e: any) {
      toast.error(e.response?.data.error || "Erro ao salvar pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasSupplier =
    order.orderStatus === OrderStatus.PRODUCING ||
    order.orderStatus === OrderStatus.DELIVERING_ON_ROUTE ||
    order.orderStatus === OrderStatus.DELIVERING_DELIVERED ||
    order.orderStatus === OrderStatus.FINALIZED;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3/4 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight font-display text-foreground">
                Novo Pedido
              </h1>
              <p className="text-sm text-muted-foreground font-body">
                Selecione produtos, preencha os dados e finalize
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              className="gap-2 font-body"
              disabled={isSubmitting}
              onClick={onSubmit}
            >
              {isSubmitting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Salvando Pedido...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Salvar Pedido
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* LEFT COLUMN — Product Search */}
          <div className="lg:col-span-2 space-y-4">
            <ProductSelectionSection
              hasSupplier={hasSupplier}
              value={products as any}
              onChange={(v) => replaceProducts(v)}
            />
          </div>

          {/* RIGHT COLUMN — Order form */}
          <div className="lg:col-span-3 space-y-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <OrderSummarySection
                  value={products as any}
                  hasSupplier={hasSupplier}
                  hidePricing={true}
                  onChange={(v) => replaceProducts(v)}
                />

                <EditOrderForm form={form} />

                <PaymentsSection orderId={order.id} data={order.payments} />
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrderScreen;
