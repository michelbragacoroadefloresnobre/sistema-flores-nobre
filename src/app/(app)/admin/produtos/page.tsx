import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import prisma from "@/lib/prisma";
import { serialize } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Edit, Plus } from "lucide-react";
import Link from "next/link";
import { ProductDeleteButton } from "./_components/product-delete-button";

export const revalidate = 0;

interface ProductsPageProps {
  searchParams: Promise<any>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const { page } = await searchParams;
  const PAGE_SIZE = 20;
  const currentPage = Number(page) || 1;
  const skip = (currentPage - 1) * PAGE_SIZE;

  const [productsRes, totalCount] = await prisma.$transaction([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      take: PAGE_SIZE,
      skip: skip,
      include: {
        _count: {
          select: { productVariants: { where: { active: true } } },
        },
      },
    }),
    prisma.product.count(),
  ]);

  const products = serialize(productsRes) as typeof productsRes;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Produtos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seu catálogo e preços.
          </p>
        </div>

        <Button asChild>
          <Link href={"/admin/produtos/novo"}>
            <Plus className="mr-2 size-4" /> Criar Produto
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-75 pl-6 text-foreground font-semibold">
                  Nome
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  Variações
                </TableHead>
                <TableHead className="text-right text-foreground font-semibold pr-6">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow
                  key={product.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium text-foreground pl-6">
                    {product.name}
                  </TableCell>
                  <TableCell className="font-medium">
                    {product._count.productVariants}{" "}
                    {product._count.productVariants > 1
                      ? "variações"
                      : "variação"}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Button
                      size={"icon"}
                      variant={"ghost"}
                      className="text-muted-foreground"
                      asChild
                    >
                      <Link href={`/admin/produtos/${product.id}`}>
                        <Edit className="size-4" />
                      </Link>
                    </Button>
                    <ProductDeleteButton productId={product.id} />
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalCount > 0 && (
          <CardFooter className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
            <div className="text-xs text-muted-foreground">
              Mostrando{" "}
              <strong>
                {skip + 1}-{Math.min(skip + PAGE_SIZE, totalCount)}
              </strong>{" "}
              de <strong>{totalCount}</strong> produtos
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPrev}
                asChild={hasPrev}
              >
                {hasPrev ? (
                  <Link
                    href={`?page=${currentPage - 1}`}
                    className="flex items-center"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Link>
                ) : (
                  <span className="flex items-center">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNext}
                asChild={hasNext}
              >
                {hasNext ? (
                  <Link
                    href={`?page=${currentPage + 1}`}
                    className="flex items-center"
                  >
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : (
                  <span className="flex items-center">
                    Próximo
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
