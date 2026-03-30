-- ============================================================================
-- Etapa 1: Tornar Contact.phone unique (com deduplicação)
-- ============================================================================

-- 1a. Reatribuir orders de contatos duplicados para o mais recente por phone
WITH ranked AS (
  SELECT id, phone, ROW_NUMBER() OVER (PARTITION BY phone ORDER BY "createdAt" DESC) AS rn
  FROM contact
),
keep AS (
  SELECT id, phone FROM ranked WHERE rn = 1
),
duplicates AS (
  SELECT r.id AS old_id, k.id AS new_id
  FROM ranked r
  JOIN keep k ON r.phone = k.phone
  WHERE r.rn > 1
)
UPDATE "order" SET "contactId" = d.new_id FROM duplicates d WHERE "contactId" = d.old_id;

-- 1b. Reatribuir coupons de contatos duplicados
WITH ranked AS (
  SELECT id, phone, ROW_NUMBER() OVER (PARTITION BY phone ORDER BY "createdAt" DESC) AS rn
  FROM contact
),
keep AS (
  SELECT id, phone FROM ranked WHERE rn = 1
),
duplicates AS (
  SELECT r.id AS old_id, k.id AS new_id
  FROM ranked r
  JOIN keep k ON r.phone = k.phone
  WHERE r.rn > 1
)
UPDATE coupon SET "contactId" = d.new_id FROM duplicates d WHERE "contactId" = d.old_id;

-- 1c. Atualizar customer_panel para apontar para o contato mantido
WITH ranked AS (
  SELECT id, phone, ROW_NUMBER() OVER (PARTITION BY phone ORDER BY "createdAt" DESC) AS rn
  FROM contact
),
keep AS (
  SELECT id, phone FROM ranked WHERE rn = 1
),
duplicates AS (
  SELECT r.id AS old_id, k.id AS new_id
  FROM ranked r
  JOIN keep k ON r.phone = k.phone
  WHERE r.rn > 1
)
UPDATE customer_panel SET "contactId" = d.new_id FROM duplicates d WHERE "contactId" = d.old_id;

-- 1d. Deletar contatos duplicados (mantendo o mais recente por phone)
DELETE FROM contact WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY phone ORDER BY "createdAt" DESC) AS rn
    FROM contact
  ) sub WHERE rn > 1
);

-- 1e. Adicionar unique constraint em Contact.phone
CREATE UNIQUE INDEX "contact_phone_key" ON "contact"("phone");

-- ============================================================================
-- Etapa 2: Desacoplar CustomerPanel do Contact (usar phone)
-- ============================================================================

-- 2a. Adicionar coluna phone (nullable temporariamente)
ALTER TABLE customer_panel ADD COLUMN phone VARCHAR(15);

-- 2b. Backfill phone a partir do contact vinculado
UPDATE customer_panel SET phone = c.phone FROM contact c WHERE c.id = customer_panel."contactId";

-- 2c. Deduplicar panels com mesmo phone (manter mais recente, mover occasions)
WITH ranked_panels AS (
  SELECT id, phone, ROW_NUMBER() OVER (PARTITION BY phone ORDER BY "createdAt" DESC) AS rn
  FROM customer_panel
  WHERE phone IS NOT NULL
),
keep_panels AS (
  SELECT id, phone FROM ranked_panels WHERE rn = 1
),
dup_panels AS (
  SELECT r.id AS old_id, k.id AS new_id
  FROM ranked_panels r
  JOIN keep_panels k ON r.phone = k.phone
  WHERE r.rn > 1
)
UPDATE occasion SET "customerPanelId" = d.new_id FROM dup_panels d WHERE "customerPanelId" = d.old_id;

DELETE FROM customer_panel WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY phone ORDER BY "createdAt" DESC) AS rn
    FROM customer_panel
    WHERE phone IS NOT NULL
  ) sub WHERE rn > 1
);

-- 2d. Tornar phone NOT NULL + UNIQUE
ALTER TABLE customer_panel ALTER COLUMN phone SET NOT NULL;
CREATE UNIQUE INDEX "customer_panel_phone_key" ON customer_panel(phone);

-- 2e. Drop FK e coluna contactId
ALTER TABLE customer_panel DROP CONSTRAINT "customer_panel_contactId_fkey";
DROP INDEX "customer_panel_contactId_key";
ALTER TABLE customer_panel DROP COLUMN "contactId";
