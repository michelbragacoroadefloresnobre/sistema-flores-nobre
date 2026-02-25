import { ProductSize } from "@/generated/prisma/enums";

export const productSizeName = {
  [ProductSize.SMALL]: "Padrão",
  [ProductSize.MEDIUM]: "Médio",
  [ProductSize.LARGE]: "Grande",
};
