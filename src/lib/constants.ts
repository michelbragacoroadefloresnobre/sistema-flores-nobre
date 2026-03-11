import { Channel, PaymentType } from "@/generated/prisma/enums";

export const CHANNEL_PHONES = {
    [Channel.FLORES_NOBRE]: "558005500115",
    [Channel.COROAS_NOBRE]: "558000020001",
}

export const PAYMENT_TYPE = [
  { id: PaymentType.BOLETO, label: "Boleto" },
  { id: PaymentType.CARD_CREDIT, label: "Cartão de Crédito" },
  { id: PaymentType.MONEY, label: "Dinheiro" },
  { id: PaymentType.PATNERSHIP, label: "Parceria" },
  { id: PaymentType.PIX, label: "Pix" },
  { id: PaymentType.PIX_CNPJ, label: "Pix para cnpj" },
];

export const PAYMENT_TYPE_MAP = Object.fromEntries(
      PAYMENT_TYPE.map((item) => [item.id, item.label]),
    ) as Record<PaymentType, string>;
