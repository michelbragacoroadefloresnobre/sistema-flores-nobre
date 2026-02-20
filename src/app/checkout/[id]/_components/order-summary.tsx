"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";

interface OrderSummaryProps {
  productName: string;
  image: string;
  value: string;
}

export const OrderSummary = ({
  productName,
  image,
  value,
}: OrderSummaryProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const startsWith = productName
    .trim()
    .toLowerCase()
    .startsWith("coroa de flores");

  return (
    <Card className="p-6 space-y-4 bg-card">
      <div className="flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-[#34c759]" />
        <h3 className="text-lg font-semibold text-foreground">
          Resumo do Pedido
        </h3>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
            {image ? (
              <Image
                src={image}
                alt={productName}
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between">
            {startsWith ? (
              <>
                <p className="font-medium text-foreground">Coroa de Flores</p>
                <p>{productName.replace(/Coroa de Flores/i, "").trim()}</p>
                <p className="text-lg font-semibold text-[#34c759]">
                  {formatCurrency(Number(value))}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-foreground">{productName}</p>
                <p className="text-lg font-semibold text-[#34c759]">
                  {formatCurrency(Number(value))}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-foreground">Total</span>
        <span className="text-xl font-bold text-[#34c759]">
          {formatCurrency(Number(value))}
        </span>
      </div>
    </Card>
  );
};
