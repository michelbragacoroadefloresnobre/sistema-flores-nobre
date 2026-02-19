import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarRating } from "@/components/ui/star-rating";
import { convertCurrencyInput } from "@/lib/utils";
import { productSizeName } from "@/modules/products/product.mapper";
import { SupplierFormData } from "@/modules/suppliers/dtos/supplier-form.dto";
import { ShoppingCart, X } from "lucide-react";
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

  const handleRemoveProduct = (productId: string) => {
    const updatedProducts = products.filter(
      (prod: any) => prod.id !== productId,
    );
    form.setValue("products", updatedProducts);
  };

  const handleUpdatePrice = (productId: string, amount: string) => {
    const updatedProducts = products.map((prod: any) =>
      prod.id === productId ? { ...prod, amount } : prod,
    );
    form.setValue("products", updatedProducts);
  };

  const handleUpdateRating = (productId: string, rating: number) => {
    const updatedProducts = products.map((prod: any) =>
      prod.id === productId ? { ...prod, rating } : prod,
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Produto
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Valor (R$)
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Avaliação
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium">
                      {product.name} ({productSizeName[product.size]})
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="text"
                        placeholder="R$ 0.00"
                        value={product.amount ? "R$ " + product.amount : ""}
                        onChange={(e) => {
                          const input = convertCurrencyInput(e.target.value);
                          handleUpdatePrice(product.id, input || "");
                        }}
                        className="w-32"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StarRating
                        value={product.rating}
                        onValueChange={(v) => handleUpdateRating(product.id, v)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProduct(product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
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
