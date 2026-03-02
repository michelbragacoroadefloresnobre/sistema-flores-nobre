"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MultiSelect,
  MultiSelectBadge,
  MultiSelectContent,
  MultiSelectInput,
  MultiSelectItem,
  MultiSelectList,
  MultiSelectTrigger,
} from "@/components/ui/multi-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductVariant } from "@/generated/prisma/browser";
import { ProductColor, ProductSize } from "@/generated/prisma/enums";
import { cn, convertCurrencyInput } from "@/lib/utils";
import {
  PRODUCT_COLOR_MAP,
  PRODUCT_COLORS,
  PRODUCT_SIZE_MAP,
  PRODUCT_SIZES,
} from "@/modules/products/constants";
import { ProductFormData } from "@/modules/products/dto/create-product.dto";
import axios from "axios";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import {
  useCartesianMatrix,
  VariationRow,
} from "../hooks/use-cartesian-matrix";

export interface VariantPayload {
  size: ProductSize;
  color: ProductColor;
  price: string;
  siteId: string; 
  imageUrl?: string;
}

type VariantOverride = { imageUrl?: string; price?: string, siteId?: string };

interface ProductVariantsProps {
  data?: ProductVariant[];
  form: UseFormReturn<ProductFormData>;
  onChange: (variations: VariantPayload[]) => void;
}

export function ProductVariants({
  data,
  form,
  onChange,
}: ProductVariantsProps) {
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [variationOverrides, setVariationOverrides] = useState<
    Record<string, VariantOverride>
  >({});
  const [uploadingRows, setUploadingRows] = useState<Set<string>>(new Set());

  const generatedRows = useCartesianMatrix(sizes, colors);

  useEffect(() => {
    // Se quiser expor isso para o pai, adicione uma prop onLoadingChange
    // onLoadingChange?.(uploadingRows.size > 0);
  }, [uploadingRows]);

  useEffect(() => {
    if (data) {
      const initialSizes = new Set<ProductSize>();
      const initialColors = new Set<ProductColor>();
      const initialOverrides: Record<string, VariantOverride> = {};

      data.forEach((v) => {
        if (v.size && v.size !== ProductSize.UNIQUE) initialSizes.add(v.size);
        if (v.color && v.color !== ProductColor.DEFAULT)
          initialColors.add(v.color);

        const id = `${v.size}::${v.color}`;
        initialOverrides[id] = {
          price: Number(v.price) ? Number(v.price).toFixed(2) : "",
          imageUrl: v.imageUrl || "",
          siteId: v.siteId || "",
        };
      });

      setSizes(Array.from(initialSizes));
      setColors(Array.from(initialColors));
      setVariationOverrides(initialOverrides);
    }
  }, [data]);

  const getRow = useCallback(
    (row: VariationRow) => ({
      ...row,
      ...variationOverrides[row.id],
    }),
    [variationOverrides],
  );

  useEffect(() => {
    const variations = generatedRows.map((row) => {
      const merged = getRow(row);
      return merged;
    });

    onChange(variations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedRows, variationOverrides, getRow]);

  const updateOverride = (id: string, patch: VariantOverride) => {
    setVariationOverrides((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const handleImageUpload = async (id: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploadingRows((prev) => new Set(prev).add(id));

      try {
        const { uploadUrl, publicUrl } = await axios
          .post("/api/upload-url", {
            fileName: file.name,
            contentType: file.type,
            path: "/produtos",
          })
          .then((res) => res.data);

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadRes.ok) throw new Error("Falha no upload para o S3");

        updateOverride(id, { imageUrl: publicUrl });
      } catch (err: any) {
        console.error("Upload failed:", err);
        toast.error(err.response?.data.error || "Erro ao subir imagem.");
      } finally {
        setUploadingRows((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    };
    input.click();
  };

  const errors = form.formState.errors.variations;

  return (
    <div className="space-y-10">
      <section
        className="space-y-5 rounded-xl border bg-card p-6 shadow-sm animate-fade-in"
        style={{ animationDelay: "100ms" }}
      >
        <h2 className="text-lg font-semibold font-display text-foreground">
          Variações
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-body">Tamanhos</Label>
            <MultiSelect
              options={PRODUCT_SIZES.slice(1)}
              value={sizes}
              onValueChange={(v) => setSizes(v as any)}
              filterBy={(size) => size.label}
            >
              <MultiSelectTrigger>
                {sizes.map((id) => {
                  const size = PRODUCT_SIZES.find((s) => s.id === id);
                  if (!size) return null;
                  return (
                    <MultiSelectBadge key={id} value={id}>
                      {PRODUCT_SIZE_MAP[id]}
                    </MultiSelectBadge>
                  );
                })}
                <MultiSelectInput
                  placeholder={sizes.length === 0 ? "Selecione..." : ""}
                />
              </MultiSelectTrigger>

              <MultiSelectContent>
                <MultiSelectList emptyMessage="Nenhum tamanho encontrado.">
                  {(size: any) => (
                    <MultiSelectItem key={size.id} value={size.id}>
                      {size.label}
                    </MultiSelectItem>
                  )}
                </MultiSelectList>
              </MultiSelectContent>
            </MultiSelect>
          </div>

          <div className="space-y-2">
            <Label className="font-body">Cores</Label>
            <MultiSelect
              options={PRODUCT_COLORS.slice(1)}
              value={colors}
              onValueChange={(v) => setColors(v as any)}
            >
              <MultiSelectTrigger>
                {colors.map((id) => {
                  return (
                    <MultiSelectBadge key={id} value={id}>
                      {PRODUCT_COLOR_MAP[id]}
                    </MultiSelectBadge>
                  );
                })}
                <MultiSelectInput
                  placeholder={colors.length === 0 ? "Selecione..." : ""}
                />
              </MultiSelectTrigger>

              <MultiSelectContent>
                <MultiSelectList emptyMessage="Nenhuma cor encontrada.">
                  {(color: any) => (
                    <MultiSelectItem key={color.id} value={color.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border border-black/20"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.label}
                      </div>
                    </MultiSelectItem>
                  )}
                </MultiSelectList>
              </MultiSelectContent>
            </MultiSelect>
          </div>
        </div>
      </section>

      <section
        className={cn(
          "space-y-5 rounded-xl border bg-card p-6 shadow-sm animate-fade-in",
        )}
        style={{ animationDelay: "200ms" }}
      >
        <div
          className={cn(
            "flex items-center justify-between",
            errors?.length && "text-destructive",
          )}
        >
          <h2 className="text-lg font-semibold font-display">
            Matriz de Variações
          </h2>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium">
            {generatedRows.length} SKU
            {generatedRows.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div
          className={cn(
            "overflow-x-auto rounded-lg border",
            errors?.length && "border-destructive",
          )}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className={cn("font-body font-semibold min-w-45")}>
                  Variação
                </TableHead>
                <TableHead className="font-body font-semibold w-35">
                  Id do Site
                </TableHead>
                <TableHead className="font-body font-semibold w-35">
                  Preço (R$)
                </TableHead>
                <TableHead
                  className={cn(
                    "font-body font-semibold w-20 text-center",
                    errors?.length && "text-destructive",
                  )}
                >
                  Imagem
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generatedRows.map((row) => {
                const merged = getRow(row);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-body font-medium text-foreground">
                      {row.label}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        placeholder="00000"
                        value={merged.siteId ? merged.siteId : ""}
                        onChange={(e) => {
                          updateOverride(row.id, { siteId: e.target.value });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="text"
                        placeholder="R$ 0.00"
                        value={merged.price ? "R$ " + merged.price : ""}
                        onChange={(e) => {
                          const input = convertCurrencyInput(e.target.value);
                          updateOverride(row.id, { price: input || "" });
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {uploadingRows.has(row.id) ? (
                        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-md border bg-muted/20">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      ) : merged.imageUrl ? (
                        <button
                          type="button"
                          disabled={uploadingRows.size > 0}
                          onClick={() => handleImageUpload(row.id)}
                          className="relative mx-auto h-9 w-9 overflow-hidden rounded-md border group"
                        >
                          <Image
                            src={merged.imageUrl}
                            width={200}
                            height={200}
                            alt={row.label}
                            className="h-full w-full object-cover transition-opacity group-hover:opacity-50"
                          />
                          <Camera className="absolute inset-0 m-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={uploadingRows.size > 0}
                          onClick={() => handleImageUpload(row.id)}
                          className={cn(
                            "mx-auto flex h-9 w-9 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed",
                            errors?.length &&
                              "border-destructive text-destructive",
                          )}
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
