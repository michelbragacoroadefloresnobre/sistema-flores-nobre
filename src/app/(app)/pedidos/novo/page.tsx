"use client";

import { QueryFormType } from "@/app/api/forms/query-form.dto.";
import { cn } from "@/lib/utils";
import { FileText, Plus, Search } from "lucide-react";
import { useState } from "react";
import { CreateOrderForm } from "./_components/create-order-form";
import { SearchOrderForm } from "./_components/search-form";

type TabType = "criar" | "consultar";

export default function QueryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("criar");
  const [page, setPage] = useState<"create_order_page" | "query_page">(
    "query_page",
  );
  const [formData, setFormData] = useState<{ data: QueryFormType; phone }>();

  if (page === "create_order_page") {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CreateOrderForm phone={formData?.phone} serverData={formData?.data} />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background font-sans text-foreground">
      <div className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center gap-4">
            <div className="inline-flex gap-1 rounded-lg bg-muted p-1 shadow-inner">
              <TabButton
                active={activeTab === "criar"}
                onClick={() => setActiveTab("criar")}
                icon={<Plus className="h-4 w-4" />}
              >
                Criar Novo
              </TabButton>
              <TabButton
                active={activeTab === "consultar"}
                onClick={() => setActiveTab("consultar")}
                icon={<Search className="h-4 w-4" />}
              >
                Consultar
              </TabButton>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {activeTab === "criar" ? "Iniciar Pedido" : "Consultar Base"}
            </h2>
          </div>

          <div className="relative">
            <div
              className={cn(
                "transition-all duration-300 ease-in-out",
                activeTab === "criar"
                  ? "relative z-10 translate-y-0 opacity-100"
                  : "absolute inset-0 -z-10 -translate-y-4 opacity-0 pointer-events-none",
              )}
            >
              <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                <div className="p-8">
                  <div className="mb-8 flex items-center gap-4 border-b border-border pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm">
                      <Plus className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        Iniciar Pedido
                      </h2>
                      <p className="text-muted-foreground">
                        Verifique o cliente para começar
                      </p>
                    </div>
                  </div>

                  {/* {!formData?.active && ( */}
                  <SearchOrderForm
                    onSuccess={(data, phone) => {
                      setPage("create_order_page");
                      setFormData({ data, phone });
                    }}
                  />
                  {/* )} */}
                </div>
              </div>
            </div>

            <div
              className={cn(
                "transition-all duration-300 ease-in-out",
                activeTab === "consultar"
                  ? "relative z-10 translate-y-0 opacity-100"
                  : "absolute inset-0 -z-10 -translate-y-4 opacity-0 pointer-events-none",
              )}
            >
              <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
                <div className="p-8">
                  <div className="mb-8 flex items-center gap-4 border-b border-border pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground shadow-sm">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        Consultar Base
                      </h2>
                      <p className="text-muted-foreground">
                        Faça consultas em nossa base de dados
                      </p>
                    </div>
                  </div>

                  <div className="text-center font-medium text-sm">
                    Em Breve
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-background text-foreground shadow-sm ring-1 ring-border"
          : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "transition-transform duration-200",
          active && "scale-105",
        )}
      >
        {icon}
      </span>
      {children}
    </button>
  );
}
