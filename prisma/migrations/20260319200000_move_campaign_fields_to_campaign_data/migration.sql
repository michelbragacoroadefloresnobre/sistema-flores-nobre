-- Migrate existing campaign data from form to campaign_data
INSERT INTO "campaign_data" ("id", "phone", "gclid", "gbraid", "wbraid")
SELECT gen_random_uuid(), "phone", "gclid", "gbraid", "wbraid"
FROM "form"
WHERE "gclid" IS NOT NULL OR "gbraid" IS NOT NULL OR "wbraid" IS NOT NULL;

-- Remove campaign columns from form
ALTER TABLE "form" DROP COLUMN IF EXISTS "gclid";
ALTER TABLE "form" DROP COLUMN IF EXISTS "gbraid";
ALTER TABLE "form" DROP COLUMN IF EXISTS "wbraid";

-- Remove unique constraint on gclid from campaign_data (if exists)
ALTER TABLE "campaign_data" DROP CONSTRAINT IF EXISTS "campaign_data_gclid_key";

-- Add createdAt to campaign_data
ALTER TABLE "campaign_data" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
