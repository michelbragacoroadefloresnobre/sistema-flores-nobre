"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Prisma } from "@/generated/prisma/client";
import {
  SupplierFormData,
  supplierFormSchema,
} from "@/modules/suppliers/dtos/supplier-form.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SupplierFormDetails } from "../_components/supplier-form-details";
import { SupplierFormProducts } from "../_components/supplier-form-products";
import { SupplierFormRegions } from "../_components/supplier-form-regions";
import { SupplierFormSummary } from "../_components/supplier-form-summary";

const EditSupplierPàge = ({
  supplier,
}: {
  supplier: Prisma.SupplierGetPayload<{
    include: {
      coverageAreas: true;
      products: { include: { product: true } };
    };
  }>;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: supplier.name,
      email: supplier.email,
      cnpj: supplier.cnpj || "",
      phone: supplier.phone || "",
      isRatified: supplier.isRatified,
      groupId: supplier.jid || "",
      regions: supplier.coverageAreas.map((area) => ({
        name: area.name,
        zipCodeStart: String(area.start).padStart(8, "0"),
        zipCodeEnd: String(area.end).padStart(8, "0"),
        freight: area.freight ? Number(area.freight).toFixed(2) : "",
      })),
      products: supplier.products.map((p) => ({
        id: p.productId,
        amount: p.amount ? Number(p.amount).toFixed(2) : "",
        name: p.product.name,
        rating: p.rating,
        size: p.product.size,
      })),
    },
  });

  const onSubmit = async (data: SupplierFormData) => {
    setIsLoading(true);
    try {
      const { message } = await axios
        .put(`/api/suppliers/${supplier.id}`, data)
        .then((res) => res.data);
      toast.success(message);
    } catch (error: any) {
      toast.error(error.response?.data.error || "Erro ao salvar fornecedor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Cadastro de Fornecedores
            </h1>
            <p className="text-muted-foreground">
              Crie o fornecedor e defina suas associações a grupos, regiões,
              produtos e horários.
            </p>
          </div>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            size="lg"
            className="ml-4"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar fornecedor
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Supplier Data Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dados do Fornecedor</CardTitle>
                    <CardDescription>
                      Informações básicas e identificação do fornecedor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SupplierFormDetails form={form} />
                  </CardContent>
                </Card>

                {/* Regions and Freight Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Regiões e Frete</CardTitle>
                    <CardDescription>
                      Defina as regiões atendidas e valores de frete por local
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SupplierFormRegions form={form} />
                  </CardContent>
                </Card>

                {/* Products Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Produtos Vinculados</CardTitle>
                    <CardDescription>
                      Associe produtos existentes e defina valores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SupplierFormProducts form={form} />
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <SupplierFormSummary form={form} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditSupplierPàge;
