"use client";

import { cn } from "@/lib/utils";
import { Edit2 } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

interface OrderInfoRowProps {
  icon: ReactNode;
  label: string;
  value: string;
  bgClass?: string;
  isSaving?: boolean;
  onSave?: (newValue: string | number) => void;
  onChange?: (v: string) => void;
}

export const OrderInfoRow = ({
  icon,
  label,
  value,
  bgClass = "bg-muted",
  isSaving = false,
  onSave,
  onChange,
}: OrderInfoRowProps) => {
  const isEditable = !!onSave;

  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState<string>(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (onSave && inputValue !== undefined) {
      onSave(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(value ?? "");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onChange) onChange(val);
    else setInputValue(val);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border border-border/40",
        bgClass,
      )}
    >
      {icon}
      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>

        <div
          className={cn(
            "h-7 flex items-center group",
            isEditable && !isEditing && !isSaving && "cursor-pointer",
          )}
          onClick={() =>
            isEditable && !isEditing && !isSaving && setIsEditing(true)
          }
        >
          {isEditable && isEditing ? (
            <input
              ref={inputRef}
              disabled={isSaving}
              type={"text"}
              className="w-full bg-transparent border-none outline-none p-0 m-0 text-lg text-foreground font-medium leading-tight [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground/50 truncate"
              value={inputValue}
              onChange={handleChange}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <div
              className={cn(
                "text-lg w-full text-foreground font-medium transition-opacity leading-tight truncate",
                isEditable &&
                  "group-hover:opacity-70 decoration-dotted underline decoration-muted-foreground/30 underline-offset-4",
                isSaving && "opacity-70 animate-pulse cursor-wait ",
              )}
              title={isEditable ? "Clique para editar" : undefined}
            >
              {value}
            </div>
          )}
          {isEditable && <Edit2 className="size-3" />}
        </div>
      </div>
    </div>
  );
};
