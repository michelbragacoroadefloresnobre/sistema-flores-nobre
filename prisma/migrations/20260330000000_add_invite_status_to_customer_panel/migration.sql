-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'SENT', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "customer_panel" ADD COLUMN     "consentMessageId" TEXT,
ADD COLUMN     "inviteStatus" "InviteStatus" NOT NULL DEFAULT 'PENDING';
