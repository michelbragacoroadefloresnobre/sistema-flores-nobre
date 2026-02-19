"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { convertCurrencyInput, formatZipCodeInput } from "@/lib/utils";
import { SupplierFormData } from "@/modules/suppliers/dtos/supplier-form.dto";
import { X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { SupplierFormRegionsCoverageArea } from "./supplier-form-regions-coverage-area";

interface RegionsFormProps {
  form: UseFormReturn<SupplierFormData>;
}

export const SupplierFormRegions = ({ form }: RegionsFormProps) => {
  const regions = form
    .watch("regions")
    .sort((a, b) => Number(a.zipCodeStart) - Number(b.zipCodeStart));

  const handleRemoveLocation = (regionIndex: number) => {
    const updatedRegions = regions.filter(
      (loc, index) => index !== regionIndex,
    );
    form.setValue("regions", updatedRegions);
  };

  const handleUpdateFreight = (regionIndex: number, freight: string) => {
    const updatedLocations = regions.map((loc, index) =>
      index === regionIndex ? { ...loc, freight } : loc,
    );
    form.setValue("regions", updatedLocations);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-end">
          <SupplierFormRegionsCoverageArea />
        </div>
      </div>

      {regions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-sm">
              {regions.length}{" "}
              {regions.length === 1 ? "faixa associada" : "faixas associadas"}
            </Badge>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Faixa
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Frete (R$)
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {regions.map((region, index) => (
                    <tr
                      key={index}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm">{region.name}</td>
                      <td className="px-4 py-3 text-sm">{`${formatZipCodeInput(region.zipCodeStart)} -> ${formatZipCodeInput(region.zipCodeEnd)}`}</td>
                      <td className="px-4 py-3">
                        <Input
                          type="text"
                          placeholder="R$ 0.00"
                          value={region.freight ? "R$ " + region.freight : ""}
                          onChange={(e) => {
                            const input = convertCurrencyInput(e.target.value);
                            handleUpdateFreight(index, input!);
                          }}
                          className="w-32"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLocation(index)}
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
        </div>
      )}

      {regions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma região cadastrada
        </div>
      )}
    </div>
  );
};
