---
name: ocasioes
description: Contexto completo do sistema de ocasiões — modelo desacoplado por telefone, painel público do cliente, lembrete diário, resolução de nome via Contact/Lead, e integração com cupons. Use quando precisar entender, modificar ou integrar ocasiões no sistema.
disable-model-invocation: false
user-invocable: true
argument-hint: [contexto]
allowed-tools: Read, Grep, Glob, Bash
---

# Sistema de Ocasiões

O sistema de ocasiões permite que clientes cadastrem datas especiais (aniversários, datas comemorativas, etc.) para receber lembretes via WhatsApp com cupons de desconto. O **telefone é a chave de ligação** — o CustomerPanel é desacoplado do Contact e usa `phone` como identificador único.

---

## Arquitetura

```
Pagamento confirmado
        │
        ▼
createCustomerPanelAndNotify(phone)
        │
        ├── upsert CustomerPanel por phone
        └── envia WhatsApp com link do painel
                    │
                    ▼
        /ocasioes/[panelId]  (público)
        Cliente cadastra ocasiões
                    │
                    ▼
        Job diário (N8N cron 09:00 BRT)
        POST /api/webhooks/occasions/daily-reminder
                    │
                    ├── resolve nome via resolveNameByPhone(phone)
                    ├── busca contactId por phone (para cupom WooCommerce)
                    ├── gera cupom R$20 via coupon.service
                    └── envia WhatsApp com lembrete + cupom
```

**Princípio: desacoplado do Contact.** O CustomerPanel usa `phone` (unique) como chave. O nome do cliente é resolvido em runtime via `resolveNameByPhone()`, que busca primeiro em Contact, depois em Lead, com fallback "Cliente".

---

## Modelos de Dados (Prisma)

**Arquivo:** `prisma/schema.prisma`

### CustomerPanel

Painel público do cliente. Um por telefone. O `id` (CUID) é usado na URL.

```prisma
model CustomerPanel {
  id        String     @id @default(cuid())
  phone     String     @unique @db.VarChar(15)
  occasions Occasion[]
  createdAt DateTime   @default(now())

  @@map("customer_panel")
}
```

**Sem FK para Contact** — ligação é conceitual via phone (mesmo padrão do Lead).

### Occasion

Ocasião cadastrada pelo cliente.

```prisma
model Occasion {
  id              String        @id @default(cuid())
  customerPanelId String
  customerPanel   CustomerPanel @relation(fields: [customerPanelId], references: [id], onDelete: Cascade)
  type            OccasionType
  customName      String?       // Quando type = OTHER
  personName      String        // Nome do homenageado
  date            DateTime      // Data da ocasião
  advanceDays     Int           // Dias de antecedência para notificar
  lastNotifiedAt  DateTime?     // Controle de notificação anual
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@map("occasion")
}
```

### Enum OccasionType

```
BIRTHDAY, WEDDING_ANNIVERSARY, MOTHERS_DAY, FATHERS_DAY,
VALENTINES_DAY, GRADUATION, MEMORIAL, OTHER
```

Labels em pt-BR:
- BIRTHDAY → "Aniversário"
- WEDDING_ANNIVERSARY → "Bodas"
- MOTHERS_DAY → "Dia das Mães"
- FATHERS_DAY → "Dia dos Pais"
- VALENTINES_DAY → "Dia dos Namorados"
- GRADUATION → "Formatura"
- MEMORIAL → "In Memoriam"
- OTHER → "Outro" (campo `customName` habilitado)

---

## Resolução de Nome por Telefone

**Arquivo:** `src/modules/occasions/resolve-name.ts`

```typescript
export async function resolveNameByPhone(phone: string): Promise<string>
```

Ordem de busca:
1. `Contact.findUnique({ where: { phone } })` → retorna `name`
2. `Lead.findUnique({ where: { phone } })` → retorna `name`
3. Fallback: `"Cliente"`

Usado no painel público (saudação) e no lembrete diário (template WhatsApp).

---

## Service Layer

**Arquivo:** `src/modules/occasions/occasion.service.ts`

| Função | Descrição |
|--------|-----------|
| `createCustomerPanelAndNotify(phone)` | Upsert CustomerPanel por phone + envia WhatsApp com link do painel |
| `createOccasion(data)` | Cria ocasião vinculada a um CustomerPanel |
| `updateOccasion(id, data)` | Atualiza campos de uma ocasião |
| `deleteOccasion(id)` | Remove uma ocasião |

### Criação do Painel

`createCustomerPanelAndNotify` é chamado automaticamente quando um pagamento é confirmado (4 pontos de entrada):

- `src/app/api/payments/[id]/confirm/route.ts`
- `src/app/api/payments/[id]/auth-capture/route.ts`
- `src/app/api/payments/[id]/proof-of-payment/route.ts`
- `src/app/api/webhooks/pagarme/route.ts` (com setTimeout de 5s)

Todas passam apenas `phone` — extraído de `payment.order.contact.phone` ou `order.contact.phone`.

---

## API Endpoints

### Ocasiões (público — sem autenticação)

#### POST `/api/occasions`
**Arquivo:** `src/app/api/occasions/route.ts`

Cria uma nova ocasião. Valida que o `customerPanelId` existe.

**Body (Zod: `createOccasionSchema`):**
```json
{
  "customerPanelId": "cuid...",
  "type": "BIRTHDAY",
  "customName": "Dia especial",
  "personName": "Maria",
  "date": "2026-05-15",
  "advanceDays": 7
}
```

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| `customerPanelId` | string | sim | CUID2 |
| `type` | OccasionType | sim | enum |
| `customName` | string | não | min 1 char, apenas se type = OTHER |
| `personName` | string | sim | min 1 char |
| `date` | date | sim | coerced |
| `advanceDays` | int | sim | 1-60 |

#### PATCH `/api/occasions/{id}`
**Arquivo:** `src/app/api/occasions/[id]/route.ts`

Atualiza uma ocasião. Todos os campos são opcionais.

#### DELETE `/api/occasions/{id}`
**Arquivo:** `src/app/api/occasions/[id]/route.ts`

Remove uma ocasião.

---

## Lembrete Diário

**Arquivo:** `src/app/api/webhooks/occasions/daily-reminder/route.ts`

Job diário (N8N cron às 09:00 BRT, POST sem body):

1. **SQL raw** busca ocasiões cujo lembrete deve ser enviado hoje:
   - Calcula `MAKE_DATE(ano_atual, mês, dia) - advanceDays` = hoje
   - Filtra: `lastNotifiedAt IS NULL` ou ano anterior ao atual
2. Para cada ocasião:
   - Resolve nome via `resolveNameByPhone(phone)` do CustomerPanel
   - Busca `contactId` por phone (para email restriction do cupom WooCommerce)
   - Gera cupom R$20 uso único, 30 dias de validade (código: `FLORES-{hex}`)
   - Envia template WhatsApp via Helena com parâmetros do lembrete
   - Atualiza `lastNotifiedAt`

---

## Frontend — Painel Público

**Rota:** `src/app/ocasioes/[id]/page.tsx`

Server component público (sem autenticação), acessível pelo ID do CustomerPanel na URL.

**Funcionalidades:**
- Busca CustomerPanel por ID com occasions incluídas
- Resolve nome do cliente via `resolveNameByPhone(panel.phone)`
- Exibe saudação: "Olá, {firstName}! Cadastre suas datas especiais..."
- Tela 404 se painel não encontrado

**Componentes:** `src/app/ocasioes/[id]/_components/`

| Componente | Descrição |
|------------|-----------|
| `occasion-list.tsx` | Client component — lista de cards com edit/delete |
| `occasion-form.tsx` | Client component — dialog criar/editar (React Hook Form + Zod) |
| `occasion-delete-button.tsx` | Client component — AlertDialog de exclusão |

---

## Templates de Mensagem

**Arquivo:** `src/modules/occasions/message.templates.ts`

| Função | Uso |
|--------|-----|
| `buildPanelInviteMessage(panelUrl)` | Convite WhatsApp após pagamento |
| `buildOccasionReminderTemplateParams(data)` | Parâmetros do template Helena para lembrete diário |

Parâmetros do lembrete:
```typescript
{ nome, dias, tipo_ocasiao, nome_pessoa, data, cupom, desconto }
```

---

## Mapa de Arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `prisma/schema.prisma` | Models CustomerPanel, Occasion, enum OccasionType |
| `src/modules/occasions/occasion.service.ts` | CRUD ocasiões + createCustomerPanelAndNotify |
| `src/modules/occasions/occasion.dto.ts` | Schemas Zod (createOccasionSchema, updateOccasionSchema) |
| `src/modules/occasions/resolve-name.ts` | resolveNameByPhone — busca nome em Contact → Lead → fallback |
| `src/modules/occasions/message.templates.ts` | Templates WhatsApp (convite e lembrete) |
| `src/modules/occasions/coupon.service.ts` | Geração de cupons (compartilhado com sistema de cupons) |
| `src/app/api/occasions/route.ts` | POST criar ocasião (público) |
| `src/app/api/occasions/[id]/route.ts` | PATCH + DELETE ocasião (público) |
| `src/app/api/webhooks/occasions/daily-reminder/route.ts` | Job diário de lembretes |
| `src/app/ocasioes/[id]/page.tsx` | Painel público do cliente |
| `src/app/ocasioes/[id]/_components/` | Componentes do painel (list, form, delete) |

---

## Regras Importantes

### Desacoplamento
- CustomerPanel **não tem FK** para Contact — usa `phone` como chave unique
- Nome é resolvido em runtime via `resolveNameByPhone()` (Contact → Lead → fallback)
- Isso permite que leads (não-clientes) também acessem o painel se receberem o link

### Notificação anual
- `lastNotifiedAt` controla envio: só notifica uma vez por ano por ocasião
- O SQL compara `EXTRACT(YEAR FROM lastNotifiedAt) < EXTRACT(YEAR FROM NOW())`

### Sempre usar enums
- `OccasionType` deve ser importado de `@/generated/prisma/enums`
- Nunca usar strings diretas como `"BIRTHDAY"` — usar `OccasionType.BIRTHDAY`
