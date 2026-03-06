-- DropIndex
DROP INDEX "unique_confirmed_panel_per_order";

-- DropIndex
DROP INDEX "unique_waiting_panel_per_order";

-- AlterTable
ALTER TABLE "contact" ALTER COLUMN "zipCode" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "order" ALTER COLUMN "deliveryZipCode" SET DATA TYPE TEXT;
