import { PaymentType } from "@/generated/prisma/enums";
import z from "zod";

export const paymentFormSchema = z.object({
  paymentType: z.enum(PaymentType),
  amount: z.string().min(1),
  boletoDue: z.string().optional(),
  orderId: z.cuid2(),
});
