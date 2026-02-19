/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { WeekDay } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { SupplierFormData } from "@/modules/suppliers/dtos/supplier-form.dto";
import { ArrowRight, Clock, Moon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

export const checkIfCloseNextDay = (open?: string, close?: string) => {
  if (!open || !close) return false;
  return close <= open;
};

interface weekHoursFormProps {
  form: UseFormReturn<SupplierFormData>;
}

export const SupplierFormHours = ({ form }: weekHoursFormProps) => {
  const weekHours = form.watch("weekHours") || {};

  const weekDayName = {
    [WeekDay.MONDAY]: "Segunda Feira",
    [WeekDay.TUESDAY]: "Terça Feira",
    [WeekDay.WEDNESDAY]: "Quarta Feira",
    [WeekDay.THURSDAY]: "Quinta Feira",
    [WeekDay.FRIDAY]: "Sexta Feira",
    [WeekDay.SATURDAY]: "Sabado",
    [WeekDay.SUNDAY]: "Domingo",
  };

  const handleToggleDay = (
    day: keyof SupplierFormData["weekHours"],
    isOpen: boolean,
  ) => {
    const current = weekHours[day];
    form.setValue(`weekHours.${day}`, {
      isOpen,
      openTime: isOpen ? current?.openTime || "08:00" : "",
      closeTime: isOpen ? current?.closeTime || "18:00" : "",
    });
  };

  const handleUpdateTime = (
    day: keyof SupplierFormData["weekHours"],
    field: "openTime" | "closeTime",
    newValue: string,
  ) => {
    const current = weekHours[day];
    form.setValue(`weekHours.${day}`, {
      ...current,
      [field]: newValue,
    });
  };

  const handleApplyToAll = () => {
    const firstDay = weekHours[WeekDay.MONDAY];
    if (!firstDay) return;

    const updated = Object.entries(WeekDay).reduce((acc, [_, day]) => {
      acc[day] = {
        isOpen: firstDay.isOpen,
        openTime: firstDay.openTime,
        closeTime: firstDay.closeTime,
      };
      return acc;
    }, {} as any);

    form.setValue("weekHours", updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleApplyToAll}
          className="text-xs"
        >
          <Clock className="mr-2 h-3.5 w-3.5" />
          Replicar horário de Segunda para todos
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-30">
                  Dia
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">
                  Atende?
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Abertura
                </th>
                <th className="px-4 w-20"></th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-full">
                  Fechamento
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(WeekDay).map(([_, day]) => {
                const schedule = weekHours[day] || {};
                const isOpen = schedule.isOpen;
                const isNextDay = checkIfCloseNextDay(
                  schedule.openTime,
                  schedule.closeTime,
                );

                return (
                  <tr
                    key={day}
                    className={cn(
                      "transition-colors",
                      isOpen ? "bg-card" : "bg-muted/5",
                    )}
                  >
                    <td className="px-4 py-4 font-medium text-foreground">
                      {weekDayName[day]}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <Switch
                          checked={isOpen}
                          onCheckedChange={(checked) =>
                            handleToggleDay(day, checked)
                          }
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {isOpen ? (
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Input Abertura */}
                          <div className="relative">
                            <Input
                              type="time"
                              value={schedule.openTime || ""}
                              onChange={(e) =>
                                handleUpdateTime(
                                  day,
                                  "openTime",
                                  e.target.value,
                                )
                              }
                              className="w-32 font-mono"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm italic pl-2">
                          Fechado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                    </td>
                    <td className="px-4 py-4">
                      {isOpen ? (
                        <div className="relative flex items-center gap-2">
                          <Input
                            type="time"
                            value={schedule.closeTime || ""}
                            onChange={(e) =>
                              handleUpdateTime(day, "closeTime", e.target.value)
                            }
                            className={cn(
                              "w-32 font-mono transition-all",
                              isNextDay &&
                                "border-indigo-300 ring-indigo-100 dark:border-indigo-800",
                            )}
                          />

                          {isNextDay && (
                            <div className="flex items-center gap-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md text-xs font-medium animate-in fade-in slide-in-from-left-2 duration-300">
                              <Moon className="h-3 w-3" />
                              <span>Dia seguinte</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm italic pl-2">
                          Fechado
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
