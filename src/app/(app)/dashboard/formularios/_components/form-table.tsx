import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Form, FormStatus } from "@/generated/prisma/browser";
import { cn, formatPhoneInput } from "@/lib/utils";
import { FormTableItem } from "@/modules/form/form.dto";
import { CheckedState } from "@radix-ui/react-checkbox";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";

interface LeadTableProps {
  forms: FormTableItem[];
  itemsPerPageOptions?: number[];
  defaultItemsPerPage?: number;
  sellerNames: Map<string, string>;
}

const FormTable = ({
  forms,
  itemsPerPageOptions = [10, 25, 50, 100],
  defaultItemsPerPage = 25,
  sellerNames = new Map(),
}: LeadTableProps) => {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const totalPages = Math.ceil(forms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentForms = forms.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleSelectAll = (isChecked: CheckedState) => {
    if (isChecked === true) setSelectedLeads(forms.map((p) => p.id));
    else setSelectedLeads([]);
  };

  const handleSelectPedido = (pedidoId: string) => {
    setSelectedLeads((prevSelected) => {
      if (prevSelected.includes(pedidoId))
        return prevSelected.filter((id) => id !== pedidoId);
      else return [...prevSelected, pedidoId];
    });
  };

  const getStatusProps = (form: Form) => {
    switch (form.status) {
      case FormStatus.NOT_CONVERTED:
        return {
          label: "Não Convertido",
          className: "bg-warning/15 text-warning border-warning/30",
        };
      case FormStatus.CONVERTED:
        return {
          label: "Convertido",
          className: "bg-success/15 text-success border-success/30",
        };
      case FormStatus.CANCELLED:
        return {
          label: "Cancelado",
          className: "bg-destructive/15 text-destructive border-destructive/30",
        };
      default:
        return {
          label: "Desconhecido",
          className: "bg-muted text-muted-foreground border-border",
        };
    }
  };

  const allSelected = forms.length > 0 && forms.length === selectedLeads.length;
  const isIndeterminate = !allSelected && !(selectedLeads.length === 0);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="rounded-2xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Table Section */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50 backdrop-blur-sm">
            <TableRow className="hover:bg-muted/50">
              <TableHead className="w-12.5 text-center py-4">
                <Checkbox
                  onCheckedChange={handleSelectAll}
                  checked={
                    allSelected
                      ? true
                      : isIndeterminate
                        ? "indeterminate"
                        : false
                  }
                  disabled={!forms.length}
                />
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4">
                Nome
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4">
                Contato
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4">
                Vendedor
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4 max-w-50">
                Motivo
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4">
                Tipo
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4">
                Criado Em
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4">
                Status
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={9} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Inbox
                      className="h-10 w-10 mb-4 text-muted-foreground/40"
                      strokeWidth={1.5}
                    />
                    <p className="text-base font-medium text-foreground">
                      Nenhum registro encontrado
                    </p>
                    <p className="text-sm mt-1">
                      Não há formularios para exibir nesta visualização.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentForms.map((form) => {
                const contactPhone = formatPhoneInput(form.phone);
                const statusProps = getStatusProps(form);

                return (
                  <TableRow
                    key={form.id}
                    className="hover:bg-muted/50 transition-colors duration-200 text-muted-foreground text-sm"
                  >
                    <TableCell className="text-center py-4">
                      <Checkbox
                        checked={selectedLeads.includes(form.id)}
                        onCheckedChange={() => handleSelectPedido(form.id)}
                      />
                    </TableCell>
                    <TableCell className="py-4 font-semibold text-foreground text-center">
                      {form.name}
                    </TableCell>

                    <TableCell className="text-center py-4">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-foreground">{form.email}</span>
                        <span className="text-xs text-muted-foreground">
                          {contactPhone}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center py-4">
                      {sellerNames.get(form.sellerHelenaId || "") || (
                        <span className="text-muted-foreground italic text-sm">
                          Não Atendido
                        </span>
                      )}
                    </TableCell>

                    <TableCell
                      className="text-center py-4 text-sm truncate max-w-50"
                      title={form.cancelReason || ""}
                    >
                      {form.cancelReason || "-"}
                    </TableCell>

                    <TableCell className="text-center py-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                          form.isCustomer
                            ? "bg-secondary text-secondary-foreground border-border"
                            : "bg-primary/10 text-primary border-primary/20",
                        )}
                      >
                        {form.isCustomer ? "Lead" : "Cliente"}
                      </span>
                    </TableCell>

                    <TableCell className="text-center py-4 text-sm">
                      {new Date(form.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>

                    <TableCell className="text-center py-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                          statusProps.className,
                        )}
                      >
                        {statusProps.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
                        disabled={!form.conversionMessages[0]?.sessionId}
                        onClick={() =>
                          window.open(
                            "https://web.helena.run/chat2/sessions/" +
                              form.conversionMessages[0].sessionId,
                          )
                        }
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="hidden xl:inline">Chat</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-muted/20 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mostrar</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-16 h-8 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemsPerPageOptions.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">por página</span>
            </div>

            <div className="hidden sm:block text-sm text-muted-foreground">
              {startIndex + 1}-{Math.min(endIndex, forms.length)} de{" "}
              {forms.length}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={cn(
                      "h-8 w-8 p-0 text-sm",
                      currentPage === pageNumber
                        ? ""
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

type SkeletonProps = {
  rows?: number;
};

// eslint-disable-next-line react/display-name
FormTable.Skeleton = ({ rows = 5 }: SkeletonProps) => {
  return (
    <div className="rounded-2xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12.5 text-center py-4">
                <Checkbox disabled className="opacity-50" />
              </TableHead>
              {[
                "Nome",
                "Contato",
                "Vendedor",
                "Motivo",
                "Tipo",
                "Criado Em",
                "Status",
                "Ações",
              ].map((head) => (
                <TableHead
                  key={head}
                  className="text-center font-medium text-foreground py-4"
                >
                  {head}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRow key={index}>
                <TableCell className="text-center py-4">
                  <Skeleton className="h-4 w-4 mx-auto" />
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-4 w-24 mx-auto" />
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-col gap-1 items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-4 w-28 mx-auto" />
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-5 w-16 rounded-full mx-auto" />
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-4 w-24 mx-auto" />
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-5 w-24 rounded-full mx-auto" />
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-8 w-20 rounded mx-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/20 border-t border-border">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
};

export default FormTable;
