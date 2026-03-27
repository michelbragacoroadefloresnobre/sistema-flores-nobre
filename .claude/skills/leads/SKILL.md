---
name: leads
description: Contexto completo do sistema de leads — modelo, enums, ciclo de vida, pontos de criação/conversão, e regras de deduplicação por telefone. Use quando precisar entender, modificar ou integrar leads no sistema.
disable-model-invocation: false
user-invocable: true
argument-hint: [contexto]
allowed-tools: Read, Grep, Glob, Bash
---

# Sistema de Leads

Lead armazena dados mínimos de contato de pessoas que interagiram com a marca mas que podem ou não ter se tornado clientes. O **telefone é a chave única** de deduplicação — toda operação de criação usa `upsert` por phone.

---

## Modelo de Dados

Arquivo: `prisma/schema.prisma`

```prisma
enum LeadSource {
  NONE          // Origem desconhecida (pedido manual sem formulário prévio)
  FORM          // Formulário de landing page
  SITE_COROAS   // Pedido via site WooCommerce
}

enum LeadStatus {
  NOT_CONVERTED  // Ainda não se tornou cliente
  CONVERTED      // Já realizou um pedido (Contact criado)
}

model Lead {
  id        String     @id @default(cuid())
  name      String     @db.VarChar(255)
  phone     String     @unique @db.VarChar(15)  // 12-13 dígitos, sem formatação
  email     String?    @db.VarChar(255)
  source    LeadSource @default(NONE)
  status    LeadStatus @default(NOT_CONVERTED)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@map("lead")
}
```

### Características

- **Sem relações (FK)** com nenhuma outra tabela — é standalone
- **`phone` é `@unique`** — garante que não existem leads duplicados por telefone
- **Formato do telefone**: `\d{12,13}` (mesmo formato do `Contact.phone`), ex: `5511999998888`
- **Sempre usar enums** (`LeadSource`, `LeadStatus`) ao definir valores — nunca strings diretas
- **Toda criação deve ser `upsert` por phone** — se já existe, atualiza; se não, cria

---

## Ciclo de Vida

```
                                    ┌──────────────────────────┐
                                    │    Formulário landing     │
                                    │  POST /api/webhooks/      │
                                    │       formularios         │
                                    └────────────┬─────────────┘
                                                 │
                                                 ▼
                                    ┌──────────────────────────┐
                                    │   Lead (NOT_CONVERTED)    │
                                    │   source: FORM            │
                                    └────────────┬─────────────┘
                                                 │
                          ┌──────────────────────┼──────────────────────┐
                          │                      │                      │
                          ▼                      ▼                      ▼
             ┌────────────────────┐ ┌────────────────────┐  (não converte)
             │   Pedido Manual    │ │   Pedido WooComm.  │     Lead fica
             │  POST /api/orders  │ │  webhook woocomm.  │   NOT_CONVERTED
             └────────┬───────────┘ └────────┬───────────┘
                      │                      │
                      ▼                      ▼
             ┌─────────────────────────────────────────┐
             │         Lead (CONVERTED)                 │
             │   Contact criado com dados completos     │
             └─────────────────────────────────────────┘
```

---

## Pontos de Criação e Atualização

### 1. Formulário de landing page — `NOT_CONVERTED`

**Arquivo**: `src/app/api/webhooks/formularios/route.ts`
**Quando**: Pessoa preenche formulário na landing page
**Dados disponíveis**: name, phone, email

```typescript
import { LeadSource } from "@/generated/prisma/enums";

await prisma.lead.upsert({
  where: { phone },
  create: { name, phone, email, source: LeadSource.FORM },
  update: { name, email },
});
```

**Regras**:
- Se Lead já existe com esse phone, apenas atualiza name e email (não sobrescreve source nem status)
- Se Lead já era `CONVERTED`, o upsert **não regride** o status (update não altera status)

### 2. Pedido manual — `CONVERTED`

**Arquivo**: `src/app/api/orders/route.ts` (dentro da transaction)
**Quando**: Vendedor cria pedido no painel admin
**Dados disponíveis**: todos do Contact (name, phone, email, etc.)

```typescript
import { LeadStatus } from "@/generated/prisma/client";

await tx.lead.upsert({
  where: { phone: contact.phone },
  create: {
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    status: LeadStatus.CONVERTED,
  },
  update: { status: LeadStatus.CONVERTED },
});
```

**Regras**:
- Source fica `NONE` quando cria novo (pedido manual sem formulário prévio)
- Se Lead já existia (ex: veio de FORM), apenas atualiza status para CONVERTED, preservando source original

### 3. Pedido WooCommerce — `CONVERTED`

**Arquivo**: `src/modules/woocommerce/woocommerce.service.ts` (dentro da transaction)
**Quando**: Webhook recebe pedido do site WooCommerce
**Dados disponíveis**: billing data (name, phone, email)

```typescript
import { LeadSource, LeadStatus } from "@/generated/prisma/client";

await tx.lead.upsert({
  where: { phone: contact.phone },
  create: {
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    source: LeadSource.SITE_COROAS,
    status: LeadStatus.CONVERTED,
  },
  update: { status: LeadStatus.CONVERTED },
});
```

**Regras**:
- Source `SITE_COROAS` apenas no create (se Lead já existia com source FORM, preserva o FORM)
- Sempre marca como CONVERTED

---

## Regras Importantes

### Deduplicação
- **Sempre `upsert` por phone** — nunca `create` direto
- Phone é a única chave de deduplicação (email NÃO é usado para dedup)
- Antes de qualquer operação com Lead, o phone já deve estar validado no formato `\d{12,13}`

### Imutabilidade do source
- O `source` registra como o Lead **chegou pela primeira vez** ao sistema
- Os updates nos upserts **não sobrescrevem source** — isso é intencional
- Se a pessoa preencheu formulário (FORM) e depois comprou no site, o source continua FORM

### Status é irreversível
- `NOT_CONVERTED → CONVERTED` é o único caminho
- Um Lead `CONVERTED` **nunca volta** para `NOT_CONVERTED`
- Os updates só fazem `{ status: LeadStatus.CONVERTED }` — nunca regridem

### Relação conceitual com Contact
- Lead **não tem FK** para Contact — são tabelas independentes
- A ligação é conceitual via **phone**: mesmo telefone no Lead e no Contact indica a mesma pessoa
- Quando um pedido é criado, Contact é criado/atualizado E Lead é marcado CONVERTED no mesmo transaction

---

## Arquivos de Referência

| Arquivo | Descrição |
|---------|-----------|
| `prisma/schema.prisma` | Model Lead, enums LeadSource e LeadStatus |
| `src/app/api/webhooks/formularios/route.ts` | Criação de Lead via formulário (NOT_CONVERTED) |
| `src/app/api/orders/route.ts` | Upsert Lead CONVERTED no pedido manual |
| `src/modules/woocommerce/woocommerce.service.ts` | Upsert Lead CONVERTED no pedido WooCommerce |

---

## Stack e Padrões

- **ORM**: Prisma com enums gerados em `@/generated/prisma/client` e `@/generated/prisma/enums`
- **Sempre importar enums** — nunca usar strings diretas como `"CONVERTED"` ou `"FORM"`
- **Transactions**: Nos fluxos de pedido, o upsert do Lead acontece dentro da mesma `prisma.$transaction` que cria Contact e Order
- **Validação de phone**: regex `/^\d{12,13}$/` (12-13 dígitos numéricos sem formatação)
