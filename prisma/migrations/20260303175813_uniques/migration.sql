-- Active: 1758634736245@@127.0.0.1@5432@flores-nobre
CREATE UNIQUE INDEX "unique_confirmed_panel_per_order" ON "supplier_panel" ("orderId")
WHERE
    "status" = 'CONFIRMED';

CREATE UNIQUE INDEX "unique_waiting_panel_per_order" ON "supplier_panel" ("orderId")
WHERE
    "status" = 'WAITING';

-- Habilita a extensão necessária para índices GIST com tipos escalares
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Adiciona a restrição na tabela coverage_area
ALTER TABLE "coverage_area"
ADD CONSTRAINT "no_overlap_per_supplier" EXCLUDE USING gist (
    "supplierId"
    WITH
        =,
        int4range ("start", "end", '[]')
    WITH
        &&
);