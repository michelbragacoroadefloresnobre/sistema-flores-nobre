import { cn } from "@/lib/utils";
import { EditOrderFormSection } from "@/modules/orders/dtos/edit-order.dto";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useEffect } from "react";

interface FormHeaderProps {
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
  const currentIndex = sections.indexOf(currentSection);

  useEffect(() => {
    queryClient.invalidateQueries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full px-8 pt-4 pb-2">
      <div className="flex items-center justify-between">
        {sections.map((section, index) => {
          const isActive = currentSection === section;
          const isCompleted = index < currentIndex;

          return (
            <div key={section} className="flex items-center flex-1 last:flex-0">
              {/* Step item */}
              <button
                type="button"
                disabled={disabledClick}
                onClick={() => onSectionChange(section)}
                className={cn(
                  "flex items-center gap-3 group transition-all duration-200",
                  !disabledClick && "cursor-pointer",
                )}
              >
                {/* Circle indicator */}
                <div
                  className={cn(
                    "relative flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold transition-all duration-300 shrink-0",
                    isActive &&
                      "bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-4 ring-primary/10",
                    isCompleted && "bg-primary/10 text-primary",
                    !isActive &&
                      !isCompleted &&
                      "bg-muted text-muted-foreground group-hover:bg-muted/80",
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-sm font-medium transition-colors duration-200 whitespace-nowrap",
                    isActive && "text-foreground",
                    isCompleted && "text-primary",
                    !isActive &&
                      !isCompleted &&
                      "text-muted-foreground group-hover:text-foreground/70",
                  )}
                >
                  {section}
                </span>
              </button>

              {/* Connector line */}
              {index < sections.length - 1 && (
                <div className="flex-1 mx-4 h-0.5 rounded-full overflow-hidden bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out",
                      index < currentIndex
                        ? "w-full bg-primary/40"
                        : "w-0 bg-primary/40",
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
