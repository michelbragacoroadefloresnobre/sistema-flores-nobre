"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { CouponDeleteButton } from "./_components/coupon-delete-button";
import { CouponDialog } from "./_components/coupon-dialog";

type Coupon = {
  id: string;
  code: string;
  discountType: "FIXED_CART" | "PERCENT";
  discountValue: string;
  validUntil: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  contactId: string | null;
  createdAt: string;
  contact: { name: string; phone: string } | null;
};

export default function CuponsPage() {
  const { data: coupons, isPending } = useQuery<Coupon[]>({
    queryKey: ["coupons"],
    queryFn: () =>
      axios.get("/api/coupons").then((r) => r.data.data),
  });

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Cupons
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os cupons de desconto do sistema de ocasiões.
          </p>
        </div>

        <CouponDialog />
      </div>

      <Card className="overflow-hidden border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="pl-6 text-foreground font-semibold">
                  Código
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  Valor
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  Validade
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  Usos
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-foreground font-semibold">
                  Contato
                </TableHead>
                <TableHead className="text-right text-foreground font-semibold pr-6">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Spinner className="mx-auto" />
                  </TableCell>
                </TableRow>
              ) : !coupons?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Nenhum cupom cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow
                    key={coupon.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium text-foreground pl-6">
                      {coupon.code}
                    </TableCell>
                    <TableCell>
                      {coupon.discountType === "PERCENT"
                        ? `${Number(coupon.discountValue).toFixed(0)}%`
                        : `R$ ${Number(coupon.discountValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    </TableCell>
                    <TableCell>
                      {format(new Date(coupon.validUntil), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {coupon.usedCount}/{coupon.maxUses}
                    </TableCell>
                    <TableCell>
                      {coupon.isActive ? (
                        <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {coupon.contact ? coupon.contact.name : "Genérico"}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <CouponDialog coupon={coupon} />
                      <CouponDeleteButton couponId={coupon.id} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
