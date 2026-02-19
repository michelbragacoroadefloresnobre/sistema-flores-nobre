import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, CheckCircle, Clock, User } from "lucide-react";

interface DeliveredSectionProps {
  receiverName?: string | null;
  deliveredAt?: string;
}

export function DeliveredSection({
  receiverName,
  deliveredAt,
}: DeliveredSectionProps) {
  const dateObj = deliveredAt ? new Date(deliveredAt) : new Date();

  return (
    <div className="flex flex-col items-center justify-center py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 rounded-full" />
        <div className="relative w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center border-4 border-green-50 dark:border-green-900">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-foreground">
          Entrega Realizada!
        </h2>
        <p className="text-muted-foreground max-w-62.5 mx-auto">
          O pedido foi entregue e finalizado com sucesso.
        </p>
      </div>

      <div className="w-full bg-muted/30 border border-border rounded-xl p-5 space-y-5">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-center mb-4">
          Informações de Entrega
        </h3>

        <div className="space-y-4">
          <div className="flex items-start gap-4 p-3 bg-background rounded-lg border border-border/50 shadow-sm">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-md">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Recebido por
              </p>
              <p className="text-base font-semibold text-foreground">
                {receiverName || "Não informado"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 p-3 bg-background rounded-lg border border-border/50 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-muted-foreground font-medium">
                  Data
                </span>
              </div>
              <p className="text-sm font-semibold pl-6">
                {format(dateObj, "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>

            <div className="flex flex-col gap-1 p-3 bg-background rounded-lg border border-border/50 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-muted-foreground font-medium">
                  Horário
                </span>
              </div>
              <p className="text-sm font-semibold pl-6">
                {format(dateObj, "HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
