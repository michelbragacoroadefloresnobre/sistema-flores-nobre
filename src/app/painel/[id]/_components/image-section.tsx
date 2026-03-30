"use client";

import { SupplierPanelPhotoStatus } from "@/generated/prisma/enums";
import { ProductImageItem } from "./product-image-item";
import { ReferencePhotosGrid } from "./reference-photos-grid";

export interface ReferencePhoto {
  name: string;
  imageUrl: string;
}

export interface PhotoItem {
  spPhotoId: string;
  imageUrl?: string | null;
  status: SupplierPanelPhotoStatus;
  rejectionReason?: string | null;
}

interface ImageSectionProps {
  supplierPanelId: string;
  referencePhotos: ReferencePhoto[];
  photo?: PhotoItem;
}

export function ImageSection({
  supplierPanelId,
  referencePhotos,
  photo,
}: ImageSectionProps) {
  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 flex flex-col gap-12">
      {referencePhotos.length > 0 && (
        <ReferencePhotosGrid referencePhotos={referencePhotos} />
      )}

      {photo && (
        <ProductImageItem
          photo={photo}
          supplierPanelId={supplierPanelId}
        />
      )}
    </div>
  );
}
