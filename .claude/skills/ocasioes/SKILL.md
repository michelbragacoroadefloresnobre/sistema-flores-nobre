---
name: ocasioes
description: Contexto completo do sistema de ocasioes - fluxo de convite em 2 etapas (consentimento via WhatsApp template + link do painel), modelo desacoplado por telefone, painel publico do cliente, lembrete diario, e integracao com cupons. Use quando precisar entender, modificar ou integrar ocasioes no sistema.
disable-model-invocation: false
user-invocable: true
argument-hint: [contexto]
allowed-tools: Read, Grep, Glob, Bash
---

# Sistema de Ocasioes

O sistema de ocasioes permite que clientes cadastrem datas especiais (aniversarios, datas comemorativas, etc.) para receber lembretes via WhatsApp com cupons de desconto. O **telefone e a chave de ligacao** — o CustomerPanel e desacoplado do Contact e usa `phone` como identificador unico.

---

## Arquitetura — Fluxo de Convite em 2 Etapas

```
Pedido entregue (DELIVERING_DELIVERED)
        |
        v
createCustomerPanelAndNotify(phone)
        |
        +-- upsert CustomerPanel por phone
        +-- envia WhatsApp template de consentimento (quick reply: "Sim"/"Nao")
        +-- salva consentMessageId (ID da mensagem enviada)
                    |
                    v
        Webhook Helena: MESSAGE_RECEIVED
        POST /api/webhooks/helena/occasion-consent
                    |
                    +-- refId = consentMessageId? (vincula resposta ao painel)
                    +-- "Sim" -> ACCEPTED -> envia link do painel
                    +-- "Nao" -> DECLINED -> nada mais acontece
                    |
                    v
        /ocasioes/[panelId]  (publico)
        Cliente cadastra ocasioes
                    |
                    v
        Job diario (N8N cron 09:00 BRT)
        POST /api/webhooks/occasions/daily-reminder
                    |
                    +-- resolve nome via resolveNameByPhone(phone)
                    +-- busca contactId por phone (para cupom WooCommerce)
                    +-- gera cupom R$20 via coupon.service
                    +-- envia WhatsApp com lembrete + cupom
```

**Principio: desacoplado do Contact.** O CustomerPanel usa `phone` (unique) como chave. O nome do cliente e resolvido em runtime via `resolveNameByPhone()`, que busca primeiro em Contact, depois em Lead, com fallback "Cliente".

---

## Ponto de Disparo

O convite e disparado quando o pedido e marcado como entregue (`DELIVERING_DELIVERED`), em um unico ponto:

- `src/app/api/supplier-panel/[id]/confirm-delivery/route.tsx`

Chamada fire-and-forget:
```typescript
createCustomerPanelAndNotify(order.contact.phone)
  .catch((e) => console.error("[Ocasioes] Erro ao criar painel:", e));
```

---

## Fluxo de Consentimento

### Envio do Template

Usa `sendOccasionConsentTemplate(phone)` em `src/lib/helena/index.ts` — funcao dedicada que envia template WhatsApp via `/message/send-sync` (sincrono, retorna `id` da mensagem).

O template e criado externamente no Meta/Helena com 2 botoes quick reply: "Sim" e "Nao". O ID do template vem da env var `HELENA_OCCASION_CONSENT_TEMPLATE_ID`.

### Recepcao da Resposta

Webhook em `src/app/api/webhooks/helena/occasion-consent/route.ts` recebe eventos `MESSAGE_RECEIVED` da Helena:

1. Verificar `eventType === "MESSAGE_RECEIVED"` e `direction === "FROM_HUB"`
2. Buscar `CustomerPanel` onde `consentMessageId === refId` e `inviteStatus === SENT`
3. Normalizar texto e verificar se e "sim" ou "nao"/"nao"
4. Chamar `handleOccasionConsentResponse(panelId, accepted)`

### Aceitacao/Recusa

- **Aceito**: `inviteStatus` -> `ACCEPTED`, envia mensagem com link do painel via `buildPanelInviteMessage`
- **Recusado**: `inviteStatus` -> `DECLINED`, nada mais acontece

---

## Modelos de Dados (Prisma)

**Arquivo:** `prisma/schema.prisma`

### CustomerPanel

Painel publico do cliente. Um por telefone. O `id` (CUID) e usado na URL.

```prisma
model CustomerPanel {
  id               String       @id @default(cuid())
  phone            String       @unique @db.VarChar(15)
  inviteStatus     InviteStatus @default(PENDING)
  consentMessageId String?
  occasions        Occasion[]
  createdAt        DateTime     @default(now())

  @@map("customer_panel")
}
```

**Campos importantes:**
- `inviteStatus`: controla o ciclo de vida do convite (`PENDING` -> `SENT` -> `ACCEPTED`/`DECLINED`)
- `consentMessageId`: ID da mensagem de template enviada, usado para vincular resposta via `refId` no webhook

**Sem FK para Contact** — ligacao e conceitual via phone (mesmo padrao do Lead).

### Occasion

Ocasiao cadastrada pelo cliente (sem alteracoes).

### Enum InviteStatus

```
PENDING, SENT, ACCEPTED, DECLINED
```

### Enum OccasionType

```
BIRTHDAY, WEDDING_ANNIVERSARY, MOTHERS_DAY, FATHERS_DAY,
VALENTINES_DAY, GRADUATION, MEMORIAL, OTHER
```

---

## Service Layer

**Arquivo:** `src/modules/occasions/occasion.service.ts`

| Funcao | Descricao |
|--------|-----------|
| `createCustomerPanelAndNotify(phone)` | Upsert CustomerPanel + envia template de consentimento + salva `consentMessageId` |
| `handleOccasionConsentResponse(panelId, accepted)` | Atualiza `inviteStatus` e envia link do painel se aceito |
| `createCustomerPanel(phone)` | Upsert CustomerPanel e retorna URL do painel (uso manual) |
| `createOccasion(data)` | Cria ocasiao vinculada a um CustomerPanel |
| `updateOccasion(id, data)` | Atualiza campos de uma ocasiao |
| `deleteOccasion(id)` | Remove uma ocasiao |

---

## Resolucao de Nome por Telefone

**Arquivo:** `src/modules/occasions/resolve-name.ts`

```typescript
export async function resolveNameByPhone(phone: string): Promise<string>
```

Ordem de busca: Contact -> Lead -> fallback "Cliente".

---

## Templates de Mensagem

**Arquivo:** `src/modules/occasions/message.templates.ts`

| Funcao | Uso |
|--------|-----|
| `buildPanelInviteMessage(panelUrl)` | Mensagem com link do painel (enviada apos aceite do consentimento) |
| `buildOccasionReminderTemplateParams(data)` | Parametros do template Helena para lembrete diario |

O template de consentimento (com botoes "Sim"/"Nao") e criado externamente no Meta/Helena — nao ha funcao de build no codigo.

---

## API Endpoints

### Ocasioes CRUD (publico)

- `POST /api/occasions` — Cria ocasiao (`src/app/api/occasions/route.ts`)
- `PATCH /api/occasions/{id}` — Atualiza ocasiao (`src/app/api/occasions/[id]/route.ts`)
- `DELETE /api/occasions/{id}` — Remove ocasiao (`src/app/api/occasions/[id]/route.ts`)

### Webhook de Consentimento

- `POST /api/webhooks/helena/occasion-consent` — Recebe resposta do cliente ao template de consentimento (`src/app/api/webhooks/helena/occasion-consent/route.ts`)

### Lembrete Diario

- `POST /api/webhooks/occasions/daily-reminder` — Job diario N8N (`src/app/api/webhooks/occasions/daily-reminder/route.ts`)

---

## Mapa de Arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `prisma/schema.prisma` | Models CustomerPanel, Occasion, enums InviteStatus, OccasionType |
| `src/modules/occasions/occasion.service.ts` | CRUD + createCustomerPanelAndNotify + handleOccasionConsentResponse |
| `src/modules/occasions/occasion.dto.ts` | Schemas Zod (createOccasionSchema, updateOccasionSchema) |
| `src/modules/occasions/resolve-name.ts` | resolveNameByPhone |
| `src/modules/occasions/message.templates.ts` | Templates WhatsApp (convite e lembrete) |
| `src/modules/occasions/coupon.service.ts` | Geracao de cupons |
| `src/lib/helena/index.ts` | `sendOccasionConsentTemplate` — envia template de consentimento |
| `src/lib/env.ts` | `HELENA_OCCASION_CONSENT_TEMPLATE_ID` — ID do template |
| `src/app/api/occasions/route.ts` | POST criar ocasiao (publico) |
| `src/app/api/occasions/[id]/route.ts` | PATCH + DELETE ocasiao (publico) |
| `src/app/api/webhooks/helena/occasion-consent/route.ts` | Webhook de resposta ao consentimento |
| `src/app/api/webhooks/occasions/daily-reminder/route.ts` | Job diario de lembretes |
| `src/app/api/supplier-panel/[id]/confirm-delivery/route.tsx` | Ponto de disparo do convite (entrega confirmada) |
| `src/app/ocasioes/[id]/page.tsx` | Painel publico do cliente |
| `src/app/ocasioes/[id]/_components/` | Componentes do painel (list, form, delete) |

---

## Regras Importantes

### Desacoplamento
- CustomerPanel **nao tem FK** para Contact — usa `phone` como chave unique
- Nome e resolvido em runtime via `resolveNameByPhone()` (Contact -> Lead -> fallback)

### Fluxo de Consentimento em 2 Etapas
- Template WhatsApp com botoes quick reply ("Sim"/"Nao") — criado externamente no Meta/Helena
- `consentMessageId` vincula a resposta do webhook a mensagem original via `refId`
- Somente envia link do painel se o cliente aceitar

### Guard de Reenvio
- `inviteStatus !== PENDING` impede reenvio do convite para o mesmo telefone

### Notificacao Anual
- `lastNotifiedAt` controla envio: so notifica uma vez por ano por ocasiao

### Sempre usar enums
- `InviteStatus`, `OccasionType` devem ser importados de `@/generated/prisma/enums`
- Nunca usar strings diretas
