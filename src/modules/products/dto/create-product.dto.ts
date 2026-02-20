import { ProductSize } from "@/generated/prisma/enums";
import z from "zod";

export const productFormSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  amount: z.string().min(1, "Especifique um valor"),
  size: z.enum(ProductSize, { message: "Selecione um tamanho." }),
  width: z.string().regex(/^\d+$/, { error: "A largura é obrigatória." }),
  height: z.string().regex(/^\d+$/, { error: "A altura é obrigatória." }),
  imageUrl: z.url(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
