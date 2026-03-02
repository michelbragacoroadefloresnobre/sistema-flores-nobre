"use client";

import { SupplierPanelPhotoStatus } from "@/generated/prisma/enums";
import { ProductImageItem } from "./product-image-item";

export interface ProductItem {
  spPhotoId: string;
  referenceUrl: string;
  imageUrl?: string | null;
  status: SupplierPanelPhotoStatus;
  rejectionReason?: string | null;
  name?: string;
}

interface ImageSectionProps {
  supplierPanelId: string;
  products: ProductItem[];
}

export function ImageSection({ supplierPanelId, products }: ImageSectionProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Nenhum produto encontrado para este painel.
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 flex flex-col gap-12">
      {products.map((product) => (
        <ProductImageItem
          key={product.spPhotoId}
          product={product}
          supplierPanelId={supplierPanelId}
        />
      ))}
    </div>
  );
}
