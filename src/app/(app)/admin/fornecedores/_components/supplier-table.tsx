"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Supplier } from "@/generated/prisma/browser";
import { formatPhoneInput } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SupplierDisableButton } from "./supplier-disable-button";

const SupplierTable = ({ data }: { data: Supplier[] }) => {
  const suppliers = data;
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.cnpj.includes(searchTerm) ||
        supplier.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [suppliers, searchTerm]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSuppliers = filteredSuppliers.slice(startIndex, endIndex);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset para primeira página ao buscar
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset para primeira página
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Fornecedores
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os fornecedores cadastrados no sistema
            </p>
          </div>
          <Button
            size="lg"
            className="shadow-lg transition-all hover:shadow-xl"
            asChild
          >
            <Link href={"/admin/fornecedores/novo"}>
              <Plus className="h-4 w-4" />
              Novo Fornecedor
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ ou e-mail..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12 border-border focus-visible:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Itens por página:
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-20 h-12 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-b border-border hover:bg-muted/50">
                <TableHead className="text-muted-foreground font-semibold py-4 px-6">
                  Nome
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold py-4 px-6">
                  CNPJ
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold py-4 px-6">
                  E-mail
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold py-4 px-6">
                  Telefone
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold py-4 px-6 text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-base font-medium text-foreground">
                        Nenhum fornecedor encontrado
                      </p>
                      {searchTerm && (
                        <p className="text-sm mt-1 text-muted-foreground/80">
                          Tente ajustar os filtros de busca
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentSuppliers.map((supplier, index) => (
                  <TableRow
                    key={supplier.id}
                    className={`
                      ${index % 2 === 0 ? "bg-card" : "bg-muted/40"}
                      hover:bg-muted/60 transition-colors duration-150 border-b border-border
                    `}
                  >
                    <TableCell className="font-medium text-foreground py-4 px-6">
                      {supplier.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-4 px-6 font-mono text-sm">
                      {supplier.cnpj}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-4 px-6">
                      <a
                        href={`mailto:${supplier.email}`}
                        className="hover:text-primary transition-colors"
                      >
                        {supplier.email}
                      </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground py-4 px-6">
                      {formatPhoneInput(supplier.phone || "")}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            window.open(`/admin/fornecedores/${supplier.id}`)
                          }
                          className="hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <SupplierDisableButton supplier={supplier} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredSuppliers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">
              Mostrando{" "}
              <span className="font-semibold text-foreground">
                {startIndex + 1}
              </span>{" "}
              a{" "}
              <span className="font-semibold text-foreground">
                {Math.min(endIndex, filteredSuppliers.length)}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-foreground">
                {filteredSuppliers.length}
              </span>{" "}
              {filteredSuppliers.length !== suppliers.length && (
                <span className="text-muted-foreground/70">
                  (filtrados de{" "}
                  <span className="font-semibold text-muted-foreground">
                    {suppliers.length}
                  </span>
                  )
                </span>
              )}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-border hover:bg-accent"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber: number;

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
                      variant={
                        currentPage === pageNumber ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`
                        w-10 
                        ${
                          currentPage === pageNumber
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
                            : "border-border hover:bg-accent hover:text-accent-foreground"
                        }
                      `}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="border-border hover:bg-accent"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierTable;
