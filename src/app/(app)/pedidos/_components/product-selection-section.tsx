import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Prisma,
  Product,
  ProductColor,
  ProductSize,
  ProductVariant,
} from "@/generated/prisma/browser";
import { formatBRL, getVariantLabel } from "@/lib/utils";
import {
  PRODUCT_COLOR_MAP,
  PRODUCT_SIZE_MAP,
} from "@/modules/products/constants";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";

export interface ProductItem {
  productId: string;
  variantId: string;
  productName: string;
  label: string;
  unitPrice: number;
  quantity: number;
}

type Props = {
  value: ProductItem[];
  onChange: (values: ProductItem[]) => void;
};

export function ProductSelectionSection({ value, onChange }: Props) {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data, error, isPending } = useQuery<
    Prisma.ProductGetPayload<{ include: { productVariants: true } }>[]
  >({
    queryKey: ["products-selection"],
    queryFn: async () =>
      axios.get("/api/products").then((res) => res.data.data),
  });

  console.log({ data });

  const toggleProduct = (productId: string) => {
    setExpandedProduct((prev) => (prev === productId ? null : productId));
    setSelectedSize(null);
    setSelectedColor(null);
  };

  const addItem = (product: Product, variant: ProductVariant) => {
    const existing = value.find((i) => i.variantId === variant.id);
    if (existing) {
      return onChange(
        value.map((i) =>
          i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    }
    onChange([
      ...value,
      {
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        label: getVariantLabel({ color: variant.color, size: variant.size }),
        unitPrice: Number(variant.price) || Number(product.basePrice),
        quantity: 1,
      },
    ]);
  };

  return (
    <div className="sticky top-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 font-body"
        />
      </div>

      <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
        {isPending &&
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="w-full px-6 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
              </div>
            </Card>
          ))}

        {error && (
          <div className="flex flex-col items-center justify-center py-8 text-destructive space-y-2 font-body text-center">
            <AlertCircle className="h-8 w-8 opacity-80" />
            <p className="text-sm font-medium">Erro ao carregar os produtos.</p>
            <p className="text-xs opacity-80">Tente novamente mais tarde.</p>
          </div>
        )}

        {!isPending && !error && data?.length === 0 && (
          <p className="text-sm text-muted-foreground font-body py-8 text-center">
            Nenhum produto encontrado.
          </p>
        )}

        {!isPending &&
          !error &&
          data?.map((product) => {
            console.log({ product });
            const isExpanded = expandedProduct === product.id;
            const activeVariants = product.productVariants;
            return (
              <Card
                key={product.id}
                className="overflow-hidden transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => toggleProduct(product.id)}
                  className="w-full text-left px-6 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium font-body text-foreground truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      A partir de {formatBRL(Number(product.basePrice))} ·{" "}
                      {activeVariants.length} variante
                      {activeVariants.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <CardContent className="pt-0 pb-4 px-4">
                    <Separator className="mb-3" />
                    <p className="text-xs text-muted-foreground font-body mb-3">
                      {"Variantes"}
                    </p>
                    {(() => {
                      const activeVariantsForChips = product.productVariants;
                      const sizes = [
                        ...new Set(activeVariantsForChips.map((v) => v.size)),
                      ] as ProductSize[];
                      const colors = [
                        ...new Set(activeVariantsForChips.map((v) => v.color)),
                      ] as ProductColor[];
                      const matchedVariant =
                        selectedSize && selectedColor
                          ? activeVariantsForChips.find(
                              (v) =>
                                v.size === selectedSize &&
                                v.color === selectedColor,
                            )
                          : null;

                      const handleSizeClick = (size: string) => {
                        setSelectedSize(size);
                        if (
                          selectedColor &&
                          !activeVariantsForChips.find(
                            (v) => v.size === size && v.color === selectedColor,
                          )
                        ) {
                          setSelectedColor(null);
                        }
                      };

                      return (
                        <div className="space-y-3">
                          {sizes.length > 0 && (
                            <div>
                              <p className="text-xs font-medium font-body text-muted-foreground mb-1.5">
                                Tamanho
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {sizes.map((size) => (
                                  <Button
                                    key={size}
                                    type="button"
                                    size="sm"
                                    variant={
                                      selectedSize === size
                                        ? "default"
                                        : "outline"
                                    }
                                    className="text-xs font-body h-8"
                                    onClick={() => handleSizeClick(size)}
                                  >
                                    {PRODUCT_SIZE_MAP[size]}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                          {colors.length > 0 && (
                            <div>
                              <p className="text-xs font-medium font-body text-muted-foreground mb-1.5">
                                Cor
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {colors.map((color) => (
                                  <Button
                                    key={color}
                                    type="button"
                                    size="sm"
                                    variant={
                                      selectedColor === color
                                        ? "default"
                                        : "outline"
                                    }
                                    className="text-xs font-body h-8"
                                    onClick={() => setSelectedColor(color)}
                                  >
                                    {PRODUCT_COLOR_MAP[color]}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            className="gap-1.5 font-body text-xs w-full mt-2"
                            disabled={!matchedVariant}
                            onClick={() => {
                              if (matchedVariant)
                                addItem(product, matchedVariant);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                            Adicionar
                          </Button>
                        </div>
                      );
                    })()}
                  </CardContent>
                )}
              </Card>
            );
          })}
      </div>
    </div>
  );
}
