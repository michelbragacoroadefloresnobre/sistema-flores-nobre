-- CreateEnum
CREATE TYPE "SupplierPanelPhotoStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ConversionMessageType" AS ENUM ('WELLCOME', 'SECOND_ATTEMPT', 'FEEDBACK');

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('SITE_SALE', 'FORM_FN', 'MANUAL');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('NOT_CONVERTED', 'CANCELLED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "ContactOrigin" AS ENUM ('WHATSAPP', 'PHONE', 'SITE', 'NONE');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('PJ', 'PF');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('BOLETO', 'CARD_CREDIT', 'PIX', 'PIX_CNPJ', 'MONEY', 'PATNERSHIP');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('ACTIVE', 'PAID', 'CANCELLED', 'PROCESSING');

-- CreateEnum
CREATE TYPE "ProductSize" AS ENUM ('UNIQUE', 'SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "ProductColor" AS ENUM ('DEFAULT', 'YELLOW', 'BLUE', 'WHITE', 'CHAMPAGNE', 'MULTICOLOR', 'ORANGE', 'LILAC', 'PINK', 'ROSE', 'PURPLE', 'RED');

-- CreateEnum
CREATE TYPE "DeliveryPeriod" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'EXPRESS');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PREPARATION', 'PENDING_CANCELLED', 'PENDING_WAITING', 'PRODUCING', 'DELIVERING_ON_ROUTE', 'DELIVERING_DELIVERED', 'FINALIZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupplierPanelStatus" AS ENUM ('WAITING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupplierPaymentStatus" AS ENUM ('WAITING', 'PAID');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'SUPERVISOR', 'SELLER');

-- CreateEnum
CREATE TYPE "UF" AS ENUM ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO');

-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('EDIT', 'APPROVAL', 'REJECTION', 'CANCELATION', 'STATUS_CHANGE', 'AUTOMATION', 'CREATION');

-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('FLORES_NOBRE', 'COROAS_NOBRE');

-- CreateTable
CREATE TABLE "contact" (
    "id" TEXT NOT NULL,
    "legalName" TEXT,
    "ie" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "personType" "PersonType" NOT NULL,
    "taxId" TEXT NOT NULL,
    "zipCode" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "addressNumber" TEXT NOT NULL,
    "addressComplement" TEXT NOT NULL,
    "neighboorhood" TEXT NOT NULL,
    "ibge" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant" (
    "id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "productId" TEXT NOT NULL,
    "color" "ProductColor" NOT NULL,
    "size" "ProductSize" NOT NULL,
    "price" DECIMAL(10,2),
    "imageUrl" TEXT NOT NULL,
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "disabledUntil" TIMESTAMP(3),
    "isRatified" BOOLEAN NOT NULL,
    "jid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city" (
    "ibge" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uf" "UF" NOT NULL,

    CONSTRAINT "city_pkey" PRIMARY KEY ("ibge")
);

-- CreateTable
CREATE TABLE "coverage_area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "freight" DECIMAL(10,2),
    "start" INTEGER NOT NULL,
    "end" INTEGER NOT NULL,
    "supplierId" TEXT NOT NULL,

    CONSTRAINT "coverage_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_supplier" (
    "supplierId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" "ProductSize" NOT NULL,
    "amount" DECIMAL(10,2),

    CONSTRAINT "product_supplier_pkey" PRIMARY KEY ("supplierId","productId","size")
);

-- CreateTable
CREATE TABLE "supplier_panel" (
    "id" TEXT NOT NULL,
    "status" "SupplierPanelStatus" NOT NULL,
    "supplierId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "expireAt" TIMESTAMP(3) NOT NULL,
    "cost" DECIMAL(10,2),
    "freight" DECIMAL(10,2),
    "cancelReason" TEXT,
    "receiverName" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_panel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_panel_photo" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT,
    "rejectionReason" TEXT,
    "status" "SupplierPanelPhotoStatus" NOT NULL,
    "supplierPanelId" TEXT NOT NULL,
    "orderProductId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_panel_photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" TEXT NOT NULL,
    "contactOrigin" "ContactOrigin" NOT NULL,
    "orderStatus" "OrderStatus" NOT NULL,
    "deliveryPeriod" "DeliveryPeriod" NOT NULL,
    "deliveryUntil" TIMESTAMP(3) NOT NULL,
    "formId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isWaited" BOOLEAN NOT NULL DEFAULT false,
    "woocommerceId" TEXT,
    "internalNote" TEXT,
    "honoreeName" TEXT NOT NULL,
    "tributeCardPhrase" TEXT,
    "tributeCardType" TEXT NOT NULL,
    "deliveryZipCode" INTEGER NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryAddressNumber" TEXT,
    "deliveryAddressComplement" TEXT,
    "deliveryNeighboorhood" TEXT NOT NULL,
    "ibge" TEXT,
    "supplierNote" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "supplierPaymentStatus" "SupplierPaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_product" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "order_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form" (
    "id" TEXT NOT NULL,
    "type" "FormType" NOT NULL,
    "status" "FormStatus" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "sellerHelenaId" TEXT,
    "source" TEXT,
    "isCustomer" BOOLEAN,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_data" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gclid" TEXT,
    "gbraid" TEXT,
    "wbraid" TEXT,

    CONSTRAINT "campaign_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_message" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "type" "ConversionMessageType" NOT NULL,
    "formId" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "type" "LogType" NOT NULL,
    "author" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "boletoDueAt" TIMESTAMP(3),
    "isSiteSale" BOOLEAN NOT NULL DEFAULT false,
    "amount" DECIMAL(10,2) NOT NULL,
    "proofOfPaymentUrl" TEXT,
    "refundAmount" DECIMAL(10,2),
    "status" "PaymentStatus" NOT NULL,
    "type" "PaymentType" NOT NULL,
    "text" TEXT,
    "url" TEXT,
    "orderId" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "Role" NOT NULL,
    "helenaId" TEXT,
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_siteId_key" ON "product_variant"("siteId");

-- CreateIndex
CREATE INDEX "supplier_panel_photo_orderProductId_supplierPanelId_idx" ON "supplier_panel_photo"("orderProductId", "supplierPanelId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_data_gclid_key" ON "campaign_data"("gclid");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "contact_ibge_fkey" FOREIGN KEY ("ibge") REFERENCES "city"("ibge") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coverage_area" ADD CONSTRAINT "coverage_area_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_supplier" ADD CONSTRAINT "product_supplier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_supplier" ADD CONSTRAINT "product_supplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_panel" ADD CONSTRAINT "supplier_panel_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_panel" ADD CONSTRAINT "supplier_panel_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_panel_photo" ADD CONSTRAINT "supplier_panel_photo_supplierPanelId_fkey" FOREIGN KEY ("supplierPanelId") REFERENCES "supplier_panel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_panel_photo" ADD CONSTRAINT "supplier_panel_photo_orderProductId_fkey" FOREIGN KEY ("orderProductId") REFERENCES "order_product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_formId_fkey" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_ibge_fkey" FOREIGN KEY ("ibge") REFERENCES "city"("ibge") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_product" ADD CONSTRAINT "order_product_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_product" ADD CONSTRAINT "order_product_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_message" ADD CONSTRAINT "conversion_message_formId_fkey" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
