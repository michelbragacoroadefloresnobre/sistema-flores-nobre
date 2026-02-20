"use client";

import { Prisma } from "@/generated/prisma/browser";
import { revalidatePath } from "@/lib/revalidate-sc";
import axios, { AxiosError } from "axios";
import { useState } from "react";
import { toast } from "sonner";
import { validateCardNumber, validateCVV, validateExpiryDate } from "../utils";
import { CheckoutForm, CheckoutFormData } from "./checkout-form";
import { CheckoutFailure } from "./error-page";
import { OrderSummary } from "./order-summary";

interface Props {
  payment: Prisma.PaymentGetPayload<{
    include: {
      order: { include: { product: true } };
    };
  }>;
}

export function CheckoutPage({ payment }: Props) {
  const [error, setError] = useState<boolean>(false);
  const [lastDigits, setLastDigits] = useState("");

  if (error)
    return (
      <CheckoutFailure
        setError={setError}
        value={Number(payment.amount).toFixed(2)}
        lastCardDigits={lastDigits}
      />
    );

  const handleSubmit = async (
    data: CheckoutFormData,
    setIsProcessing: (v: boolean) => any,
  ) => {
    if (!validateCardNumber(data.cardNumber)) {
      toast.error("Número do cartão inválido");
      return;
    }

    if (!data.cardName.trim()) {
      toast.error("Nome do titular é obrigatório");
      return;
    }

    if (!validateExpiryDate(data.expiryDate)) {
      toast.error("Data de validade inválida");
      return;
    }

    if (!validateCVV(data.cvv, data.brand)) {
      toast.error("CVV inválido");
      return;
    }

    if (!data.installments) {
      toast.error("Selecione o numero de parcelas");
      return;
    }

    setIsProcessing(true);

    try {
      const { message } = await axios
        .post(`/api/payments/${payment.id}/auth-capture`, data)
        .then((res) => res.data);
      toast.success(message);
    } catch (e: any) {
      console.error("Erro ao fazer pagamento:", e);
      if (
        e instanceof AxiosError &&
        e.response?.status &&
        e.response.status >= 400 &&
        e.response.status <= 500
      ) {
        const error = e.response.data.error;
        if (error) toast.error(error);
        setLastDigits(data.cardNumber.slice(-4));
        setError(true);
        return;
      } else toast.error("Algo deu errado. Fale com o suporte.");
    } finally {
      revalidatePath(`/checkout/${payment.id}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="sticky top-8">
          <OrderSummary
            productName={payment.order.product.name}
            image={payment.order.product.imageUrl}
            value={Number(payment.amount).toFixed(2)}
          />
        </div>
      </div>

      <div className="lg:col-span-2">
        <CheckoutForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
