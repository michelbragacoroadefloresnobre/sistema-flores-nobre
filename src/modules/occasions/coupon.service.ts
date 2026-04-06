import prisma from "@/lib/prisma";
import {
  createWooCoupon,
  updateWooCoupon,
  deleteWooCoupon,
} from "@/lib/woocommerce";
import { Coupon } from "@/generated/prisma/client";
import { CouponDiscountType } from "@/generated/prisma/enums";

function toWooDiscountType(type: CouponDiscountType): "fixed_cart" | "percent" {
  return type === CouponDiscountType.PERCENT ? "percent" : "fixed_cart";
}

async function syncCouponToWoo(coupon: Coupon) {
  const contact = coupon.contactId
    ? await prisma.contact.findUnique({
        where: { id: coupon.contactId },
        select: { email: true },
      })
    : null;

  const wooCoupon = await createWooCoupon({
    code: coupon.code,
    discount_type: toWooDiscountType(coupon.discountType),
    amount: coupon.discountValue.toString(),
    date_expires: coupon.validUntil.toISOString(),
    usage_limit: coupon.maxUses,
    individual_use: true,
    email_restrictions: contact?.email ? [contact.email] : [],
  });

  await prisma.coupon.update({
    where: { id: coupon.id },
    data: { woocommerceId: wooCoupon.id },
  });
}

export async function createCoupon(data: {
  code: string;
  discountType?: CouponDiscountType;
  discountValue: string;
  validUntil: Date;
  maxUses?: number;
  isActive?: boolean;
  contactId?: string;
}) {
  const coupon = await prisma.coupon.create({ data });

  syncCouponToWoo(coupon).catch((err) =>
    console.error(
      `[Cupom] Falha ao sincronizar cupom ${coupon.id} com WooCommerce:`,
      err,
    ),
  );

  return coupon;
}

export async function updateCoupon(
  id: string,
  data: {
    code?: string;
    discountType?: CouponDiscountType;
    discountValue?: string;
    validUntil?: Date;
    maxUses?: number;
    isActive?: boolean;
    contactId?: string | null;
  },
) {
  const coupon = await prisma.coupon.update({ where: { id }, data });

  if (coupon.woocommerceId) {
    updateWooCoupon(coupon.woocommerceId, {
      ...(data.code && { code: data.code }),
      ...(data.discountType && { discount_type: toWooDiscountType(data.discountType) }),
      ...(data.discountValue && { amount: data.discountValue }),
      ...(data.validUntil && { date_expires: data.validUntil.toISOString() }),
      ...(data.maxUses !== undefined && { usage_limit: data.maxUses }),
    }).catch((err) =>
      console.error(
        `[Cupom] Falha ao atualizar cupom ${id} no WooCommerce:`,
        err,
      ),
    );
  }

  return coupon;
}

export async function deleteCoupon(id: string) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  await prisma.coupon.delete({ where: { id } });

  if (coupon?.woocommerceId) {
    deleteWooCoupon(coupon.woocommerceId).catch((err) =>
      console.error(
        `[Cupom] Falha ao remover cupom ${id} do WooCommerce:`,
        err,
      ),
    );
  }
}

export async function listCoupons() {
  return prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { contact: { select: { name: true, phone: true } } },
  });
}

export async function findAvailableCoupon(contactId?: string) {
  const now = new Date();

  // Prioriza cupom personalizado para o contato
  if (contactId) {
    const personalCoupon = await prisma.coupon.findFirst({
      where: {
        isActive: true,
        validUntil: { gte: now },
        contactId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (personalCoupon && personalCoupon.usedCount < personalCoupon.maxUses) {
      return personalCoupon;
    }
  }

  // Busca cupom genérico disponível
  const genericCoupon = await prisma.coupon.findFirst({
    where: {
      isActive: true,
      validUntil: { gte: now },
      contactId: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (genericCoupon && genericCoupon.usedCount < genericCoupon.maxUses) {
    return genericCoupon;
  }

  return null;
}

export async function redeemCoupon(couponId: string) {
  return prisma.coupon.update({
    where: { id: couponId },
    data: { usedCount: { increment: 1 } },
  });
}
