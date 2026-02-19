"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, TrendingUp, UserCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { FormStatus, Role, User } from "@/generated/prisma/browser";
import { FormTableItem } from "@/modules/form/form.dto";
import axios from "axios";
import { DateTime } from "luxon";
import FormFilters, { FormFilterOptions } from "./_components/form-filters";
import FormTable from "./_components/form-table";
import { buildFilters, getDatePeriodMessage } from "./utils";

export default function FormsPage() {
  const [filterOptions, setFilterOptions] = useState<FormFilterOptions>({
    isCustomer: "" as any,
    createdAtStart: DateTime.now().startOf("day").toISO(),
    createdAtEnd: "",
    status: "" as any,
    name: "",
    email: "",
    phone: "",
    sellers: [],
  });

  const queryKey = ["forms", filterOptions];

  const { data: filteredForms, isPending } = useQuery<FormTableItem[]>({
    queryKey,
    queryFn: () =>
      axios
        .get("/api/tables/forms", { params: buildFilters(filterOptions) })
        .then((r) => r.data.data),
  });

  const metrics = useMemo(() => {
    if (!filteredForms) return { total: 0, converted: 0, conversionTax: 0 };

    const total = filteredForms.length;
    const converted = filteredForms.filter(
      (f) => f.status === FormStatus.CONVERTED,
    ).length;
    const conversionTax = total > 0 ? (converted / total) * 100 : 0;

    return { total, converted, conversionTax };
  }, [filteredForms]);

  const datePeriodMessage = getDatePeriodMessage(
    filterOptions.createdAtStart,
    filterOptions.createdAtEnd,
  );

  const { data: sellers } = useQuery<User[]>({
    queryKey: ["sellers"],
    queryFn: () =>
      axios
        .get("/api/users", {
          params: { role: [Role.SELLER, Role.SUPERVISOR] },
        })
        .then((res) => res.data.data),
  });

  if (isPending) return <FormsPageSkeleton />;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="space-y-8 max-w-400 mx-auto">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-border pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Formulários Recebidos do Site
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {datePeriodMessage || "Visualizando todos os registros"}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <FormFilters
              sellers={sellers || []}
              onApplyFilter={setFilterOptions}
              initialFilters={filterOptions}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Formulários
                </p>
                <p className="text-3xl font-bold text-foreground mt-2 tracking-tight">
                  {metrics.total.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Convertidos
                </p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-500 mt-2 tracking-tight">
                  {metrics.converted.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Taxa de Conversão
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-500 tracking-tight">
                    {metrics.conversionTax.toFixed(1)}%
                  </p>
                  <span className="inline-flex items-center text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    performance
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 dark:bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(metrics.conversionTax, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <FormTable
          forms={filteredForms || []}
          sellerNames={
            new Map(
              sellers
                ?.filter((s) => s.helenaId)
                .map((s) => [s.helenaId!, s.name]) || [],
            )
          }
        />
      </div>
    </div>
  );
}

function FormsPageSkeleton() {
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
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>

        {/* <FormTable.Skeleton rows={10} /> */}
      </div>
    </div>
  );
}
