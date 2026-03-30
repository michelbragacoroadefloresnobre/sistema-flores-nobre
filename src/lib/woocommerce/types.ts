import z from "zod";

export const createWooCouponSchema = z.object({
  code: z.string(),
  discount_type: z
    .enum(["fixed_cart", "percent", "fixed_product"])
    .default("fixed_cart"),
  amount: z.string(),
  date_expires: z.string().nullable().optional(),
  usage_limit: z.number().nullable().optional(),
  individual_use: z.boolean().default(true),
  email_restrictions: z.array(z.string()).default([]),
});

export type CreateWooCouponInput = z.infer<typeof createWooCouponSchema>;

export const updateWooCouponSchema = z.object({
  code: z.string().optional(),
  amount: z.string().optional(),
  date_expires: z.string().nullable().optional(),
  usage_limit: z.number().nullable().optional(),
  email_restrictions: z.array(z.string()).optional(),
});

export type UpdateWooCouponInput = z.infer<typeof updateWooCouponSchema>;

export const wooCouponResponseSchema = z.object({
  id: z.number(),
  code: z.string(),
  amount: z.string(),
  usage_count: z.number(),
  usage_limit: z.number().nullable(),
  date_expires: z.string().nullable(),
});

export type WooCouponResponse = z.infer<typeof wooCouponResponseSchema>;
