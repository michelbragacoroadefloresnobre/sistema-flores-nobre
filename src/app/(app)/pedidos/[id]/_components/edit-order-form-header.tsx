import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  EditOrderData,
  EditOrderFormSection,
} from "@/modules/orders/dtos/edit-order.dto";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";

interface FormHeaderProps {
  form: UseFormReturn<EditOrderData>;
  currentSection: EditOrderFormSection;
  disabledClick?: boolean;
  onSectionChange: (section: EditOrderFormSection) => void;
}

export function EditOrderFormHeader({
  currentSection,
  disabledClick = false,
  onSectionChange,
}: FormHeaderProps) {
  const sections: EditOrderFormSection[] = ["Detalhes", "Pedido", "Contato"];

  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.invalidateQueries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 relative">
        <div className="flex justify-center items-center">
          <div className="w-fit m-auto flex space-x-8 mt-1.5">
            {sections.map((section, index) => (
              <button
                disabled={disabledClick}
                key={section}
                type="button"
                onClick={() => onSectionChange(section)}
                className={cn(
                  "relative pb-2 px-1 text-sm font-medium transition-colors",
                  "text-muted-foreground hover:text-foreground",
                  currentSection === section &&
                    "text-primary border-b-2 border-primary",
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`
                  flex h-6 w-6 items-center justify-center rounded-full text-xs
                  ${
                    currentSection === section
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }
                `}
                  >
                    {index + 1}
                  </span>
                  {section}
                </span>
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
