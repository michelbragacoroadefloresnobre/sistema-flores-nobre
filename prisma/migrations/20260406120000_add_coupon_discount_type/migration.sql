-- CreateEnum
CREATE TYPE "CouponDiscountType" AS ENUM ('FIXED_CART', 'PERCENT');

-- AlterTable
ALTER TABLE "coupon" ADD COLUMN "discountType" "CouponDiscountType" NOT NULL DEFAULT 'FIXED_CART';
