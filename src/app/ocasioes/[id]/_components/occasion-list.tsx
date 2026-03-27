"use client";

import { Button } from "@/components/ui/button";
import { OccasionType } from "@/generated/prisma/enums";
import { parseISO, format } from "date-fns";
import { Bell, CalendarHeart, Gift, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { OccasionDeleteButton } from "./occasion-delete-button";
import { OccasionForm } from "./occasion-form";

const occasionTypeLabels: Record<string, string> = {
  BIRTHDAY: "Aniversário",
  WEDDING_ANNIVERSARY: "Bodas",
  MOTHERS_DAY: "Dia das Mães",
  FATHERS_DAY: "Dia dos Pais",
  VALENTINES_DAY: "Dia dos Namorados",
  GRADUATION: "Formatura",
  MEMORIAL: "In Memoriam",
  OTHER: "Outro",
};

export type OccasionItem = {
  id: string;
  type: string;
  customName: string | null;
  personName: string;
  date: string;
  advanceDays: number;
};

export function OccasionList({
  initialOccasions,
  customerPanelId,
}: {
  initialOccasions: OccasionItem[];
  customerPanelId: string;
}) {
  const [occasions, setOccasions] = useState<OccasionItem[]>(initialOccasions);
  const [editingOccasion, setEditingOccasion] = useState<OccasionItem | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreated = (occasion: OccasionItem) => {
    setOccasions((prev) => [...prev, occasion].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  const handleUpdated = (updated: OccasionItem) => {
    setOccasions((prev) =>
      prev.map((o) => (o.id === updated.id ? updated : o)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    );
  };

  const handleDeleted = (id: string) => {
    setOccasions((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
            <CalendarHeart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
          </div>
          <h2 className="text-xl font-semibold">Minhas Ocasiões</h2>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 size-4" />
          Adicionar
        </Button>
      </div>

      {occasions.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="mx-auto size-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-lg mb-1">
            Nenhuma ocasião cadastrada
          </p>
          <p className="text-muted-foreground text-sm">
            Cadastre datas especiais para receber lembretes com cupons
            exclusivos!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {occasions.map((occasion) => {
            const typeLabel =
              occasion.type === "OTHER" && occasion.customName
                ? occasion.customName
                : occasionTypeLabels[occasion.type] || occasion.type;

            return (
              <div
                key={occasion.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary">
                    <span className="text-lg font-bold leading-none">
                      {format(parseISO(occasion.date.split("T")[0]), "dd")}
                    </span>
                    <span className="text-[10px] uppercase font-medium">
                      {format(parseISO(occasion.date.split("T")[0]), "MMM")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {typeLabel}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {occasion.personName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Bell className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {occasion.advanceDays} dias antes
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingOccasion(occasion)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <OccasionDeleteButton
                    occasionId={occasion.id}
                    onDeleted={() => handleDeleted(occasion.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OccasionForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        customerPanelId={customerPanelId}
        onSuccess={handleCreated}
      />

      <OccasionForm
        open={!!editingOccasion}
        onOpenChange={(open) => !open && setEditingOccasion(null)}
        customerPanelId={customerPanelId}
        occasion={editingOccasion ?? undefined}
        onSuccess={handleUpdated}
      />
    </div>
  );
}
