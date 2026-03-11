import prisma from "@/lib/prisma";
import {
  ContactOrigin,
  DeliveryPeriod,
  FormStatus,
  FormType,
  OrderStatus,
  PaymentStatus,
  PaymentType,
  Prisma,
  Role,
  SupplierPaymentStatus,
} from "@/generated/prisma/client";
import z from "zod";
import createHttpError, { isHttpError } from "http-errors";
import { Contact } from "lucide-react";
import { createCityIfNotExists } from "../cities/city.service";
import { sendInitialTemplate } from "../conversions/conversion.service";
import { subDays } from "date-fns";
import { DateTime, Duration } from "luxon";
import { SP_TIMEZONE } from "@/lib/env";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const billingSchema = z.object({
  first_name: z.string().default(""),
  last_name: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  address_1: z.string().default(""),
  address_2: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  postcode: z.string().default(""),
});

const shippingSchema = z.object({
  first_name: z.string().default(""),
  last_name: z.string().default(""),
  address_1: z.string().default(""),
  address_2: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  postcode: z.string().default(""),
  phone: z.string().default(""),
});

const lineItemSchema = z.object({
  product_id: z.number(),
  variation_id: z.number().default(0),
  name: z.string(),
  parent_name: z.string().optional(),
  quantity: z.number().default(1),
  price: z.union([z.string(), z.number()]).transform(Number),
  image: z.object({ src: z.string().default("") }).optional(),
  meta_data: z.array(z.object({ key: z.string(), value: z.any() })).default([]),
});

const metaDataItemSchema = z.object({
  key: z.string(),
  value: z.any(),
});

export const wooOrderEventSchema = z.object({
  id: z.number().optional(),
  billing: billingSchema,
  shipping: shippingSchema,
  status: z.string(),
  line_items: z.array(lineItemSchema).min(1),
  meta_data: z.array(metaDataItemSchema).default([]),
  payment_method: z.string().default(""),
  date_paid: z.string().nullable().optional(),
});

export const wooWebhookBodySchema = z.preprocess(
  (val) => (Array.isArray(val) ? (val[0]?.body ?? val[0]) : val),
  wooOrderEventSchema,
);

export type WooOrderEvent = z.infer<typeof wooOrderEventSchema>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const periodHours: Record<string, number> = {
  [DeliveryPeriod.MORNING]: 6,
  [DeliveryPeriod.AFTERNOON]: 12,
  [DeliveryPeriod.BUSINESSHOURS]: 18,
};

const VALID_UFS = new Set([
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]);

const PAYMENT_TYPE_MAP: Record<string, Prisma.PaymentCreateInput["type"]> = {
  "woo-pagarme-payments-credit_card": "CARD_CREDIT",
  "woo-pagarme-payments-pix": "PIX",
  "woo-pagarme-payments-billet": "BOLETO",
};

const DELIVERY_PERIOD_MAP: Record<
  string,
  Prisma.OrderCreateInput["deliveryPeriod"]
> = {
  expressa: "EXPRESS",
  manha: "MORNING",
  tarde: "AFTERNOON",
  comercial: "BUSINESSHOURS",
};

function getMeta(metaData: WooOrderEvent["meta_data"], key: string) {
  return metaData.find((m) => m.key === key)?.value ?? null;
}

function parseDeliveryDate(input: string | null): Date {
  if (!input) return new Date();

  const isoMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const date = new Date(input);
    if (!isNaN(date.getTime())) return date;
  }

  const brMatch = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    const date = new Date(`${y}-${m}-${d}`);
    if (!isNaN(date.getTime())) return date;
  }

  return new Date();
}

function resolvePersonType(document: string): "PF" | "PJ" {
  const digits = document.replace(/\D/g, "");
  return digits.length <= 11 ? "PF" : "PJ";
}

async function resolveCity(
  tx: Prisma.TransactionClient,
  cityName: string,
  uf: string,
) {
  const where: Prisma.CityWhereInput = {
    name: { contains: cityName, mode: "insensitive" },
    ...(VALID_UFS.has(uf.toUpperCase()) ? { uf: uf.toUpperCase() as any } : {}),
  };

  const city = await tx.city.findFirst({ where });
  if (city) return city;

  return city;
}

export async function handleWooOrderCreated(event: WooOrderEvent) {
  const { billing, shipping, status, line_items, meta_data, payment_method } =
    event;

  const phone = billing.phone;
  const email = billing.email.trim().toLowerCase();
  const document = (getMeta(meta_data, "_billing_document") || "").replace(
    /\D/g,
    "",
  );

  const order = await prisma.$transaction(async (tx) => {
    const contactConditions: Prisma.ContactWhereInput[] = [];
    if (email) contactConditions.push({ email });
    if (phone) contactConditions.push({ phone });

    let contact = contactConditions.length
      ? await tx.contact.findFirst({ where: { OR: contactConditions } })
      : null;

    const billingCity = await resolveCity(tx, billing.city, billing.state);

    const contactData = {
      name: `${billing.first_name} ${billing.last_name}`.trim(),
      email,
      phone: phone || "",
      personType: resolvePersonType(document),
      taxId: document,
      zipCode: billing.postcode.replace(/\D/g, "") || "0",
      address: billing.address_1,
      addressNumber: getMeta(meta_data, "_billing_number") || "",
      addressComplement: billing.address_2,
      neighboorhood: getMeta(meta_data, "_billing_neighborhood") || "",
    } satisfies Prisma.ContactCreateWithoutCityInput;

    if (contact) {
      contact = await tx.contact.update({
        where: { id: contact.id },
        data: contactData,
      });
    } else {
      contact = await tx.contact.create({
        data: billingCity?.ibge
          ? { ...contactData, city: { connect: { ibge: billingCity?.ibge } } }
          : contactData,
      });
    }

    // ----- Form -------------------------------------------------------------

    let form = await prisma.form
      .updateManyAndReturn({
        data: { status: FormStatus.CONVERTED },
        where: {
          phone: contact.phone,
          status: { not: FormStatus.CONVERTED },
          createdAt: { gte: subDays(new Date(), 1) },
        },
      })
      .then((data) => data[0]);

    if (!form)
      form = await tx.form.create({
        data: {
          type: FormType.SITE_SALE,
          status: FormStatus.CONVERTED,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
        },
      });

    // ----- Delivery info ----------------------------------------------------

    const deliveryCity = await resolveCity(
      tx,
      shipping.city ? shipping.city : billing.city,
      shipping.state ? shipping.state : billing.state,
    );
    const deliveryDate = parseDeliveryDate(
      getMeta(meta_data, "_delivery_date"),
    );

    const rawPeriod = (
      getMeta(meta_data, "_delivery_period") || ""
    ).toLowerCase();
    const deliveryPeriod = DELIVERY_PERIOD_MAP[rawPeriod] ?? "BUSINESSHOURS";

    let deliveryUntil: DateTime;

    if (deliveryPeriod === DeliveryPeriod.EXPRESS)
      deliveryUntil = DateTime.now().setZone(SP_TIMEZONE).plus({ hours: 3 });
    else {
      const hour = periodHours[deliveryPeriod];

      if (!hour)
        throw new createHttpError.BadRequest("Periodo informado é invalido");

      deliveryUntil = DateTime.fromISO(deliveryDate.toDateString(), {
        zone: SP_TIMEZONE,
      }).set({ hour, minute: 0, millisecond: 0 });
    }

    const giftOption = getMeta(meta_data, "_gift_card_option") === "yes";
    const honoreeName = getMeta(meta_data, "_gift_card_to") || "";
    const tributeCardPhrase = getMeta(meta_data, "_gift_card_message") || null;
    const tributeCardFrom = getMeta(meta_data, "_gift_card_from") || "";

    // ----- Default seller ---------------------------------------------------

    const defaultUser =
      (await tx.user.findFirst({
        where: {
          name: { equals: "Site", mode: "insensitive" },
          role: Role.ADMIN,
        },
        select: { id: true },
      })) ??
      (await tx.user.findFirst({
        where: { role: { in: ["ADMIN", "OWNER"] } },
        select: { id: true },
      }));
    if (!defaultUser)
      throw new createHttpError.BadRequest(
        "Nenhum usuário administrador encontrado",
      );

    // ----- Order ------------------------------------------------------------

    const order = await tx.order.create({
      data: {
        contactOrigin: ContactOrigin.NONE,
        orderStatus: OrderStatus.PENDING_PREPARATION,
        deliveryPeriod,
        deliveryUntil: deliveryUntil.toJSDate(),
        formId: form.id,
        userId: defaultUser.id,
        woocommerceId: event.id?.toString(),
        honoreeName,
        senderName: tributeCardFrom,
        tributeCardPhrase,
        deliveryZipCode: shipping.postcode.replace(/\D/g, "") || "0",

        deliveryAddress: shipping.address_1,
        deliveryAddressNumber: getMeta(meta_data, "_shipping_number") || "",
        deliveryAddressComplement: shipping.address_2,
        deliveryNeighboorhood:
          getMeta(meta_data, "_shipping_neighborhood") || "",
        ibge: deliveryCity?.ibge || null,
        supplierNote: getMeta(meta_data, "_shipping_observacoes") || "",
        contactId: contact.id,
        supplierPaymentStatus: SupplierPaymentStatus.WAITING,
      },
    });

    for (const item of line_items) {
      const productId = item.variation_id || item.product_id;

      const product = await tx.productVariant.findFirst({
        where: {
          siteId: { equals: productId.toString(), mode: "insensitive" },
        },
      });

      if (!product)
        throw new createHttpError.BadRequest(`Produto não encontrado`);

      await tx.orderProduct.createMany({
        data: Array.from({ length: item.quantity }, () => ({
          orderId: order.id,
          variantId: product.id,
        })),
      });
    }

    const totalAmount = line_items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const isPaid = !!event.date_paid;
    const paymentType = PAYMENT_TYPE_MAP[payment_method] ?? "MONEY";
    const paymentStatus =
      status === "on-hold" || status === "processing"
        ? isPaid
          ? PaymentStatus.PAID
          : PaymentStatus.ACTIVE
        : PaymentStatus.CANCELLED;

    await tx.payment.create({
      data: {
        amount: totalAmount,
        status: paymentStatus,
        type: paymentType,
        isSiteSale: true,
        orderId: order.id,
        paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : null,
      },
    });
    return order;
  });

  return order;
}
