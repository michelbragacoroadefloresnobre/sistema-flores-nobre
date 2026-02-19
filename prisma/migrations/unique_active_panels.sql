-- Active: 1758634736245@@127.0.0.1@5432@flores-nobre
CREATE UNIQUE INDEX "unique_confirmed_panel_per_order" ON "supplier_panel" ("orderId")
WHERE
    "status" = 'CONFIRMED';

CREATE UNIQUE INDEX "unique_waiting_panel_per_order" ON "supplier_panel" ("orderId")
WHERE
    "status" = 'WAITING';