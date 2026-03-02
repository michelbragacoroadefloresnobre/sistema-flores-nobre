"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  CreditCard,
  Package,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { Role, User } from "@/generated/prisma/browser";
import axios from "axios";
import CompletedFilters, {
  CompletedFilterOptions,
} from "./_components/completed-filters";
import CompletedTable, { CompletedOrderItem } from "./_components/completed-table";
import { buildFilters, getDatePeriodMessage } from "./utils";

interface SupplierOption {
  id: string;
  name: string;
}

export default function CompletedOrdersPage() {
  const [filterOptions, setFilterOptions] = useState<CompletedFilterOptions>({
    createdAtStart: DateTime.now().startOf("day").toISO(),
    createdAtEnd: "",
    idOrder: "",
    canceledOrders: "",
    paidStatus: "",
    paidAtStart: "",
    paidAtEnd: "",
    supplierPaymentStatus: "",
    contact: "",
    contactType: "",
    contactOrigin: "",
    taxId: "",
    sellers: [],
    suppliers: [],
    product: "",
    coverageAreaStart: "",
    coverageAreaEnd: "",
  });

  const queryKey = ["orders", "completed", filterOptions];

  const { data: orders, isPending } = useQuery<CompletedOrderItem[]>({
    queryKey,
    queryFn: () =>
      axios
        .get("/api/tables/completed-orders", {
          params: buildFilters(filterOptions),
        })
        .then((r) => r.data.data),
  });

  const { data: sellers } = useQuery<User[]>({
    queryKey: ["sellers"],
    queryFn: () =>
      axios
        .get("/api/users", {
          params: { role: [Role.SELLER, Role.SUPERVISOR] },
        })
        .then((res) => res.data.data),
  });

  const { data: suppliers } = useQuery<SupplierOption[]>({
    queryKey: ["suppliers"],
    queryFn: () =>
      axios.get("/api/suppliers").then((res) => res.data.data),
  });

  const metrics = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        total: 0,
        totalVendas: 0,
        totalCusto: 0,
        ticketMedio: 0,
        lucroMedio: 0,
        repasse: 0,
      };
    }

    const total = orders.length;

    const totalVendas = orders.reduce(
      (acc, order) => acc + (Number(order.amount) || 0),
      0,
    );

    const totalCusto = orders.reduce(
      (acc, order) => acc + (Number(order.cost) || 0),
      0,
    );

    const ticketMedio = total > 0 ? totalVendas / total : 0;

    const profit = totalVendas - totalCusto;
    const uniqueWorkDays = new Set(
      orders
        .map((order) => {
          const date = DateTime.fromISO(order.createdAt);
          if (date.hour < 9 || date.hour > 17) return null;
          return date.toISODate();
        })
        .filter((date) => date !== null),
    );
    const lucroMedio =
      uniqueWorkDays.size > 0 ? profit / uniqueWorkDays.size : 0;

    const repasse = totalVendas > 0 ? (totalCusto / totalVendas) * 100 : 0;

    return { total, totalVendas, totalCusto, ticketMedio, lucroMedio, repasse };
  }, [orders]);

  const datePeriodMessage = getDatePeriodMessage(
    filterOptions.createdAtStart,
    filterOptions.createdAtEnd,
  );

  if (isPending) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-8 max-w-400 mx-auto">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-border pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Pedidos Finalizados
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {datePeriodMessage || "Visualizando todos os registros"}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <CompletedFilters
              sellers={sellers || []}
              suppliers={suppliers || []}
              onApplyFilter={setFilterOptions}
              initialFilters={filterOptions}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card text-card-foreground p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pedidos
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {metrics.total.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground">
                <Package className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card text-card-foreground p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Vendas
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 mt-1">
                  R${" "}
                  {metrics.totalVendas.toLocaleString("pt-BR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Banknote className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card text-card-foreground p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Custo
                </p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-500 mt-1">
                  R${" "}
                  {metrics.totalCusto.toLocaleString("pt-BR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card text-card-foreground p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ticket Médio
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  R${" "}
                  {metrics.ticketMedio.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card text-card-foreground p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Lucro Médio
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  R${" "}
                  {metrics.lucroMedio.toLocaleString("pt-BR", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card text-card-foreground p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Repasse
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <p className="text-2xl font-bold text-foreground">
                    {metrics.repasse.toLocaleString("pt-BR", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </p>
                  <span className="text-sm font-semibold text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
              <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Percent className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        <CompletedTable orders={orders || []} queryKey={queryKey}/>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-8 max-w-400 mx-auto">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>

        <CompletedTable.Skeleton rows={10} />
      </div>
    </div>
  );
}