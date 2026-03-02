import {
  ContactOrigin,
  PaymentStatus,
  PersonType,
  SupplierPaymentStatus,
} from "@/generated/prisma/enums";
import z from "zod";

export const completedFilterOptionsSchema = z.object({
  createdAtStart: z.string().optional(),
  createdAtEnd: z.string().optional(),
  idOrder: z.string().optional(),
  canceledOrders: z.string().optional(),
  paidStatus: z.enum(PaymentStatus).optional(),
  paidAtStart: z.string().optional(),
  paidAtEnd: z.string().optional(),
  supplierPaymentStatus: z.enum(SupplierPaymentStatus).optional(),
  contact: z.string().optional(),
  contactType: z.enum(PersonType).optional(),
  contactOrigin: z.enum(ContactOrigin).optional(),
  taxId: z.string().optional(),
  sellers: z.array(z.string()).optional(),
  suppliers: z.array(z.string()).optional(),
  product: z.string().optional(),
  coverageAreaStart: z.string().optional(),
  coverageAreaEnd: z.string().optional(),
});

export type CompletedFilterOptions = z.infer<typeof completedFilterOptionsSchema>;