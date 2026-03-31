---
name: forms
description: Este skill deve ser utilizado quando for necessário entender, modificar, integrar ou depurar o sistema de Forms (formulários) do Sistema Flores Nobre. Ativadores: "como funciona o forms", "integrar com formulários", "atualizar status do form", "criar form manualmente", "formulário de conversão", "métricas de conversão", "formulário do site", "tabela de formulários", "filtrar formulários", "webhook de formulário", "formId", "FormStatus", "FormType", "ConversionMessage", "taxa de conversão", "campos do form".
version: 1.0.0
---

# Forms — Sistema de Eventos de Conversão

Forms representam o **evento de entrada de um lead** no funil de vendas. Cada Form registra quem preencheu um formulário (site ou manual), por qual canal chegou, e se converteu em pedido. São a unidade central das métricas de conversão dos times de vendas.

## Quando usar este skill

- Integrar front-end com os endpoints de forms
- Entender como um Form é criado, atualizado ou convertido
- Debugar problemas na criação de formulários ou leads
- Implementar novos filtros na tabela de formulários
- Entender como Form se relaciona com Order, Lead e ConversionMessage
- Modificar a lógica de status ou permissões de atualização
- Criar integrações que precisam criar Forms (ex.: novo canal de entrada)

---

## Modelo de Dados

```prisma
model Form {
  id             String    @id @default(cuid())
  type           FormType          // FORM_FN | SITE_SALE | MANUAL
  status         FormStatus        // NOT_CONVERTED | CONVERTED | CANCELLED
  name           String
  email          String
  phone          String            // 12–13 dígitos, sem formatação
  sellerHelenaId String?           // futuro: atribuição de vendedor
  source         String?           // utm_source ou campo livre
  isCustomer     Boolean?          // true = novo lead; false = já converteu antes
  cancelReason   String?
  createdAt      DateTime  @default(now())

  conversionMessages ConversionMessage[]   // mensagens WhatsApp enviadas
  orders             Order[]               // pedidos gerados por este form
}
```

**Enums importantes** — importar sempre de `@/generated/prisma/enums`:

| Enum | Valores |
|------|---------|
| `FormType` | `FORM_FN`, `SITE_SALE`, `MANUAL` |
| `FormStatus` | `NOT_CONVERTED`, `CONVERTED`, `CANCELLED` |
| `ConversionMessageType` | `WELLCOME`, `SECOND_ATTEMPT`, `FEEDBACK` |

---

## Endpoints da API

### 1. `POST /api/webhooks/formularios` — Webhook do site (sem auth)

Cria um Form a partir do preenchimento no site externo. **CORS aberto** (origem `*`).

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "5511999999999",
  "sourceData": "google",
  "campaignData": {
    "utm_source": "google",
    "gclid": "Cj0KCQ...",
    "gbraid": "...",
    "wbraid": "..."
  }
}
```

**Regras de validação:**
- `name`: mínimo 2 caracteres (após trim)
- `email`: formato de e-mail válido
- `phone`: apenas dígitos, 12 ou 13 caracteres

**Proteções anti-duplicata:**
- Se o mesmo `phone` já submeteu um form nas **últimas 24h** → retorna 200 sem criar nada
- A verificação usa `createdAt >= subDays(now, 1)`

**O que acontece ao criar:**
1. `Form` criado com `type=FORM_FN`, `status=NOT_CONVERTED`
2. `isCustomer=true` se nenhum form CONVERTED mais antigo que 24h existir; `false` caso contrário
3. `Lead` upsertado por `phone` com `source=LeadSource.FORM`
4. `CampaignData` criado se houver `gclid`, `gbraid` ou `wbraid`
5. Mensagem de boas-vindas enviada via WhatsApp (Helena) → cria `ConversionMessage` com `type=WELLCOME`

**Resposta de sucesso:** `201` `{ message: "Formulario registrado com sucesso" }`
**Duplicata (sem criar):** `200` `{ message: "Já preencheu formulario" }`
**Erro de validação:** `400` com mensagem específica

---

### 2. `GET /api/forms?phone={phone}` — Consultar form por telefone

Busca dados de preenchimento recente para **pré-popular formulários internos** (ex.: criação manual de pedido).

**Query param:** `phone` (string, mínimo 8 chars)

**Lógica:**
1. Procura Form criado nas últimas 24h para o telefone
2. Se encontrado → retorna `{ name, email, phone }` do Form
3. Se não encontrado → busca na tabela `Contact` e retorna dados do contato (podem ser `undefined`)

**Resposta:**
```json
{ "data": { "name": "João Silva", "email": "joao@email.com", "phone": "5511999999999" } }
```

> Nunca retorna 404 — retorna sempre objeto com campos possivelmente undefined.

---

### 3. `PATCH /api/forms/{id}` — Atualizar status do form

Permite que supervisores atualizem manualmente o status de um Form.

**Roles permitidas:** `SUPERVISOR`, `ADMIN`, `OWNER`

**Body:**
```json
{ "status": "CONVERTED" }
```

**Resposta:** `{ "data": { ...form atualizado } }`

**Erro se role inválida:** `403 Forbidden`

---

### 4. `GET /api/tables/forms` — Listagem com filtros (dashboard)

Endpoint principal da tabela de formulários. Retorna lista de forms com `conversionMessages` incluídos.

**Query params (todos opcionais):**

| Param | Tipo | Comportamento |
|-------|------|--------------|
| `status` | `FormStatus` | Filtro exato por status |
| `createdAtStart` | `string` (ISO date) | `createdAt >= valor` |
| `createdAtEnd` | `string` (ISO date) | `createdAt <= valor` |
| `name` | `string` | `contains` case-insensitive |
| `email` | `string` | `contains` case-insensitive |
| `phone` | `string` | `contains` case-insensitive |
| `sellers` | `string[]` | Aceito pelo schema, ainda não implementado na query |

**Resposta:** `{ "data": FormTableItem[] }` onde `FormTableItem` inclui `conversionMessages: ConversionMessage[]`

---

## Ciclo de Vida do Form

```
Preenchimento site
       ↓
POST /webhooks/formularios
       ↓
Form criado (NOT_CONVERTED)
       ↓
Lead upsertado por phone
       ↓
WhatsApp enviado → ConversionMessage criado
       ↓
Vendedor cria pedido
       ↓
Form atualizado para CONVERTED
       ↓  (ou via PATCH manual)
SUPERVISOR muda status manualmente
```

**Quando Form vira CONVERTED via criação de pedido:**

No serviço de orders (`POST /api/orders`):
1. Busca form das últimas 24h para o `phone`
2. Se existe e não está CONVERTED → atualiza para CONVERTED
3. Se não existe → cria Form com `type=MANUAL`, `status=CONVERTED`
4. Linka o pedido ao form via `formId`

---

## Relacionamentos

- **Form → Order** (1:N): Um form pode gerar múltiplos pedidos; cada pedido referencia um `formId`
- **Form → ConversionMessage** (1:N): Rastreia mensagens WhatsApp enviadas (cascade delete)
- **Form → Lead**: Por `phone`; o webhook upserta o Lead automaticamente

---

## Permissões

| Ação | Roles |
|------|-------|
| Criar form (webhook) | Público (sem auth) |
| Listar forms (tabela) | Qualquer usuário autenticado |
| Consultar form por phone | Público (sem auth) |
| Atualizar status | `SUPERVISOR`, `ADMIN`, `OWNER` |

---

## Arquivos de Referência

Para detalhes completos, consultar:
- **`references/api-reference.md`** — Contratos completos dos endpoints, tipos TypeScript, exemplos de request/response
- **`references/business-logic.md`** — Regras de negócio detalhadas: deduplicação, lógica de isCustomer, integração com pedidos e campanhas Google Ads
