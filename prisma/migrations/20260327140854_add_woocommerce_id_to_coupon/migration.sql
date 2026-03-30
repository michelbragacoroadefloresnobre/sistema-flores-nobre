-- AlterTable
ALTER TABLE "coupon" ADD COLUMN "woocommerceId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "coupon_woocommerceId_key" ON "coupon"("woocommerceId");
