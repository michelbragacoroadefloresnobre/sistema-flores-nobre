"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from "@/generated/prisma/browser";
import { PaymentUtils } from "@/lib/payment-utils";
import { revalidatePath } from "@/lib/revalidate-sc";
import { cn, convertCurrencyInput } from "@/lib/utils";
import { paymentFormSchema } from "@/modules/payments/payment.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Barcode,
  Clock,
  CreditCard,
  DollarSign,
  Handshake,
  Plus,
  QrCode,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PaymentsSectionActionButtons } from "./payments-section-action-buttons";

const formatCurrency = (value: string | number) => {
  const numericValue = Number(value);
  if (isNaN(numericValue)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
};

export type PaymentFormData = z.infer<typeof paymentFormSchema>;

export function PaymentsSection({
  orderId,
  data,
}: {
  orderId: string;
  data: Payment[];
}) {
  const payments = data;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreationPending, setIsCreationPending] = useState(false);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentType: "" as any,
      amount: "",
      boletoDue: "",
      orderId,
    },
  });

  const watchType = form.watch("paymentType");

  const getTipoIcon = (type: PaymentType) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case PaymentType.CARD_CREDIT:
        return <CreditCard className={iconClass} />;
      case PaymentType.PIX:
      case PaymentType.PIX_CNPJ:
        return <QrCode className={iconClass} />;
      case PaymentType.BOLETO:
        return <Barcode className={iconClass} />;
      case PaymentType.MONEY:
        return <DollarSign className={iconClass} />;
      case PaymentType.PATNERSHIP:
        return <Handshake className={iconClass} />;
    }
  };

  const getTipoLabel = (payment: Payment) => {
    switch (payment.type) {
      case PaymentType.CARD_CREDIT:
        return `Cartão${payment.isSiteSale ? " (Site)" : ""}`;
      case PaymentType.PIX:
        return `PIX${payment.isSiteSale ? " (Site)" : ""}`;
      case PaymentType.PIX_CNPJ:
        return (
          <span className="flex items-center gap-1">
            PIX (CNPJ){" "}
            <span className="rounded-lg bg-secondary text-xs px-2 py-0.5 font-medium">
              {payment.text}
            </span>
          </span>
        );
      case PaymentType.BOLETO:
        return `Boleto${payment.isSiteSale ? " (Site)" : ""}`;
      case PaymentType.MONEY:
        return `Dinheiro${payment.isSiteSale ? " (Site)" : ""}`;
      case PaymentType.PATNERSHIP:
        return "Parceria";
    }
  };

  const getStatusStyle = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.ACTIVE:
      case PaymentStatus.PROCESSING:
        return "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-300";
      case PaymentStatus.PAID:
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-300";
      case PaymentStatus.CANCELLED:
        return "bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-300";
      // case "refunded":
      //   return "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-300";
      default:
        return "bg-stone-100 text-stone-700 hover:bg-stone-100 border-stone-300";
    }
  };

  const getStatusTitle = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.ACTIVE:
        return "PENDENTE";
      case PaymentStatus.PAID:
        return "PAGO";
      case PaymentStatus.CANCELLED:
        return "CANCELADO";
      // case PaymentStatus.REFUNDED:
      //   return "ESTORNADO";
      case PaymentStatus.PROCESSING:
        return "PROCESSANDO";
      default:
        return "";
    }
  };

  const handleCreatePayment = async (data: PaymentFormData) => {
    if (data.paymentType === PaymentType.BOLETO && !data.boletoDue)
      return toast.error("Especifique uma data de vencimento para boleto");
    if (data.boletoDue)
      data.boletoDue = addDays(
        new Date(),
        parseInt(data.boletoDue || ""),
      ).toISOString();
    setIsCreationPending(true);
    try {
      const { message } = await axios
        .post(`/api/payments`, data)
        .then((res) => res.data);
      toast.success(message);
      setIsDialogOpen(false);
      form.reset();
    } catch (e: any) {
      console.error("Erro ao criar pagamento", e);
      toast.error(e.response?.data?.error || "Erro ao criar pagamento");
    } finally {
      revalidatePath(`/pedidos/${orderId}`);
      setIsCreationPending(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", {
      locale: ptBR,
    });
  };

  const valorTotal = useMemo(
    () =>
      payments.reduce((acc, pagamento) => {
        if (pagamento.status === PaymentStatus.CANCELLED) return acc;
        const valor = PaymentUtils.getPaymentValue(pagamento);
        return acc + valor;
      }, 0),
    [payments],
  );

  const onAddPayment = () => {
    if (payments.some((p) => p.status === PaymentStatus.ACTIVE))
      toast.warning("Já existe um pagamento ativo");
    else setIsDialogOpen(true);
  };

  const closeDialog = () => {
    form.reset();
    setIsDialogOpen(false);
  };

  return (
    <Card className="overflow-hidden px-6 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Pagamentos</CardTitle>
      </CardHeader>

      <div className="flex px-6 py-2 mb-2 items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">
            Valor do Pedido
          </p>
          <p className="text-3xl font-bold tracking-tight">
            {formatCurrency(valorTotal.toString())}
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(v) => (v ? onAddPayment() : closeDialog())}
        >
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-lg items-center size-8">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-106.25">
            <DialogHeader>
              <DialogTitle>Novo Pagamento</DialogTitle>
              <DialogDescription>
                Adicione um novo método de pagamento ao pedido
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleCreatePayment)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="paymentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger id="paymentType" className="w-full">
                            <SelectValue placeholder="Selecione a forma de pagamento" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          <SelectItem value={PaymentType.BOLETO}>
                            Boleto
                          </SelectItem>
                          <SelectItem value={PaymentType.CARD_CREDIT}>
                            Cartão de Crédito
                          </SelectItem>
                          <SelectItem value={PaymentType.PIX}>Pix</SelectItem>
                          <SelectItem value={PaymentType.PIX_CNPJ}>
                            Pix (CNPJ)
                          </SelectItem>
                          <SelectItem value={PaymentType.MONEY}>
                            Dinheiro
                          </SelectItem>
                          <SelectItem value={PaymentType.PATNERSHIP}>
                            Parceria
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="R$ 0.00"
                          value={field.value ? "R$ " + field.value : ""}
                          onChange={(e) => {
                            const input = convertCurrencyInput(e.target.value);
                            field.onChange(input);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchType === PaymentType.BOLETO && (
                  <FormField
                    control={form.control}
                    name="boletoDue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vencimento do Boleto</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isCreationPending}
                    className="w-full"
                  >
                    {isCreationPending
                      ? "Criando Pagamento..."
                      : "Criar Pagamento"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <CardContent className="p-0">
        <div className="px-6 text-xs uppercase tracking-wider font-bold text-muted-foreground">
          Histórico
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum pagamento cadastrado</p>
            <p className="text-sm mt-1">Clique no + para adicionar</p>
          </div>
        ) : (
          <div className="divide-y">
            {payments.map((payment) => {
              const paymentValue = PaymentUtils.getPaymentValue(payment);
              return (
                <div
                  key={payment.id}
                  className="px-6 py-4 hover:bg-background/20 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-2">
                          <div className="rounded-md">
                            {getTipoIcon(payment.type)}
                          </div>
                          <span className="font-medium text-sm">
                            {getTipoLabel(payment)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(String(payment.createdAt))}
                        </div>

                        {payment.boletoDueAt && (
                          <div>
                            Vence:{" "}
                            {format(
                              new Date(payment.boletoDueAt),
                              "dd/MM/yyyy",
                              {
                                locale: ptBR,
                              },
                            )}
                          </div>
                        )}

                        {payment.paidAt && (
                          <div className="flex items-center gap-1">
                            |
                            <DollarSign className="h-3.5 w-3.5" />
                            {formatDate(String(payment.paidAt))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      <div
                        className={`rounded-md px-3 ${getStatusStyle(
                          payment.status,
                        )} font-semibold border text-[0.6rem]`}
                      >
                        {getStatusTitle(payment.status)}
                      </div>
                      <span
                        className={cn(
                          "font-semibold text-sm",
                          payment.refundAmount &&
                            "text-muted-foreground line-through",
                        )}
                      >
                        {formatCurrency(Number(payment.amount))}
                      </span>
                      {payment.refundAmount && paymentValue > 0 && (
                        <span className="font-semibold text-sm">
                          {formatCurrency(paymentValue)}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <PaymentsSectionActionButtons payment={payment} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
