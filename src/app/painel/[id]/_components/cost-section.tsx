"use client";

import { SupplierPanel } from "@/generated/prisma/browser";
import { authClient } from "@/lib/auth/client";
import { revalidatePath } from "@/lib/revalidate-sc";
import { convertCurrencyInput } from "@/lib/utils";
import axios from "axios";
import { DollarSign } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { OrderInfoRow } from "./order-info-row";

export function CostSection({
  supplierPanel,
}: {
  supplierPanel: SupplierPanel;
}) {
  const [freightAmount, setFreightValue] = useState<string>(
    supplierPanel.freight ? Number(supplierPanel.freight).toFixed(2) : "",
  );
  const [isPendingFreight, setIsPendingFreight] = useState(false);

  const [costAmount, setCostValue] = useState<string>(
    supplierPanel.cost ? Number(supplierPanel.cost).toFixed(2) : "",
  );
  const [isPendingCost, setIsPendingCost] = useState(false);

  const onSaveCost = async () => {
    if (Number(costAmount) === Number(supplierPanel.cost)) return;
    setIsPendingCost(true);
    try {
      const { message } = await axios
        .patch(`/api/supplier-panel/${supplierPanel.id}`, {
          freight: freightAmount,
          cost: costAmount,
        })
        .then((res) => res.data);
      toast.success(message);
    } catch (e: any) {
      setCostValue((Number(supplierPanel.cost) || 0).toFixed(2));
      setFreightValue((Number(supplierPanel.freight) || 0).toFixed(2));
      toast.error("Erro ao salvar valor:", e.response?.data || e);
    } finally {
      revalidatePath(`/painel/${supplierPanel.id}`);
      setIsPendingCost(false);
    }
  };

  const onSaveFreight = async () => {
    if (Number(freightAmount) === Number(supplierPanel.freight)) return;
    setIsPendingFreight(true);
    try {
      const { message } = await axios
        .patch(`/api/supplier-panel/${supplierPanel.id}`, {
          freight: freightAmount,
          cost: costAmount,
        })
        .then((res) => res.data);
      toast.success(message);
    } catch (e: any) {
      setFreightValue((Number(supplierPanel.freight) || 0).toFixed(2));
      toast.error("Erro ao salvar valor:", e.response?.data || e);
    } finally {
      revalidatePath(`/painel/${supplierPanel.id}`);
      setIsPendingFreight(false);
    }
  };

  const { data: auth } = authClient.useSession();

  return (
    <div className="grid grid-cols-2 gap-4">
      <OrderInfoRow
        icon={
          <DollarSign className="w-5 h-5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        }
        isSaving={isPendingFreight}
        label="Frete"
        onSave={auth?.session ? onSaveFreight : undefined}
        value={`R$ ${(Number(freightAmount) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
        onChange={(v) => {
          const input = convertCurrencyInput(v);
          setFreightValue(input || "");
        }}
        bgClass="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50"
      />
      <OrderInfoRow
        icon={
          <DollarSign className="w-5 h-5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
        }
        isSaving={isPendingCost}
        label="Custo"
        value={`R$ ${(Number(costAmount) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
        onChange={(v) => {
          const input = convertCurrencyInput(v);
          setCostValue(input || "");
        }}
        onSave={auth?.session ? onSaveCost : undefined}
        bgClass="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50"
      />
    </div>
  );
}
