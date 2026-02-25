import { ProductColor, ProductSize } from "@/generated/prisma/enums";
import z from "zod";

export const productVariationSchema = z.object({
  size: z.enum(ProductSize),
  color: z.enum(ProductColor),
  price: z.string(),
  imageUrl: z.url(),
});

export const productFormSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório"),
  basePrice: z.string().min(1, "Preço base é obrigatório"),
  variations: z.array(productVariationSchema),
});

export type ProductVariantFormData = z.infer<typeof productVariationSchema>;
export type ProductFormData = z.infer<typeof productFormSchema>;
