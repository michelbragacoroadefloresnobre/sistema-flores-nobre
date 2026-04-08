import { PaymentType } from "@/generated/prisma/enums";
import z from "zod";

export const paymentFormSchema = z.object({
  paymentType: z.enum(PaymentType),
  amount: z.string().min(1),
  orderId: z.cuid2(),
});
