"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { Prisma } from "@/generated/prisma/browser";
import { revalidatePath } from "@/lib/revalidate-sc";
import {
  ProductFormData,
  productFormSchema,
} from "@/modules/products/dto/create-product.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Flower2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ProductDetails } from "../../_components/product-details";
import { ProductVariants } from "../../_components/product-variants";

export const ProductForm = ({
  product,
}: {
  product: Prisma.ProductGetPayload<{
    include: {
      productVariants: true;
    };
  }>;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product.name || "",
      basePrice: Number(product.basePrice).toFixed(2) || "",
      variations: product.productVariants.map((pv) => ({
        size: pv.size || ("" as any),
        color: pv.color || ("" as any),
        imageUrl: pv.imageUrl || "",
        siteId: pv.siteId || "",
        price: Number(pv.price) ? Number(pv.price).toFixed(2) : "",
      })),
    },
  });

  const router = useRouter();

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const { message } = await axios
        .put(`/api/products/${product.id}`, data)
        .then((res) => res.data);
      toast.success(message);
      revalidatePath("/admin/produtos");
      router.push("/admin/produtos");
    } catch (e: any) {
      toast.error(e.response.data.error || "Produto salvo com sucesso!E Pr");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Flower2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight font-display text-foreground">
                    {"Editar Produto"}
                  </h1>
                  <p className="text-sm text-muted-foreground font-body">
                    {"Cadastre um novo arranjo para floricultura"}
                  </p>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 font-body"
              >
                {!isSubmitting ? (
                  <>
                    <Save className="h-4 w-4" />
                    {"Salvar Produto"}
                  </>
                ) : (
                  <>
                    <Spinner className="h-4 w-4" />
                    {"Salvando Produto..."}
                  </>
                )}
              </Button>
            </div>

            <ProductDetails form={form} />

            <ProductVariants
              form={form}
              data={product.productVariants}
              onChange={(variations) => {
                console.log({ variations });
                form.setValue(
                  "variations",
                  variations.map((v) => ({
                    color: v.color,
                    size: v.size,
                    imageUrl: v.imageUrl as any,
                    siteId: v.siteId,
                    price: v.price,
                  })),
                );
              }}
            />
          </form>
        </Form>
      </div>
    </div>
  );
};
