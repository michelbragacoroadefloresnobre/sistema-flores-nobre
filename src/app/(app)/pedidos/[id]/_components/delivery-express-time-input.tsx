import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Check, RefreshCcw } from "lucide-react";
import { useState } from "react";

interface DeliveryTimeInputProps {
  value: string | null | undefined;
  onChange: (date: string) => void;
  placeholder?: string;
}

export function DeliveryExpressTimeInput({
  value,
  onChange,
  placeholder = "Até --:--",
}: DeliveryTimeInputProps) {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState<string>("");

  const formattedTime = value ? `${format(value, "dd/MM HH:mm")}` : "";

  const handleConfirm = () => {
    if (!duration) return;

    const hoursToAdd = Number(duration);
    const newDate = new Date();
    newDate.setHours(newDate.getHours() + hoursToAdd);

    onChange(newDate.toISOString());

    setOpen(false);
    setDuration("");
  };

  return (
    <InputGroup>
      <InputGroupInput
        readOnly
        placeholder={placeholder}
        value={formattedTime}
        className="cursor-default"
      />
      <InputGroupAddon align="inline-end">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupButton type="button" title="Atualizar prazo">
              <RefreshCcw className="h-4 w-4" />
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent className="w-full p-4" align="end">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm">Entrega Expressa</h3>
                <div className="text-xs text-muted-foreground">
                  Defina um novo prazo de entrega a partir do momento atual.
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="duration-select">
                    Tempo a partir de agora
                  </Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="duration-select" className="w-full">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="2">2 horas</SelectItem>
                      <SelectItem value="3">3 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  size="sm"
                  onClick={handleConfirm}
                  disabled={!duration}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Confirmar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  );
}
