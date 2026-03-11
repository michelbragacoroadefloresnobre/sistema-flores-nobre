/*
  Warnings:

  - The values [EVENING] on the enum `DeliveryPeriod` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeliveryPeriod_new" AS ENUM ('MORNING', 'AFTERNOON', 'BUSINESSHOURS', 'EXPRESS');
ALTER TABLE "order" ALTER COLUMN "deliveryPeriod" TYPE "DeliveryPeriod_new" USING ("deliveryPeriod"::text::"DeliveryPeriod_new");
ALTER TYPE "DeliveryPeriod" RENAME TO "DeliveryPeriod_old";
ALTER TYPE "DeliveryPeriod_new" RENAME TO "DeliveryPeriod";
DROP TYPE "public"."DeliveryPeriod_old";
COMMIT;
