import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupplierFormData } from "@/modules/suppliers/dtos/supplier-form.dto";
import {
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  ShoppingCart,
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface SummarySidebarProps {
  form: UseFormReturn<SupplierFormData>;
}

export const SupplierFormSummary = ({ form }: SummarySidebarProps) => {
  const groupId = form.watch("groupId");
  const regions = form.watch("regions") || [];
  const products = form.watch("products") || [];

  const stats = [
    {
      icon: Building2,
      label: "Grupo",
      value: groupId ? "Selecionado" : "Não selecionado",
      count: groupId ? 1 : 0,
      isComplete: !!groupId,
    },
    {
      icon: MapPin,
      label: "Região",
      value:
        regions.length > 0
          ? `${regions.length} locais selecionados`
          : "Não definida",
      count: regions.length,
      isComplete: regions.length > 0,
    },
    {
      icon: ShoppingCart,
      label: "Produtos",
      value: products.length > 0 ? `${products.length} selecionados` : "Nenhum",
      count: products.length,
      isComplete: products.length > 0,
    },
  ];

  return (
    <div className="sticky top-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Resumo do Cadastro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    stat.isComplete ? "bg-success/10" : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      stat.isComplete ? "text-success" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {stat.label}
                    </p>
                    {stat.isComplete && (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">
                {stats.filter((s) => s.isComplete).length}/{stats.length}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (stats.filter((s) => s.isComplete).length / stats.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
