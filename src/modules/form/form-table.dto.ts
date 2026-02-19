import { FormStatus } from "@/generated/prisma/enums";
import z from "zod";

export const formFilterOptionsSchema = z.object({
  status: z.enum(FormStatus).optional(),
  createdAtStart: z.string().optional(),
  createdAtEnd: z.string().optional(),
  isCustomer: z.boolean().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  sellers: z.array(z.string()).optional(),
});

export type FormFilterOptions = z.infer<typeof formFilterOptionsSchema>;
