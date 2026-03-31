---
name: finalizados-filters
description: Este skill deve ser usado quando uma IA precisar desenvolver, entender ou modificar os filtros do back-end da página de pedidos finalizados ("finalizados"). Cobre o endpoint GET /api/tables/completed-orders, o schema Zod de validação, o mapeamento de cada filtro para queries Prisma, o endpoint PATCH para atualização do status de pagamento do fornecedor, e os utilitários de front-end para envio dos parâmetros.
version: 0.1.0
---

# Filtros de Pedidos Finalizados — Back-end

## Visão Geral

A página `/dashboard/finalizados` exibe pedidos com `orderStatus = "FINALIZED"` (padrão) e oferece 14 filtros combinados via query params. O back-end é implementado em um único route handler com o padrão `createRoute` do projeto.

**Arquivos-chave:**
- `src/app/api/tables/completed-orders/route.ts` — Route handler (GET + PATCH)
- `src/modules/orders/dtos/completed-order-table.dto.ts` — Schema Zod dos filtros
- `src/app/(app)/dashboard/finalizados/_components/completed-filters.tsx` — Formulário de filtros
- `src/app/(app)/dashboard/finalizados/utils.ts` — `buildFilters`, `getDatePeriodMessage`
- `src/app/(app)/dashboard/finalizados/page.tsx` — Página principal

---

## Padrão do Route Handler

```typescript
import { createRoute } from "@/lib/handler/route-handler";

export const GET = createRoute(
  async (req, { searchParams }) => {
    // searchParams já é Zod-validado conforme o schema
    const where: Prisma.OrderFindManyArgs["where"] = {};
    where.orderStatus = "FINALIZED"; // padrão inicial

    // aplicar filtros condicionalmente...

    const orders = await prisma.order.findMany({ where, include: {...} });
    return { data: orders.map(...) };
  },
  { searchParams: completedFilterOptionsSchema },
);
```

---

## Filtros Disponíveis

### Filtros de Data (range)

| Parâmetro | Campo Prisma | Operação |
|---|---|---|
| `createdAtStart` | `order.createdAt` | `gte` |
| `createdAtEnd` | `order.createdAt` | `lte` |
| `paidAtStart` | `order.payments[].paidAt` | `gte` |
| `paidAtEnd` | `order.payments[].paidAt` | `lte` |
| `coverageAreaStart` | `order.deliveryZipCode` | `gte` (string) |
| `coverageAreaEnd` | `order.deliveryZipCode` | `lte` (string) |

Datas chegam como ISO string. CEP chega como string de 8 dígitos (sem máscara).

### Filtros de Texto (busca parcial, `contains + mode: insensitive`)

| Parâmetro | Campo Prisma |
|---|---|
| `idOrder` | `order.id` |
| `contact` | `order.contact.name OR email OR phone` |
| `taxId` | `order.contact.taxId` |
| `product` | `order.orderProducts[].variant.product.name` |

### Filtros de Enum (valor exato)

| Parâmetro | Campo Prisma | Enum |
|---|---|---|
| `paidStatus` | `order.payments[].status` | `PaymentStatus` |
| `supplierPaymentStatus` | `order.supplierPaymentStatus` | `SupplierPaymentStatus` |
| `contactType` | `order.contact.personType` | `PersonType` |
| `contactOrigin` | `order.contactOrigin` | `ContactOrigin` |

### Filtros de Array (IDs, IN)

| Parâmetro | Campo Prisma | Comportamento |
|---|---|---|
| `sellers` | `order.userId` | `userId IN [...]` |
| `suppliers` | `order.supplierPanels[].supplierId` | `some { supplierId IN [...], status != CANCELLED }` |

Arrays chegam como string `"id1,id2"` e são convertidos para `string[]` via `z.preprocess` no DTO.

### Filtro Especial: `canceledOrders`

Controla o `orderStatus` e sobrescreve o padrão `"FINALIZED"`:
- `"true"` → `orderStatus = "CANCELLED"`
- `"false"` → `orderStatus != "CANCELLED"` (retorna todos exceto cancelados)
- ausente → mantém `orderStatus = "FINALIZED"`

---

## Pontos de Atenção ao Implementar

### Merge de filtros no mesmo relacionamento

Quando `paidStatus` e `paidAtStart/End` são usados juntos, ambos devem operar no mesmo `some`. O padrão atual faz spread:

```typescript
where.payments = {
  ...((where.payments as Prisma.PaymentListRelationFilter) || {}),
  some: {
    ...((where.payments as Prisma.PaymentListRelationFilter)?.some || {}),
    paidAt: paidAtFilter,
  },
};
```

O mesmo padrão vale para `contact` + `contactType` + `taxId`.

### Ordenação padrão

Sempre `orderBy: { createdAt: "desc" }`.

### Estado inicial da página

O front inicializa com `createdAtStart = DateTime.now().startOf("day").toISO()`, então por padrão a página mostra apenas pedidos do dia atual.

---

## Response Shape (GET)

```typescript
{
  data: {
    id: string;
    supplierName: string;           // supplierPanels[0].supplier.name || "Sem fornecedor"
    contactName: string;
    sellerName: string;
    amount: number;                 // payments[0].amount
    cost: number;                   // panel.cost + panel.freight
    createdAt: string;              // ISO
    paymentStatus: PaymentStatus;   // payments[0].status || "ACTIVE"
    supplierPaymentStatus: SupplierPaymentStatus;
  }[]
}
```

---

## PATCH Endpoint

```typescript
// PATCH /api/tables/completed-orders
// Body: { orderIds: string[], supplierPaymentStatus: "PAID" | "WAITING" }

await prisma.order.updateMany({
  where: { id: { in: orderIds } },
  data: { supplierPaymentStatus },
});
```

Usado pela tabela para marcar/desmarcar pagamento ao fornecedor em lote.

---

## Referência Detalhada

Para o mapeamento completo de cada filtro com código Prisma, schema DTO completo, includes da query e documentação dos utilitários de front-end, consultar:

- **`references/filters-reference.md`** — Referência completa com código, enums, e comportamentos edge case
