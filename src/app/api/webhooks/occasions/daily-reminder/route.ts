import { sendTemplate } from "@/lib/helena";
import prisma from "@/lib/prisma";
import { buildOccasionReminderTemplateParams } from "@/modules/occasions/message.templates";
import { createCoupon } from "@/modules/occasions/coupon.service";
import { resolveNameByPhone } from "@/modules/occasions/resolve-name";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { CouponDiscountType } from "@/generated/prisma/enums";
import { randomBytes } from "crypto";

type OccasionRow = {
  id: string;
  type: string;
  customName: string | null;
  personName: string;
  date: Date;
  advanceDays: number;
  phone: string;
};

export async function POST() {
  const occasions = await prisma.$queryRaw<OccasionRow[]>(Prisma.sql`
    SELECT
      o.id,
      o.type,
      o."customName",
      o."personName",
      o.date,
      o."advanceDays",
      cp.phone
    FROM occasion o
    JOIN customer_panel cp ON cp.id = o."customerPanelId"
    WHERE (
      MAKE_DATE(
        EXTRACT(YEAR FROM NOW() AT TIME ZONE 'America/Sao_Paulo')::int,
        EXTRACT(MONTH FROM o.date)::int,
        EXTRACT(DAY FROM o.date)::int
      ) - (o."advanceDays" || ' days')::interval
    )::date = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date
    AND (
      o."lastNotifiedAt" IS NULL
      OR EXTRACT(YEAR FROM o."lastNotifiedAt") < EXTRACT(YEAR FROM NOW() AT TIME ZONE 'America/Sao_Paulo')
    )
  `);

  console.log(`[Ocasiões] ${occasions.length} lembretes para enviar`);

  for (const occasion of occasions) {
    try {
      const contactName = await resolveNameByPhone(occasion.phone);

      const contact = await prisma.contact.findUnique({
        where: { phone: occasion.phone },
        select: { id: true },
      });

      const code = `FLORES-${randomBytes(4).toString("hex").toUpperCase()}`;
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      const coupon = await createCoupon({
        code,
        discountType: CouponDiscountType.PERCENT,
        discountValue: "10",
        validUntil,
        maxUses: 1,
        isActive: true,
        contactId: contact?.id,
      });

      const templateParams = buildOccasionReminderTemplateParams({
        contactName,
        occasionType: occasion.type as any,
        customName: occasion.customName,
        personName: occasion.personName,
        date: occasion.date,
        advanceDays: occasion.advanceDays,
        couponCode: coupon.code,
        discountValue: "10%",
      });

      await sendTemplate({
        number: occasion.phone,
        templateId: process.env.HELENA_OCCASION_REMINDER_TEMPLATE_ID!,
        parameters: templateParams,
      });

      await prisma.occasion.update({
        where: { id: occasion.id },
        data: { lastNotifiedAt: new Date() },
      });

      console.log(`[Ocasiões] Lembrete enviado para ${occasion.phone} (ocasião ${occasion.id}, cupom ${coupon.code})`);
    } catch (e) {
      console.error(`[Ocasiões] Erro ao processar ocasião ${occasion.id}:`, e);
    }
  }

  return new NextResponse(null, { status: 204 });
}
