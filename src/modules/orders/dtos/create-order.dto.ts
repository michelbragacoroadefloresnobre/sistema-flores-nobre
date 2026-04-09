import {
  ContactOrigin,
  DeliveryPeriod,
  PaymentStatus,
  PaymentType,
  PersonType,
  UF,
} from "@/generated/prisma/enums";
import z from "zod";

export const createOrderItemSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
  productName: z.string(),
  label: z.string(),
  unitPrice: z.number(),
  quantity: z.number(),
});

export const createOrderSchema = z.object({
  // Details
  deliveryPeriod: z.enum(DeliveryPeriod),
  deliveryDate: z
    .string({ message: "Data de entrega é obrigatório" })
    .min(1)
    .optional(),
  deliveryUntil: z.string().min(1).optional(),

  sellerId: z
    .string({ message: "Vendedor é obrigatório" })
    .min(1, "Vendedor é obrigatório!"),
  contactOrigin: z.enum(ContactOrigin),

  paymentType: z.enum(PaymentType),
  paymentStatus: z.enum([PaymentStatus.PAID, PaymentStatus.ACTIVE], {
    message: "Escolha se foi pago ou não pago",
  }),

  internalNote: z.string(),
  isWaited: z.boolean().default(false),

  // Order
  senderName: z
    .string()
    .max(100)
    .optional(),
  honoreeName: z
    .string({ message: "Nome do falecido é obrigatório" })
    .min(1, "Nome do falecido é obrigatório!")
    .max(50),
  tributeCardPhrase: z
    .string({ message: "Frase de homenagem é obrigatório" })
    .min(1, "Frase de homenagem é obrigatório!"),
  supplierNote: z.string(),
  deliveryZipCode: z.string().min(1),
  deliveryAddress: z.string().min(1),
  deliveryAddressNumber: z.string(),
  deliveryAddressComplement: z.string(),
  deliveryNeighboorhood: z.string().min(1),
  deliveryIbge: z.string().min(1),
  deliveryCity: z.string().min(1),
  deliveryUf: z.enum(UF),

  // Cliente
  customerName: z
    .string({ message: "Nome é obrigatório" })
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(50),
  customerLegalName: z.string(),
  customerIe: z.string(),
  customerEmail: z
    .email("Email inválido")
    .min(5, "Email deve ter pelo menos 5 caracteres"),
  customerPhone: z
    .string({ message: "Telefone é obrigatório" })
    .regex(/\d{12,13}/)
    .min(1, "Telefone é obrigatório!"),
  customerTaxId: z
    .string({ message: "Documento é obrigatório" })
    .min(1, "Documento é obrigatório!"),
  customerPersonType: z.enum(PersonType, {
    message: "Tipo de pessoa é obrigatório",
  }),
  needInvoice: z.boolean().default(false),

  // Endereço
  customerZipCode: z.string().min(1),
  customerAddress: z.string().min(1),
  customerAddressNumber: z.string(),
  customerAddressComplement: z.string(),
  customerNeighboorhood: z.string().min(1),
  customerIbge: z.string().min(1),
  customerCity: z.string().min(1),
  customerUf: z.enum(UF),

  productVariants: z.array(createOrderItemSchema).min(1, "Selecione pelo menos um produto"),
});

export type CreateOrderData = z.infer<typeof createOrderSchema>;
export type CreateOrderItemData = z.infer<typeof createOrderItemSchema>;
export type CreateOrderFormSection = "Detalhes" | "Pedido" | "Contato";
