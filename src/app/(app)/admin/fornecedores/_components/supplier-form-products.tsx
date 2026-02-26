import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductSize } from "@/generated/prisma/enums";
import { convertCurrencyInput } from "@/lib/utils";
import { PRODUCT_SIZE_MAP } from "@/modules/products/constants";
import { SupplierFormData } from "@/modules/suppliers/dtos/supplier-form.dto";
import { ChevronDown, ChevronRight, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { ProductSelectionModal } from "./supplier-form-products-dialog";

interface ProductsFormProps {
  form: UseFormReturn<SupplierFormData>;
}

export const SupplierFormProducts = ({ form }: ProductsFormProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const products =
    form.watch("products").sort((a, b) => a.name.localeCompare(b.name)) || [];

  const [expandedProducts, setExpandedProducts] = useState(new Set());

  const toggleExpand = (productId) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleRemoveProduct = (productId: string) => {
    const updatedProducts = products.filter(
      (prod: any) => prod.id !== productId,
    );
    form.setValue("products", updatedProducts);
  };

  const handleUpdatePrice = (
    productId: string,
    size: ProductSize,
    amount: string,
  ) => {
    const updatedProducts = products.map((prod) =>
      prod.id === productId
        ? {
            ...prod,
            sizeOptions: prod.sizeOptions.map((so) =>
              so.size === size
                ? {
                    ...so,
                    amount: amount,
                  }
                : so,
            ),
          }
        : prod,
    );
    form.setValue("products", updatedProducts);
  };

  const error = form.getFieldState("products").error?.message;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsModalOpen(true)}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Selecionar produtos
        </Button>
        {products.length > 0 && (
          <Badge variant="secondary">
            Produtos selecionados: {products.length}
          </Badge>
        )}
      </div>

      {error && <div className="text-destructive text-sm">{error}</div>}

      {products.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground w-8"></th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Produto / Tamanho
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Valor (R$)
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>

              {products.map((product) => {
                const isExpanded = expandedProducts.has(product.id);

                return (
                  <tbody
                    key={product.id}
                    className="divide-y divide-border border-b border-border last:border-0"
                  >
                    <tr
                      className="bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleExpand(product.id)}
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-foreground">
                        {product.name}
                      </td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveProduct(product.id);
                          }}
                          title="Remover todos os tamanhos deste produto"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>

                    {isExpanded &&
                      product.sizeOptions.map((option) => (
                        <tr
                          key={option.size}
                          className="hover:bg-muted/50 transition-colors bg-background"
                        >
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3 text-sm font-medium pl-8 text-muted-foreground">
                            ↳ {PRODUCT_SIZE_MAP[option.size]}
                          </td>
                          <td className="px-4 py-3" colSpan={2}>
                            <Input
                              type="text"
                              placeholder="R$ 0,00"
                              value={option.amount ? "R$ " + option.amount : ""}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const input = convertCurrencyInput(
                                  e.target.value,
                                );
                                handleUpdatePrice(
                                  product.id,
                                  option.size,
                                  input || "",
                                );
                              }}
                              className="w-32"
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                );
              })}
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhum produto selecionado</p>
        </div>
      )}

      <ProductSelectionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        selectedProducts={products}
        onApply={(selected) => {
          form.setValue("products", selected);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};
