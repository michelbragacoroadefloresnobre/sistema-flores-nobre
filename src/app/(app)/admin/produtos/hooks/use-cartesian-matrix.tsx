import { ProductColor, ProductSize } from "@/generated/prisma/enums";
import { getVariantLabel } from "@/lib/utils";
import { useMemo } from "react";

export interface VariationRow {
  id: string;
  size: ProductSize;
  color: ProductColor;
  price: string;
  label: string;
  siteId: string;
  imageUrl?: string;
}

export function useCartesianMatrix(
  sizes: ProductSize[],
  colors: ProductColor[],
): VariationRow[] {
  return useMemo(() => {
    const effectiveSizes = sizes.length > 0 ? sizes : [ProductSize.UNIQUE];
    const effectiveColors = colors.length > 0 ? colors : [ProductColor.DEFAULT];

    const rows: VariationRow[] = [];
    for (const size of effectiveSizes) {
      for (const color of effectiveColors) {
        const label = getVariantLabel({ color, size });

        rows.push({
          id: `${size}::${color}`,
          size,
          color,
          label,
          price: "",
          siteId: "",
          imageUrl: "",
        });
      }
    }
    return rows;
  }, [sizes, colors]);
}
