import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StarRating } from "@/components/ui/star-rating";
import { Product } from "@/generated/prisma/client";
import { productSizeName } from "@/modules/products/product.mapper";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

interface ProductSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: any[];
  onApply: (products: any[]) => void;
}

export const ProductSelectionModal = ({
  open,
  onOpenChange,
  selectedProducts,
  onApply,
}: ProductSelectionModalProps) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedProducts.map((p) => p.id)),
  );
  const [selectAll, setSelectAll] = useState(false);

  const [defaultRating, setDefaultRating] = useState<number>(0);

  const productsQuery = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      return (await axios.get("/api/products")).data.data;
    },
  });

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(new Set(selectedProducts.map((prod) => prod.id)));
      setDefaultRating(0);
      setSearch("");
    }
  }, [open, selectedProducts]);

  const filteredProducts =
    productsQuery.data
      ?.filter((prod) => prod.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)) || [];

  const handleToggle = (productId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(productId)) newSelected.delete(productId);
    else newSelected.add(productId);
    setSelected(newSelected);
    setSelectAll(newSelected.size === (productsQuery.data?.length ?? 0));
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(productsQuery.data?.map((p) => p.id)));
      setSelectAll(true);
    }
  };

  const handleApply = () => {
    const newProducts = productsQuery.data
      ?.filter((prod) => selected.has(prod.id))
      .map((prod) => {
        const existing = selectedProducts.find((s) => s.id === prod.id);
        return existing
          ? {
              ...existing,
              rating: existing.rating ? existing.rating : defaultRating,
            }
          : {
              id: prod.id,
              name: prod.name,
              size: prod.size,
              amount: "",
              rating: defaultRating || undefined,
            };
      });
    onApply(newProducts || []);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle>Selecionar Produtos</DialogTitle>
          <DialogDescription>
            Escolha os produtos que o fornecedor oferece
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex justify-between items-center space-x-3 pb-2 border-b">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer"
              >
                Selecionar todos os produtos
              </label>
            </div>
            <StarRating
              value={defaultRating}
              onValueChange={setDefaultRating}
            />
          </div>

          <ScrollArea className="h-87.5 rounded-md border p-4">
            <div className="space-y-2">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum produto encontrado
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center space-x-3 rounded hover:bg-muted/50 transition-colors p-2"
                  >
                    <Checkbox
                      id={product.id}
                      checked={selected.has(product.id)}
                      onCheckedChange={() => handleToggle(product.id)}
                    />
                    <label
                      htmlFor={product.id}
                      className="text-sm font-medium leading-none cursor-pointer flex-1 p-1"
                    >
                      <div className="flex items-center justify-between">
                        <span>
                          {product.name} ({productSizeName[product.size]})
                        </span>
                      </div>
                    </label>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="text-sm text-muted-foreground">
            {selected.size}{" "}
            {selected.size === 1
              ? "produto selecionado"
              : "produtos selecionados"}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>Aplicar seleção</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
