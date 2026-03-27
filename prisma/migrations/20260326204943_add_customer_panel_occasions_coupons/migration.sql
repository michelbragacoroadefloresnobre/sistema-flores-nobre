-- CreateEnum
CREATE TYPE "OccasionType" AS ENUM ('BIRTHDAY', 'WEDDING_ANNIVERSARY', 'MOTHERS_DAY', 'FATHERS_DAY', 'VALENTINES_DAY', 'GRADUATION', 'MEMORIAL', 'OTHER');

-- DropIndex
DROP INDEX "campaign_data_gclid_key";

-- DropIndex
DROP INDEX "unique_confirmed_panel_per_order";

-- DropIndex
DROP INDEX "unique_waiting_panel_per_order";

-- CreateTable
CREATE TABLE "customer_panel" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_panel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occasion" (
    "id" TEXT NOT NULL,
    "customerPanelId" TEXT NOT NULL,
    "type" "OccasionType" NOT NULL,
    "customName" TEXT,
    "personName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "advanceDays" INTEGER NOT NULL,
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occasion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "contactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_panel_contactId_key" ON "customer_panel"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_code_key" ON "coupon"("code");

-- AddForeignKey
ALTER TABLE "customer_panel" ADD CONSTRAINT "customer_panel_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occasion" ADD CONSTRAINT "occasion_customerPanelId_fkey" FOREIGN KEY ("customerPanelId") REFERENCES "customer_panel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
