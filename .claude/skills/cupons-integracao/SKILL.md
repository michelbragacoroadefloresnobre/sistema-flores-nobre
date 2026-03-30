---
name: cupons-integracao
description: Contexto completo do sistema de cupons com integração bidirecional WooCommerce. Use quando precisar entender, modificar ou integrar cupons no sistema (endpoints, service, sync WooCommerce, webhook de uso).
disable-model-invocation: false
user-invocable: true
argument-hint: [contexto]
allowed-tools: Read, Grep, Glob, Bash
---

# Sistema de Cupons — Integração Completa

O sistema de cupons gerencia descontos fixos em R$ sincronizados bidirecionalmente com o WooCommerce. Cupons são criados localmente (admin ou lembrete automático), enviados ao WooCommerce via REST API, e o uso no checkout do site é detectado via webhook de pedidos.

---

## Arquitetura

```
┌─────────────────────┐       ┌──────────────────────┐
│   Sistema Local      │──────▶│  WooCommerce REST API │
│  (source of truth)   │◀──────│  (espelho/checkout)   │
└─────────────────────┘       └──────────────────────┘
         │                              │
    CRUD via admin               Cliente usa cupom
    + geração automática         no checkout do site
    (lembrete diário)                   │
         │                    webhook order.created
         ▼                              │
   coupon.service.ts ───▶ sync async ──▶ WooCommerce
                                        │
   woocommerce.service.ts ◀──── coupon_lines no pedido
         │
    incrementa usedCount
```

**Princípio: local-first.** A operação no banco local sempre acontece primeiro. O sync com WooCommerce é assíncrono (fire-and-forget com `.catch()` + log). Se o WooCommerce estiver offline, o cupom funciona localmente e fica com `woocommerceId: null`.

---

## Modelo de Dados (Prisma)

**Arquivo:** `prisma/schema.prisma`

```prisma
model Coupon {
  id            String   @id @default(cuid())
  code          String   @unique
  discountValue Decimal  @db.Decimal(10, 2)
  validUntil    DateTime
  maxUses       Int      @default(1)
  usedCount     Int      @default(0)
  isActive      Boolean  @default(true)
  woocommerceId Int?     @unique        // ID do cupom no WooCommerce
  contactId     String?
  contact       Contact? @relation(fields: [contactId], references: [id])
  createdAt     DateTime @default(now())

  @@map("coupon")
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `code` | String unique | Código do cupom (ex: `FLORES-A1B2C3D4`) |
| `discountValue` | Decimal(10,2) | Valor fixo de desconto em R$ |
| `validUntil` | DateTime | Data de expiração |
| `maxUses` | Int | Limite de usos (default 1) |
| `usedCount` | Int | Quantas vezes já foi usado |
| `isActive` | Boolean | Se o cupom está ativo |
| `woocommerceId` | Int? unique | ID do cupom correspondente no WooCommerce (preenchido após sync) |
| `contactId` | String? | Se vinculado a um contato específico (cupom personalizado) |

---

## Endpoints REST (Autenticados)

Todos usam `createRoute()` de `src/lib/handler/route-handler.ts` com autenticação automática.

### GET `/api/coupons`
**Arquivo:** `src/app/api/coupons/route.ts`

Lista todos os cupons ordenados por `createdAt desc`, com dados do contato (`name`, `phone`).

**Response:**
```json
{
  "data": [
    {
      "id": "cuid...",
      "code": "FLORES-A1B2C3D4",
      "discountValue": "20.00",
      "validUntil": "2026-04-27T00:00:00.000Z",
      "maxUses": 1,
      "usedCount": 0,
      "isActive": true,
      "woocommerceId": 1234,
      "contactId": "cuid...",
      "contact": { "name": "João Silva", "phone": "5511999999999" }
    }
  ]
}
```

### POST `/api/coupons`
**Arquivo:** `src/app/api/coupons/route.ts`

Cria um cupom no banco local + sincroniza com WooCommerce (async).

**Body (Zod: `createCouponSchema`):**
```json
{
  "code": "FLORES10",
  "discountValue": "10.00",
  "validUntil": "2026-12-31",
  "maxUses": 1,
  "isActive": true,
  "contactId": "cuid..."  // opcional
}
```

| Campo | Tipo | Obrigatório | Default |
|-------|------|-------------|---------|
| `code` | string | sim | — |
| `discountValue` | string (ex: "10.00") | sim | — |
| `validUntil` | date (coerced) | sim | — |
| `maxUses` | int >= 1 | não | 1 |
| `isActive` | boolean | não | true |
| `contactId` | cuid2 | não | — |

**Efeito colateral:** Após criar no banco, chama `syncCouponToWoo()` que:
1. Cria cupom no WooCommerce via POST `/wp-json/wc/v3/coupons`
2. Atualiza o campo `woocommerceId` localmente com o ID retornado

### PATCH `/api/coupons/{id}`
**Arquivo:** `src/app/api/coupons/[id]/route.ts`

Atualiza cupom local + sincroniza campos alterados com WooCommerce (se `woocommerceId` existir).

**Body (Zod: `updateCouponSchema`):** Todos os campos são opcionais.

### DELETE `/api/coupons/{id}`
**Arquivo:** `src/app/api/coupons/[id]/route.ts`

Remove cupom do banco local + exclui do WooCommerce (se `woocommerceId` existir, via DELETE `/wp-json/wc/v3/coupons/{wooId}?force=true`).

---

## Service Layer

**Arquivo:** `src/modules/occasions/coupon.service.ts`

### Funções exportadas

| Função | Descrição |
|--------|-----------|
| `createCoupon(data)` | Cria no DB + sync WooCommerce async |
| `updateCoupon(id, data)` | Atualiza no DB + sync WooCommerce async |
| `deleteCoupon(id)` | Remove do DB + deleta do WooCommerce async |
| `listCoupons()` | Lista todos com contato (para o admin) |
| `findAvailableCoupon(contactId?)` | Busca cupom disponível: prioriza pessoal, depois genérico |
| `redeemCoupon(couponId)` | Incrementa `usedCount` em 1 |

### Sync com WooCommerce

A função interna `syncCouponToWoo(coupon)`:
1. Se o cupom tem `contactId`, busca o email do contato
2. Chama `createWooCoupon()` com mapeamento:
   - `code` → `code`
   - `discountValue` → `amount` (string)
   - `discount_type` → `"fixed_cart"` (sempre fixo)
   - `validUntil` → `date_expires` (ISO 8601)
   - `maxUses` → `usage_limit`
   - email do contato → `email_restrictions[]`
3. Salva o `woocommerceId` retornado no registro local

---

## Client HTTP WooCommerce

**Arquivo:** `src/lib/woocommerce/index.ts`

Axios instance com:
- `baseURL`: `${WOOCOMMERCE_URL}/wp-json/wc/v3`
- Auth: Basic (`consumer_key:consumer_secret` em Base64)
- Retry interceptor para HTTP 429 (backoff linear, máx 5 tentativas)

**Funções:**
```typescript
createWooCoupon(data: CreateWooCouponInput): Promise<WooCouponResponse>
updateWooCoupon(wooId: number, data: UpdateWooCouponInput): Promise<WooCouponResponse>
deleteWooCoupon(wooId: number): Promise<void>
```

**Types:** `src/lib/woocommerce/types.ts`
- `CreateWooCouponInput` — code, discount_type, amount, date_expires, usage_limit, email_restrictions
- `UpdateWooCouponInput` — todos opcionais
- `WooCouponResponse` — id, code, amount, usage_count, usage_limit, date_expires

**Variáveis de ambiente** (`src/lib/env.ts`):
- `WOOCOMMERCE_URL` — URL base do site (ex: `https://floresnobre.com.br`)
- `WOOCOMMERCE_CONSUMER_KEY` — chave da REST API WooCommerce
- `WOOCOMMERCE_CONSUMER_SECRET` — segredo da REST API WooCommerce

---

## Geração Automática (Lembrete Diário)

**Arquivo:** `src/app/api/webhooks/occasions/daily-reminder/route.ts`

O job diário (N8N cron às 09:00 BRT, POST sem body) gera cupons automaticamente:

1. Consulta SQL busca ocasiões cujo lembrete deve ser enviado hoje
2. Para cada ocasião:
   - Gera código único: `FLORES-{randomBytes(4).hex.toUpperCase()}`
   - Cria cupom via `createCoupon()` do service (R$20,00, uso único, 30 dias, vinculado ao contato)
   - O service sincroniza automaticamente com WooCommerce
   - Envia mensagem WhatsApp com o código do cupom
   - Atualiza `lastNotifiedAt` na ocasião

---

## Detecção de Uso via Webhook WooCommerce

**Arquivo:** `src/modules/woocommerce/woocommerce.service.ts`

Quando um pedido chega do WooCommerce (webhook `order.created`), o campo `coupon_lines` é processado:

```typescript
// Schema adicionado ao wooOrderEventSchema:
coupon_lines: z.array(z.object({
  code: z.string(),
  discount: z.union([z.string(), z.number()]).transform(String),
})).default([])
```

No final de `handleWooOrderCreated()`, dentro da transaction:
1. Itera `coupon_lines` do pedido
2. Busca cupom local por `code` (case-insensitive, pois WooCommerce minusculiza códigos)
3. Se encontrado e `usedCount < maxUses`, incrementa `usedCount` com `{ increment: 1 }`

**Webhook endpoint:** `src/app/api/webhooks/woocommerce/route.ts` (POST, CORS aberto)

---

## Schemas de Validação (Zod)

**Arquivo:** `src/modules/occasions/occasion.dto.ts`

```typescript
// Criação
export const createCouponSchema = z.object({
  code: z.string().min(1),
  discountValue: z.string().min(1),
  validUntil: z.coerce.date(),
  maxUses: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  contactId: z.string().cuid2().optional(),
});

// Atualização (todos opcionais)
export const updateCouponSchema = z.object({
  code: z.string().min(1).optional(),
  discountValue: z.string().min(1).optional(),
  validUntil: z.coerce.date().optional(),
  maxUses: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  contactId: z.string().cuid2().nullable().optional(),
});
```

---

## UI Admin

**Página:** `src/app/(app)/configuracoes/cupons/page.tsx`

Tabela com colunas: Código, Valor (R$), Validade, Usos (used/max), Status (Badge), Contato, Ações (editar/excluir).

**Componentes:**
- `src/app/(app)/configuracoes/cupons/_components/coupon-dialog.tsx` — Dialog criar/editar
- `src/app/(app)/configuracoes/cupons/_components/coupon-delete-button.tsx` — AlertDialog de exclusão

Usa React Query (`useQuery` key `["coupons"]`, `useMutation` com `invalidateQueries`).

**Navegação:** Link "Cupons" com ícone Gift no dropdown do usuário em `src/app/(app)/_components/main-navbar.tsx`.

---

## Mapa de Arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `prisma/schema.prisma` | Modelo Coupon com woocommerceId |
| `src/lib/env.ts` | Variáveis WOOCOMMERCE_URL, _CONSUMER_KEY, _CONSUMER_SECRET |
| `src/lib/woocommerce/index.ts` | Client HTTP (axios) para REST API WooCommerce |
| `src/lib/woocommerce/types.ts` | Schemas Zod e tipos para API WooCommerce |
| `src/modules/occasions/coupon.service.ts` | CRUD + sync WooCommerce + busca/resgate |
| `src/modules/occasions/occasion.dto.ts` | Schemas Zod de validação (create/update) |
| `src/app/api/coupons/route.ts` | GET (listar) e POST (criar) |
| `src/app/api/coupons/[id]/route.ts` | PATCH (atualizar) e DELETE (excluir) |
| `src/app/api/webhooks/occasions/daily-reminder/route.ts` | Geração automática de cupom no lembrete |
| `src/modules/woocommerce/woocommerce.service.ts` | Detecção de uso via coupon_lines |
| `src/app/api/webhooks/woocommerce/route.ts` | Webhook endpoint que recebe pedidos |
| `src/app/(app)/configuracoes/cupons/page.tsx` | UI admin de cupons |

---

## Estratégia de Erros

- **Local é source of truth** — operações locais nunca falham por causa do WooCommerce
- **Sync assíncrono** — `.catch()` com `console.error()`, sem bloquear resposta
- **Se WooCommerce offline**: cupom fica com `woocommerceId: null`
- **Retry automático**: interceptor axios para 429 (backoff linear, 5 tentativas)
- **Idempotência no webhook**: checa `usedCount < maxUses` antes de incrementar
- **Case-insensitive**: busca por code usa `mode: "insensitive"` pois WooCommerce minusculiza
