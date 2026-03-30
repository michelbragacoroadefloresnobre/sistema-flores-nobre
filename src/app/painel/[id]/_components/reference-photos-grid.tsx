/* eslint-disable @next/next/no-img-element */
"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import type { ReferencePhoto } from "./image-section";

export function ReferencePhotosGrid({
  referencePhotos,
}: {
  referencePhotos: ReferencePhoto[];
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (referencePhotos.length === 0) return null;

  return (
    <div className="p-6 border rounded-xl bg-card shadow-sm">
      <h3 className="text-center font-bold text-lg mb-4">
        Fotos de Referência
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {referencePhotos.map((photo, index) => (
          <Dialog key={index}>
            <DialogTrigger asChild>
              <button
                onClick={() => setSelectedIndex(index)}
                className="group relative aspect-square rounded-xl overflow-hidden border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/70 to-transparent p-2 pt-6">
                  <p className="text-white text-xs font-medium truncate">
                    {photo.name}
                  </p>
                </div>
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white/10">
                  MODELO
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg p-2 sm:p-4">
              <DialogTitle className="sr-only">
                {referencePhotos[selectedIndex]?.name || "Foto de referência"}
              </DialogTitle>
              <div className="flex flex-col gap-2">
                <img
                  src={referencePhotos[selectedIndex]?.imageUrl}
                  alt={referencePhotos[selectedIndex]?.name || "Referência"}
                  className="w-full rounded-lg object-contain max-h-[70vh]"
                />
                <p className="text-center text-sm font-medium text-muted-foreground">
                  {referencePhotos[selectedIndex]?.name}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
}
