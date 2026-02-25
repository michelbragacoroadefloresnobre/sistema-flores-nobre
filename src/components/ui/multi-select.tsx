/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface MultiSelectContextValue {
  value: string[];
  onValueChange: (value: string[]) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  filteredOptions: any[];
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  activeValue: string | null;
  getValue: (item: any) => string;
}

const MultiSelectContext = createContext<MultiSelectContextValue | undefined>(
  undefined,
);

const useMultiSelect = () => {
  const context = useContext(MultiSelectContext);
  if (!context) {
    throw new Error(
      "Componentes MultiSelect devem ser usados dentro de um <MultiSelect />",
    );
  }
  return context;
};

export function MultiSelect<T>({
  value,
  onValueChange,
  options,
  filterBy,
  valueExtractor,
  children,
}: {
  value: string[];
  onValueChange: (value: string[]) => void;
  options: T[];
  filterBy?: (item: T) => string;
  valueExtractor?: (item: T) => string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Reseta o índice de foco do teclado ao digitar
  useEffect(() => {
    setActiveIndex(0);
  }, [searchValue]);

  const filteredOptions = useMemo(() => {
    if (!searchValue) return options;
    return options.filter((item) => {
      const textToSearch = filterBy
        ? filterBy(item)
        : (item as any)?.label || String(item);
      return textToSearch.toLowerCase().includes(searchValue.toLowerCase());
    });
  }, [options, searchValue, filterBy]);

  // Identifica a string de valor do item para poder fazer o toggle no Enter
  const getValue = useCallback(
    (item: any) => {
      if (valueExtractor) return valueExtractor(item);
      return item?.id || item?.value || String(item);
    },
    [valueExtractor],
  );

  const activeValue = filteredOptions[activeIndex]
    ? getValue(filteredOptions[activeIndex])
    : null;

  return (
    <MultiSelectContext.Provider
      value={{
        value,
        onValueChange,
        open,
        setOpen,
        searchValue,
        setSearchValue,
        filteredOptions,
        activeIndex,
        setActiveIndex,
        activeValue,
        getValue,
      }}
    >
      <div className="relative w-full space-y-2" ref={containerRef}>
        {children}
      </div>
    </MultiSelectContext.Provider>
  );
}

export const MultiSelectTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { setOpen } = useMultiSelect();
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2.5 py-1.5 pr-8 text-sm shadow-sm transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring cursor-text relative",
        className,
      )}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
      <ChevronDownIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none opacity-50" />
    </div>
  );
});
MultiSelectTrigger.displayName = "MultiSelectTrigger";

export const MultiSelectInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">
>(({ className, ...props }, ref) => {
  const {
    setOpen,
    searchValue,
    setSearchValue,
    value,
    onValueChange,
    filteredOptions,
    activeIndex,
    setActiveIndex,
    getValue,
    open,
  } = useMultiSelect();

  return (
    <input
      ref={ref}
      type="text"
      className={cn(
        "min-w-[64px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground",
        className,
      )}
      value={searchValue}
      onChange={(e) => setSearchValue(e.target.value)}
      onFocus={(e) => {
        setOpen(true);
        props.onFocus?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Backspace" && searchValue === "") {
          // Apaga a última seleção se o input estiver vazio
          if (value.length > 0) {
            onValueChange(value.slice(0, -1));
          }
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
          if (filteredOptions.length > 0) {
            setActiveIndex((prev) => (prev + 1) % filteredOptions.length);
          }
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setOpen(true);
          if (filteredOptions.length > 0) {
            setActiveIndex(
              (prev) =>
                (prev - 1 + filteredOptions.length) % filteredOptions.length,
            );
          }
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (open && filteredOptions.length > 0) {
            const itemValue = getValue(filteredOptions[activeIndex]);
            if (value.includes(itemValue)) {
              onValueChange(value.filter((v) => v !== itemValue));
            } else {
              onValueChange([...value, itemValue]);
            }
          } else {
            setOpen(true);
          }
        } else if (e.key === "Escape") {
          setOpen(false);
        }

        props.onKeyDown?.(e);
      }}
      {...props}
    />
  );
});
MultiSelectInput.displayName = "MultiSelectInput";

export const MultiSelectBadge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { value: string }
>(({ className, children, value: itemValue, ...props }, ref) => {
  const { value, onValueChange } = useMultiSelect();

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(value.filter((v) => v !== itemValue));
  };

  return (
    <span
      ref={ref}
      className={cn(
        "bg-muted text-foreground flex h-5.5 w-fit items-center justify-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
      {...props}
    >
      {children}
      <button
        type="button"
        onClick={handleRemove}
        className="-mr-0.5 ml-0.5 rounded-sm opacity-50 ring-offset-background hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <XIcon className="h-3 w-3" />
      </button>
    </span>
  );
});
MultiSelectBadge.displayName = "MultiSelectBadge";

export const MultiSelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open } = useMultiSelect();

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute left-0 top-[calc(100%+4px)] z-50 w-full max-h-[min(calc(100vh-4rem),24rem)] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
MultiSelectContent.displayName = "MultiSelectContent";

export function MultiSelectList<T>({
  children,
  emptyMessage = "Nenhum item encontrado.",
}: {
  children: (item: T, index: number) => React.ReactNode;
  emptyMessage?: React.ReactNode;
}) {
  const { filteredOptions } = useMultiSelect();

  if (filteredOptions.length === 0) {
    return <MultiSelectEmpty>{emptyMessage}</MultiSelectEmpty>;
  }

  return <>{filteredOptions.map((item, index) => children(item, index))}</>;
}

export const MultiSelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value: itemValue, ...props }, ref) => {
  const {
    value,
    onValueChange,
    activeValue,
    setActiveIndex,
    filteredOptions,
    getValue,
  } = useMultiSelect();

  const isSelected = value.includes(itemValue);
  const isFocused = activeValue === itemValue;
  const internalRef = useRef<HTMLDivElement>(null);

  // Mantém o item focado visível no scroll do dropdown
  useEffect(() => {
    if (isFocused && internalRef.current) {
      internalRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isFocused]);

  // Sincroniza refs do componente e do usuário
  const setRefs = useCallback(
    (node: HTMLDivElement) => {
      (internalRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [ref],
  );

  const toggleOption = () => {
    if (isSelected) {
      onValueChange(value.filter((v) => v !== itemValue));
    } else {
      onValueChange([...value, itemValue]);
    }
  };

  return (
    <div
      ref={setRefs}
      onClick={toggleOption}
      onMouseEnter={() => {
        // Alinha o foco do teclado com o mouse
        const index = filteredOptions.findIndex(
          (opt) => getValue(opt) === itemValue,
        );
        if (index !== -1) setActiveIndex(index);
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isFocused && "bg-accent text-accent-foreground",
        isSelected && "font-medium",
        className,
      )}
      {...props}
    >
      {children}
      {isSelected && (
        <span className="absolute right-2 flex h-4 w-4 items-center justify-center">
          <CheckIcon className="h-4 w-4" />
        </span>
      )}
    </div>
  );
});
MultiSelectItem.displayName = "MultiSelectItem";

export const MultiSelectEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "py-6 text-center text-sm text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
MultiSelectEmpty.displayName = "MultiSelectEmpty";
