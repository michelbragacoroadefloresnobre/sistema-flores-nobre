import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  PaymentStatus,
  SupplierPaymentStatus,
} from "@/generated/prisma/browser";
import { cn } from "@/lib/utils";
import { CheckedState } from "@radix-ui/react-checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  MoreHorizontal,
  Store,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export interface CompletedOrderItem {
  id: string;
  supplierName: string;
  sellerName: string;
  amount: number;
  cost: number;
  createdAt: string;
  paymentStatus: PaymentStatus;
  supplierPaymentStatus: SupplierPaymentStatus;
}

interface CompletedTableProps {
  orders: CompletedOrderItem[];
  queryKey: unknown[];
  itemsPerPageOptions?: number[];
  defaultItemsPerPage?: number;
}

const getClientPaymentColor = (status: PaymentStatus) => {
  switch (status) {
    case PaymentStatus.PAID:
      return "bg-success/15 text-success";
    case PaymentStatus.ACTIVE:
      return "bg-primary/15 text-primary";
    case PaymentStatus.PROCESSING:
      return "bg-warning/15 text-warning";
    case PaymentStatus.CANCELLED:
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getSupplierPaymentColor = (status: SupplierPaymentStatus) => {
  switch (status) {
    case SupplierPaymentStatus.PAID:
      return "bg-success/15 text-success";
    case SupplierPaymentStatus.WAITING:
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const CompletedTable = ({
  orders,
  queryKey,
  itemsPerPageOptions = [10, 25, 50, 100],
  defaultItemsPerPage = 25,
}: CompletedTableProps) => {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const queryClient = useQueryClient();

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = orders.slice(startIndex, endIndex);

  const updateSupplierPayment = useMutation({
    mutationFn: (params: {
      orderIds: string[];
      supplierPaymentStatus: SupplierPaymentStatus;
    }) =>
      axios.patch("/api/tables/completed-orders", params).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setSelectedOrders([]);
    },
  });

  const handleMarkAsPaid = () => {
    if (selectedOrders.length === 0) return;
    updateSupplierPayment.mutate({
      orderIds: selectedOrders,
      supplierPaymentStatus: SupplierPaymentStatus.PAID,
    });
  };

  const handleMarkAsUnpaid = () => {
    if (selectedOrders.length === 0) return;
    updateSupplierPayment.mutate({
      orderIds: selectedOrders,
      supplierPaymentStatus: SupplierPaymentStatus.WAITING,
    });
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleSelectAll = (isChecked: CheckedState) => {
    if (isChecked === true) setSelectedOrders(orders.map((o) => o.id));
    else setSelectedOrders([]);
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) => {
      if (prev.includes(orderId)) return prev.filter((id) => id !== orderId);
      else return [...prev, orderId];
    });
  };

  const allSelected =
    orders.length > 0 && orders.length === selectedOrders.length;
  const isIndeterminate = !allSelected && selectedOrders.length > 0;

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () =>
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="rounded-2xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <span className="text-sm text-muted-foreground">
          {selectedOrders.length} pedidos selecionados
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-success/30 text-success hover:bg-success/10 hover:text-success"
            disabled={
              selectedOrders.length === 0 || updateSupplierPayment.isPending
            }
            onClick={handleMarkAsPaid}
          >
            <CheckCircle className="h-4 w-4" />
            Marcar como Pago
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={
              selectedOrders.length === 0 || updateSupplierPayment.isPending
            }
            onClick={handleMarkAsUnpaid}
          >
            <XCircle className="h-4 w-4" />
            Marcar como Não Pago
          </Button>
        </div>
      </div>

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
                  disabled={!orders.length}
                />
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4">
                Fornecedor
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4">
                Vendedor
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4">
                Valor
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4">
                Custo
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4">
                Data
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4">
                Pagamento
              </TableHead>
              <TableHead className="text-center font-medium text-foreground py-4">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Inbox
                      className="h-10 w-10 mb-4 text-muted-foreground/40"
                      strokeWidth={1.5}
                    />
                    <p className="text-base font-medium text-foreground">
                      Nenhum registro encontrado
                    </p>
                    <p className="text-sm mt-1">
                      Não há pedidos finalizados para exibir nesta visualização.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentOrders.map((order) => {
                const clientColor = getClientPaymentColor(order.paymentStatus);
                const supplierColor = getSupplierPaymentColor(
                  order.supplierPaymentStatus,
                );

                return (
                  <TableRow
                    key={order.id}
                    className="hover:bg-muted/50 transition-colors duration-200 text-muted-foreground text-sm"
                  >
                    <TableCell className="text-center py-4">
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => handleSelectOrder(order.id)}
                      />
                    </TableCell>

                    <TableCell className="py-4 font-semibold text-foreground text-center">
                      {order.supplierName}
                    </TableCell>

                    <TableCell className="text-center py-4">
                      {order.sellerName || (
                        <span className="text-muted-foreground italic text-sm">
                          Não Atribuído
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-center py-4">
                      {formatCurrency(order.amount)}
                    </TableCell>

                    <TableCell className="text-center py-4">
                      {formatCurrency(order.cost)}
                    </TableCell>

                    <TableCell className="text-center py-4 text-sm">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>

                    <TableCell className="text-center py-4">
                      <div className="inline-flex items-center rounded-full border overflow-hidden">
                        <div
                          className={cn(
                            "flex items-center justify-center h-8 w-8",
                            clientColor,
                          )}
                          title={`Cliente: ${order.paymentStatus}`}
                        >
                          <User className="h-4 w-4" />
                        </div>
                        <div
                          className={cn(
                            "flex items-center justify-center h-8 w-8",
                            supplierColor,
                          )}
                          title={`Fornecedor: ${order.supplierPaymentStatus}`}
                        >
                          <Store className="h-4 w-4" />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                          <Link href={`/pedidos/${order.id}`}>
                            <DropdownMenuItem>Editar Pedido</DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem>Exportar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
              {startIndex + 1}-{Math.min(endIndex, orders.length)} de{" "}
              {orders.length}
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
CompletedTable.Skeleton = ({ rows = 5 }: SkeletonProps) => {
  return (
    <div className="rounded-2xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-44" />
        </div>
      </div>
      <div className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12.5 text-center py-4">
                <Checkbox disabled className="opacity-50" />
              </TableHead>
              {[
                "Fornecedor",
                "Vendedor",
                "Valor",
                "Custo",
                "Data",
                "Pagamento",
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
                  <Skeleton className="h-4 w-20 mx-auto" />
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-4 w-24 mx-auto" />
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-8 w-16 rounded-full mx-auto" />
                </TableCell>
                <TableCell className="py-4">
                  <Skeleton className="h-8 w-8 rounded mx-auto" />
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

export default CompletedTable;
