-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('NONE', 'FORM', 'SITE_COROAS');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NOT_CONVERTED', 'CONVERTED');

-- CreateTable
CREATE TABLE "lead" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255),
    "source" "LeadSource" NOT NULL DEFAULT 'NONE',
    "status" "LeadStatus" NOT NULL DEFAULT 'NOT_CONVERTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_phone_key" ON "lead"("phone");
