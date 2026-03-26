-- AlterTable
ALTER TABLE "supplier_panel_photo" ALTER COLUMN "orderProductId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "supplier_panel_photo_supplierPanelId_idx" ON "supplier_panel_photo"("supplierPanelId");
