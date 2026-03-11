"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Prisma } from "@/generated/prisma/browser";
import Image from "next/image";
import { getVariantLabel } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

interface OrderSummaryProps {
  // productName: string;
  // image: string;
  products: Prisma.OrderProductGetPayload<{
    include: { variant: { include: { product: true } } };
  }>[];
  value: string;
}

export const OrderSummary = ({
  // productName,
  // image,
  products,
  value,
}: OrderSummaryProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };
  // const startsWith = productName
  //   .trim()
  //   .toLowerCase()
  //   .startsWith("coroa de flores");

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
        <div className="flex flex-col gap-4">
          {products ? (
            products.map((product) => (
              <div key={product.id} className="flex gap-3">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                  <Image
                    src={product.variant.imageUrl}
                    alt={`${product.variant.product.name} - ${getVariantLabel({ size: product.variant.size, color: product.variant.color })}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between py-2">
                  <p className="font-medium text-foreground">Flores Nobre</p>
                  <p>{`${product.variant.product.name} - ${getVariantLabel({ size: product.variant.size, color: product.variant.color })}`}</p>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
              <p className="text-lg font-semibold text-[#34c759]">
                {formatCurrency(Number(value))}
              </p>
            </>
          )}
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
