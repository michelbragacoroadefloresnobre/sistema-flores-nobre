/*
  Warnings:

  - Added the required column `senderName` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "unique_confirmed_panel_per_order";

-- DropIndex
DROP INDEX "unique_waiting_panel_per_order";

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "senderName" TEXT NOT NULL DEFAULT '';
