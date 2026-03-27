import { OccasionType } from "@/generated/prisma/enums";
import z from "zod";

export const createOccasionSchema = z.object({
  customerPanelId: z.string().cuid2(),
  type: z.enum(OccasionType),
  customName: z.string().min(1).optional(),
  personName: z.string().min(1),
  date: z.coerce.date(),
  advanceDays: z.number().int().min(1).max(60),
});

export const updateOccasionSchema = z.object({
  type: z.enum(OccasionType).optional(),
  customName: z.string().min(1).nullable().optional(),
  personName: z.string().min(1).optional(),
  date: z.coerce.date().optional(),
  advanceDays: z.number().int().min(1).max(60).optional(),
});

export const createCouponSchema = z.object({
  code: z.string().min(1),
  discountValue: z.string().min(1),
  validUntil: z.coerce.date(),
  maxUses: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  contactId: z.string().cuid2().optional(),
});

export const updateCouponSchema = z.object({
  code: z.string().min(1).optional(),
  discountValue: z.string().min(1).optional(),
  validUntil: z.coerce.date().optional(),
  maxUses: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  contactId: z.string().cuid2().nullable().optional(),
});
