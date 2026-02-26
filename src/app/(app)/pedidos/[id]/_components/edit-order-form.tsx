"use client";

import { Card } from "@/components/ui/card";
import {
  EditOrderData,
  EditOrderFormSection,
} from "@/modules/orders/dtos/edit-order.dto";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { EditOrderFormHeader } from "./edit-order-form-header";
import { EditOrderFormSectionContact } from "./edit-order-form-section-customer";
import { EditOrderFormSectionDetails } from "./edit-order-form-section-details";
import { EditOrderFormSectionOrder } from "./edit-order-form-section-order";

interface Props {
  form: UseFormReturn<EditOrderData>;
}

export const EditOrderForm = ({ form }: Props) => {
  const [currentSection, setCurrentSection] =
    useState<EditOrderFormSection>("Detalhes");

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="py-6 px-2">
        <EditOrderFormHeader
          disabledClick={false}
          currentSection={currentSection}
          onSectionChange={(section) => setCurrentSection(section)}
        />
        {currentSection === "Detalhes" && (
          <EditOrderFormSectionDetails
            form={form as any}
            onNext={() => setCurrentSection("Pedido")}
          />
        )}
        {currentSection === "Pedido" && (
          <EditOrderFormSectionOrder
            form={form as any}
            onBack={() => setCurrentSection("Detalhes")}
            onNext={() => setCurrentSection("Contato")}
          />
        )}

        {currentSection === "Contato" && (
          <EditOrderFormSectionContact
            form={form as any}
            onBack={() => setCurrentSection("Pedido")}
          />
        )}
      </Card>
    </div>
  );
};
