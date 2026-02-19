import { ProductSize } from "@/generated/prisma/enums";
import z from "zod";

const dayScheduleSchema = z.object({
  isOpen: z.boolean(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
});

const cnpjRegex = /^\d{14}$/;

export const supplierFormSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    isRatified: z.boolean(),
    email: z.email("E-mail inválido").or(z.literal("")),
    cnpj: z.string().regex(cnpjRegex, "CNPJ inválido").or(z.literal("")),
    phone: z.string().regex(/\d{12,13}/, "Telefone invalido"),
    groupId: z.string().optional(),
    regions: z
      .array(
        z
          .object({
            name: z.string().min(1),
            zipCodeStart: z.string(),
            zipCodeEnd: z.string(),
            freight: z.string(),
          })
          .refine(
            (data) => Number(data.zipCodeEnd) >= Number(data.zipCodeStart),
            {
              message: "CEP final deve ser maior ou igual ao inicial",
              path: ["zipCodeEnd"],
            },
          ),
      )
      .min(1, "Cadastre pelo menos uma região"),
    products: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          size: z.enum(ProductSize),
          amount: z.string(),
          rating: z.number().min(0).max(5).optional(),
        }),
      )
      .min(1, "Selecione pelo menos um produto"),
    // weekHours: z.object({
    //   [WeekDay.MONDAY]: dayScheduleSchema,
    //   [WeekDay.TUESDAY]: dayScheduleSchema,
    //   [WeekDay.WEDNESDAY]: dayScheduleSchema,
    //   [WeekDay.THURSDAY]: dayScheduleSchema,
    //   [WeekDay.FRIDAY]: dayScheduleSchema,
    //   [WeekDay.SATURDAY]: dayScheduleSchema,
    //   [WeekDay.SUNDAY]: dayScheduleSchema,
    // }),
  })
  .refine(
    (data) => {
      if (data.isRatified && !data.groupId) {
        return false;
      }
      return true;
    },
    {
      message: "Grupo é obrigatório para fornecedores homologados",
      path: ["groupId"],
    },
  );

export type SupplierFormData = z.infer<typeof supplierFormSchema>;
