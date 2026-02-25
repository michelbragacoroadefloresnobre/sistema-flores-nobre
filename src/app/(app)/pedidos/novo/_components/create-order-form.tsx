"use client";

import { Card } from "@/components/ui/card";
import {
  CreateOrderData,
  CreateOrderFormSection,
} from "@/modules/orders/dtos/create-order.dto";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateOrderFormHeader } from "./create-order-form-header";
import { CreateOrderFormSectionCustomer } from "./create-order-form-section-customer";
import { CreateOrderFormSectionDetails } from "./create-order-form-section-details";
import { CreateOrderFormSectionOrder } from "./create-order-form-section-order";

interface Props {
  form: UseFormReturn<CreateOrderData>;
}

export const CreateOrderForm = ({ form }: Props) => {
  const [currentSection, setCurrentSection] =
    useState<CreateOrderFormSection>("Detalhes");

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="py-6 px-2">
        <CreateOrderFormHeader
          form={form as any}
          disabledClick={false}
          currentSection={currentSection}
          onSectionChange={(section) => setCurrentSection(section)}
        />
        {currentSection === "Detalhes" && (
          <CreateOrderFormSectionDetails
            form={form as any}
            onNext={() => setCurrentSection("Pedido")}
          />
        )}
        {currentSection === "Pedido" && (
          <CreateOrderFormSectionOrder
            form={form as any}
            onBack={() => setCurrentSection("Detalhes")}
            onNext={() => setCurrentSection("Contato")}
          />
        )}

        {currentSection === "Contato" && (
          <CreateOrderFormSectionCustomer
            form={form as any}
            onBack={() => setCurrentSection("Pedido")}
          />
        )}
      </Card>
    </div>
  );
};
