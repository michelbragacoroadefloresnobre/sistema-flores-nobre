import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatBRL } from "@/lib/utils";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo } from "react";

import { ProductItem } from "./product-selection-section";

type Props = {
  value: ProductItem[];
  onChange: (values: ProductItem[]) => void;
  hasSupplier?: boolean;
  hidePricing?: boolean;
};

export function OrderSummarySection({
  value,
  onChange,
  hasSupplier = false,
  hidePricing = false,
}: Props) {
  const { subtotal, itemCount } = useMemo(() => {
    const subtotal = value.reduce(
      (sum, item) => sum + (item.unitPrice || 0) * item.quantity,
      0,
    );
    const itemCount = value.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, itemCount };
  }, [value]);

  const updateQuantity = (variantId: string, delta: number) => {
    onChange(
      value
        .map((i) =>
          i.variantId === variantId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const removeItem = (variantId: string) => {
    onChange(value.filter((i) => i.variantId !== variantId));
  };

  const updatePrice = (variantId: string, newPrice: number) => {
    onChange(
      value.map((i) =>
        i.variantId === variantId ? { ...i, unitPrice: newPrice } : i,
      ),
    );
  };

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold font-display text-foreground flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" />
          Resumo do Pedido
        </h2>
        {itemCount > 0 && (
          <Badge variant="secondary" className="font-body">
            {itemCount} {itemCount === 1 ? "item" : "itens"}
          </Badge>
        )}
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body py-6 text-center">
          Nenhum item adicionado. Use a busca ao lado para selecionar produtos.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-body font-semibold">
                    Item
                  </TableHead>

                  {!hidePricing && (
                    <TableHead className="font-body font-semibold w-25 text-right">
                      Preço
                    </TableHead>
                  )}

                  <TableHead className="font-body font-semibold w-30 text-center">
                    Qtd
                  </TableHead>

                  {!hidePricing && (
                    <TableHead className="font-body font-semibold w-25 text-right">
                      Subtotal
                    </TableHead>
                  )}

                  <TableHead className={cn("w-12")} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {value.map((item) => (
                  <TableRow key={item.variantId}>
                    <TableCell className="font-body">
                      <p className="font-medium text-foreground text-sm">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.productName}
                      </p>
                    </TableCell>

                    {!hidePricing && (
                      <TableCell className="text-right font-body text-sm p-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updatePrice(
                              item.variantId,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="h-8 w-25 text-right font-body text-sm border-transparent hover:border-input focus:border-input ml-auto"
                        />
                      </TableCell>
                    )}

                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={hasSupplier}
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.variantId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-body font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={hasSupplier}
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.variantId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>

                    {!hidePricing && (
                      <TableCell className="text-right font-body text-sm font-medium">
                        {formatBRL(item.unitPrice * item.quantity)}
                      </TableCell>
                    )}

                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={hasSupplier}
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.variantId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!hidePricing && (
            <div className="flex items-center justify-end gap-4 pt-2">
              <span className="text-sm text-muted-foreground font-body">
                Total:
              </span>
              <span className="text-xl font-semibold font-display text-foreground">
                {formatBRL(subtotal)}
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}
