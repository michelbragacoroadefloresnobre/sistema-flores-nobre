# Finalizados Filters — Referência Completa

## Arquivo de Schema: DTO

**Localização:** `src/modules/orders/dtos/completed-order-table.dto.ts`

```typescript
import { ContactOrigin, PaymentStatus, PersonType, SupplierPaymentStatus } from "@/generated/prisma/enums";
import z from "zod";

export const completedFilterOptionsSchema = z.object({
  createdAtStart: z.string().optional(),
  createdAtEnd: z.string().optional(),
  idOrder: z.string().optional(),
  canceledOrders: z.string().optional(),
  paidStatus: z.enum(PaymentStatus).optional(),
  paidAtStart: z.string().optional(),
  paidAtEnd: z.string().optional(),
  supplierPaymentStatus: z.enum(SupplierPaymentStatus).optional(),
  contact: z.string().optional(),
  contactType: z.enum(PersonType).optional(),
  contactOrigin: z.enum(ContactOrigin).optional(),
  taxId: z.string().optional(),
  sellers: z.preprocess(
    (val) =>
      val === undefined ? undefined : Array.isArray(val) ? val : String(val).split(",").filter(Boolean),
    z.array(z.string()).optional(),
  ),
  suppliers: z.preprocess(
    (val) =>
      val === undefined ? undefined : Array.isArray(val) ? val : String(val).split(",").filter(Boolean),
    z.array(z.string()).optional(),
  ),
  product: z.string().optional(),
  coverageAreaStart: z.string().optional(),
  coverageAreaEnd: z.string().optional(),
});
```

**Nota importante:** `sellers` e `suppliers` chegam como string separada por vírgula na query (`"id1,id2,id3"`) e são convertidos para `string[]` via `z.preprocess`.

---

## Mapeamento Filtro → Prisma Query

### 1. `createdAtStart` / `createdAtEnd`
**Campo Prisma:** `order.createdAt`
**Tipo:** `DateTime`
**Comportamento:**
- Apenas start → `gte: startDate`
- Apenas end → `lte: endDate`
- Ambos → `gte: startDate, lte: endDate`
- Ausente → sem filtro (padrão: `orderStatus = "FINALIZED"`)

```typescript
where.createdAt = { gte: startDate, lte: endDate };
```

---

### 2. `idOrder`
**Campo Prisma:** `order.id`
**Tipo:** `String` (busca parcial, case-insensitive)

```typescript
where.id = { contains: searchParams.idOrder, mode: "insensitive" };
```

---

### 3. `canceledOrders`
**Campo Prisma:** `order.orderStatus`
**Tipo:** `String` (lógica especial)

| Valor recebido | Comportamento |
|---|---|
| `"true"` | `orderStatus = "CANCELLED"` |
| `"false"` | `orderStatus != "CANCELLED"` |
| ausente / `"none"` | `orderStatus = "FINALIZED"` (default) |

**Atenção:** Este filtro sobrescreve o `where.orderStatus = "FINALIZED"` definido no início. Quando `canceledOrders = "false"`, retorna todos exceto cancelados (inclusive FINALIZED, IN_PROGRESS, etc.).

---

### 4. `paidStatus`
**Campo Prisma:** `order.payments[].status`
**Enum:** `PaymentStatus`
**Valores possíveis:** `ACTIVE | PAID | CANCELLED | PROCESSING`
**Comportamento:** Filtra pedidos que tenham ao menos um payment com o status informado.

```typescript
where.payments = { some: { status: searchParams.paidStatus } };
```

---

### 5. `paidAtStart` / `paidAtEnd`
**Campo Prisma:** `order.payments[].paidAt`
**Tipo:** `DateTime?` (nullable)
**Comportamento:** Filtra pagamentos (`some`) com `paidAt` no intervalo.

```typescript
where.payments = {
  ...where.payments,
  some: {
    ...where.payments?.some,
    paidAt: { gte: paidStart, lte: paidEnd },
  },
};
```

**Atenção:** Faz merge com o filtro `paidStatus` via spread, preservando ambas as condições no mesmo `some`.

---

### 6. `supplierPaymentStatus`
**Campo Prisma:** `order.supplierPaymentStatus`
**Enum:** `SupplierPaymentStatus`
**Valores possíveis:** `PAID | WAITING`

```typescript
where.supplierPaymentStatus = searchParams.supplierPaymentStatus;
```

---

### 7. `contact`
**Campo Prisma:** `order.contact.name | email | phone`
**Tipo:** String (busca parcial OR, case-insensitive nos 3 campos)

```typescript
where.contact = {
  OR: [
    { name: { contains: searchParams.contact, mode: "insensitive" } },
    { email: { contains: searchParams.contact, mode: "insensitive" } },
    { phone: { contains: searchParams.contact, mode: "insensitive" } },
  ],
};
```

---

### 8. `contactType`
**Campo Prisma:** `order.contact.personType`
**Enum:** `PersonType`
**Valores possíveis:** `PF | PJ`
**Comportamento:** Faz merge com filtro `contact` via spread se ambos estiverem presentes.

```typescript
where.contact = {
  ...where.contact,
  personType: searchParams.contactType,
};
```

---

### 9. `contactOrigin`
**Campo Prisma:** `order.contactOrigin`
**Enum:** `ContactOrigin`
**Valores possíveis:** `WHATSAPP | PHONE | NONE`

```typescript
where.contactOrigin = searchParams.contactOrigin;
```

---

### 10. `taxId`
**Campo Prisma:** `order.contact.taxId`
**Tipo:** String (busca parcial, case-insensitive)
**Comportamento:** Faz merge com filtro `contact` via spread.

```typescript
where.contact = {
  ...where.contact,
  taxId: { contains: searchParams.taxId, mode: "insensitive" },
};
```

---

### 11. `sellers`
**Campo Prisma:** `order.userId`
**Tipo:** `string[]` → `IN`
**Comportamento:** Filtra pedidos atribuídos a qualquer um dos vendedores listados.

```typescript
where.userId = { in: searchParams.sellers };
```

**Fonte de dados no front:** `GET /api/users?role=SELLER,SUPERVISOR`

---

### 12. `suppliers`
**Campo Prisma:** `order.supplierPanels[].supplierId`
**Tipo:** `string[]` → `IN`
**Comportamento:** Filtra pedidos com ao menos um painel de fornecedor (não cancelado) cujo supplierId esteja na lista.

```typescript
where.supplierPanels = {
  some: {
    supplierId: { in: searchParams.suppliers },
    status: { not: "CANCELLED" },
  },
};
```

**Fonte de dados no front:** `GET /api/suppliers`

---

### 13. `product`
**Campo Prisma:** `order.orderProducts[].variant.product.name`
**Tipo:** String (busca parcial, case-insensitive)

```typescript
where.orderProducts = {
  some: {
    variant: {
      product: {
        name: { contains: searchParams.product, mode: "insensitive" },
      },
    },
  },
};
```

---

### 14. `coverageAreaStart` / `coverageAreaEnd`
**Campo Prisma:** `order.deliveryZipCode`
**Tipo:** String (comparação lexicográfica — CEP numérico sem máscara)
**Comportamento:** Range de CEP. Frontend armazena apenas dígitos (8 chars, sem hífen).

```typescript
where.deliveryZipCode = { gte: cepStart, lte: cepEnd };
```

---

## Response Shape (GET)

```typescript
{
  data: Array<{
    id: string;
    supplierName: string;       // supplierPanels[0].supplier.name || "Sem fornecedor"
    contactName: string;        // contact.name
    sellerName: string;         // user.name
    amount: number;             // payments[0].amount (como número)
    cost: number;               // panel.cost + panel.freight (como número)
    createdAt: string;          // ISO string
    paymentStatus: PaymentStatus;       // payments[0].status || "ACTIVE"
    supplierPaymentStatus: SupplierPaymentStatus;
  }>
}
```

**Cálculo de `cost`:**
```typescript
const cost = panel ? Number(panel.cost ?? 0) + Number(panel.freight ?? 0) : 0;
```

**Includes do Prisma (query):**
```typescript
include: {
  user: { select: { id: true, name: true } },
  payments: { select: { amount: true, status: true, paidAt: true } },
  supplierPanels: {
    select: {
      cost: true,
      freight: true,
      supplier: { select: { id: true, name: true } },
    },
  },
  orderProducts: {
    select: {
      variant: {
        select: {
          price: true,
          product: { select: { name: true, basePrice: true } },
        },
      },
    },
  },
  contact: { select: { id: true, name: true } },
},
orderBy: { createdAt: "desc" },
```

---

## PATCH Endpoint — Atualização de Pagamento do Fornecedor

**Método:** `PATCH /api/tables/completed-orders`

**Body:**
```typescript
{
  orderIds: string[];             // min 1
  supplierPaymentStatus: "PAID" | "WAITING";
}
```

**Ação:** `prisma.order.updateMany` com `where.id IN (orderIds)`.

**Uso no front:** Seleção múltipla de pedidos na tabela → "Marcar como Pago" / "Marcar como Não Pago".

---

## Utilitários de Front-end

### `buildFilters` (`utils.ts`)
Converte o estado do formulário em query params para axios:
- Arrays → `join(",")` (ex: `["id1","id2"]` → `"id1,id2"`)
- Sets → `Array.from().join(",")`
- Valores falsy (empty string, undefined) → removidos

### `getDatePeriodMessage` (`utils.ts`)
Gera a mensagem de período exibida no header da página com base em `createdAtStart` e `createdAtEnd`.

### Envio de datas (front → back)
- `createdAtStart` / `paidAtStart` → ISO string do início do dia (`DateTime.fromFormat(...).toISO()`)
- `createdAtEnd` / `paidAtEnd` → ISO string do fim do dia (`DateTime.fromFormat(...).endOf("day").toISO()`)
- `coverageAreaStart` / `coverageAreaEnd` → apenas dígitos (sem máscara de CEP)

---

## Enums Relevantes

```typescript
// PaymentStatus
ACTIVE | PAID | CANCELLED | PROCESSING

// SupplierPaymentStatus
PAID | WAITING

// PersonType
PF | PJ

// ContactOrigin
WHATSAPP | PHONE | NONE
```

Todos importados de `@/generated/prisma/enums`.
