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
import {
  SupplierFormData,
  supplierFormSchema,
} from "@/modules/suppliers/dtos/supplier-form.dto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SupplierFormDetails } from "../_components/supplier-form-details";
import { SupplierFormProducts } from "../_components/supplier-form-products";
import { SupplierFormRegions } from "../_components/supplier-form-regions";
import { SupplierFormSummary } from "../_components/supplier-form-summary";

const SupplierForm = () => {
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      isRatified: false,
      email: "",
      cnpj: "",
      phone: "",
      groupId: "",
      regions: [],
      products: [],
      // weekHours: {
      //   [WeekDay.MONDAY]: {
      //     isOpen: true,
      //     openTime: "08:00",
      //     closeTime: "18:00",
      //   },
      //   [WeekDay.TUESDAY]: {
      //     isOpen: true,
      //     openTime: "08:00",
      //     closeTime: "18:00",
      //   },
      //   [WeekDay.WEDNESDAY]: {
      //     isOpen: true,
      //     openTime: "08:00",
      //     closeTime: "18:00",
      //   },
      //   [WeekDay.THURSDAY]: {
      //     isOpen: true,
      //     openTime: "08:00",
      //     closeTime: "18:00",
      //   },
      //   [WeekDay.FRIDAY]: {
      //     isOpen: true,
      //     openTime: "08:00",
      //     closeTime: "18:00",
      //   },
      //   [WeekDay.SATURDAY]: { isOpen: false, openTime: "", closeTime: "" },
      //   [WeekDay.SUNDAY]: { isOpen: false, openTime: "", closeTime: "" },
      // },
    },
  });

  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      return (await axios.post<{ message: string }>("/api/suppliers", data))
        .data;
    },
    onSuccess(data) {
      toast.success(data.message);
      router.push("/admin/fornecedores");
    },
    onError(e: any) {
      console.error("Erro ao salvar fornecedor:", e.response?.data?.error || e);
      toast.error("Erro ao salvar fornecedor");
    },
  });

  const onSubmit = async (data: SupplierFormData) => {
    mutate(data);
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
            onClick={form.handleSubmit(onSubmit as any)}
            disabled={isPending}
            size="lg"
            className="ml-4"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar fornecedor
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit as any)}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Dados do Fornecedor</CardTitle>
                    <CardDescription>
                      Informações básicas e identificação do fornecedor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SupplierFormDetails form={form as any} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Regiões e Frete</CardTitle>
                    <CardDescription>
                      Defina as regiões atendidas e valores de frete por faixa
                      de cep
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SupplierFormRegions form={form as any} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Produtos Vinculados</CardTitle>
                    <CardDescription>
                      Associe produtos existentes e defina valores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SupplierFormProducts form={form as any} />
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>

          <div className="lg:col-span-1">
            <SupplierFormSummary form={form as any} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierForm;
