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