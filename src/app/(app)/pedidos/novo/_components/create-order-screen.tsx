import { QueryFormType } from "@/app/api/forms/query-form.dto.";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PaymentStatus } from "@/generated/prisma/enums";
import { authClient } from "@/lib/auth/client";
import { KANBAN_QUERY_KEY } from "@/modules/orders/constants";
import {
  CreateOrderData,
  createOrderSchema,
} from "@/modules/orders/dtos/create-order.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ClipboardList, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ProductSelectionSection } from "../../_components/product-selection-section";
import { CreateOrderForm } from "./create-order-form";
import { OrderSummarySection } from "./order-summary-section";

interface Props {
  serverData: QueryFormType | undefined;
  phone: string;
}

const CreateOrder = ({ serverData, phone }: Props) => {
  const { data: sessionData } = authClient.useSession();

  const form = useForm<CreateOrderData>({
    resolver: zodResolver(createOrderSchema) as any,
    defaultValues: {
      // Detalhes
      deliveryPeriod: "" as any,
      deliveryDate: "",
      deliveryExpressTime: "" as any,
      sellerId: sessionData?.user.id || "",
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

      productVariants: [],
    },
  });

  const { fields: products, replace: replaceProducts } = useFieldArray({
    control: form.control,
    name: "productVariants",
  });

  const router = useRouter();
  const queryClient = useQueryClient();

  const onSubmit = async (data: CreateOrderData) => {
    if (data.productVariants.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido.");
      return;
    }

    try {
      const { message } = await axios
        .post("/api/orders", data)
        .then((res) => res.data);

      toast.success(message);
      queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
      router.push("/dashboard");
    } catch (e: any) {
      toast.error(e.response?.data.error || "Erro ao salvar pedido");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3/4 px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
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

        <div className="grid gap-8 lg:grid-cols-5">
          {/* LEFT COLUMN — Product Search */}
          <div className="lg:col-span-2 space-y-4">
            <ProductSelectionSection
              value={products}
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
                  value={products}
                  onChange={(v) => replaceProducts(v)}
                />

                <CreateOrderForm form={form} />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button type="submit" className="gap-2 font-body">
                    <Send className="h-4 w-4" />
                    Finalizar Pedido
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;
