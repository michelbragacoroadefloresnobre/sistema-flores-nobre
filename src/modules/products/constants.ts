import { ProductColor, ProductSize } from "@/generated/prisma/enums";

export const PRODUCT_SIZES = [
  { id: ProductSize.UNIQUE, label: "Tamanho Único" },
  { id: ProductSize.SMALL, label: "Pequeno" },
  { id: ProductSize.MEDIUM, label: "Médio" },
  { id: ProductSize.LARGE, label: "Grande" },
];

export const PRODUCT_COLORS = [
  { id: ProductColor.DEFAULT, label: "Padrão" },
  { id: ProductColor.YELLOW, label: "Amarelo" },
  { id: ProductColor.BLUE, label: "Azul" },
  { id: ProductColor.WHITE, label: "Branco" },
  { id: ProductColor.CHAMPAGNE, label: "Champanhe" },
  { id: ProductColor.MULTICOLOR, label: "Multicolorido" },
  { id: ProductColor.ORANGE, label: "Laranja" },
  { id: ProductColor.LILAC, label: "Lilás" },
  { id: ProductColor.PINK, label: "Rosa" },
  { id: ProductColor.ROSE, label: "Rosé" },
  { id: ProductColor.PURPLE, label: "Roxo" },
  { id: ProductColor.RED, label: "Vermelho" },
];

export const PRODUCT_SIZE_MAP = Object.fromEntries(
  PRODUCT_SIZES.map((item) => [item.id, item.label]),
) as Record<ProductSize, string>;

export const PRODUCT_COLOR_MAP = Object.fromEntries(
  PRODUCT_COLORS.map((item) => [item.id, item.label]),
) as Record<ProductColor, string>;
