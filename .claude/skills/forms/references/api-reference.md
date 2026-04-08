# Forms — Referência Completa da API

## Tipos TypeScript

```typescript
// src/modules/form/form.dto.ts
import { Prisma } from "@/generated/prisma/client";

export type FormTableItem = Prisma.FormGetPayload<{
  include: { conversionMessages: true };
}>;

// src/app/api/forms/query-form.dto..ts
export type QueryFormType = {
  name?: string;
  phone?: string;
  email?: string;
};
```

```typescript
// src/modules/form/form-table.dto.ts
import { FormStatus } from "@/generated/prisma/enums";
import z from "zod";

export const formFilterOptionsSchema = z.object({
  status: z.enum(FormStatus).optional(),
  createdAtStart: z.string().optional(),
  createdAtEnd: z.string().optional(),
  isCustomer: z.boolean().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  sellers: z.array(z.string()).optional(),
});

export type FormFilterOptions = z.infer<typeof formFilterOptionsSchema>;
```

---

## Endpoint 1: POST /api/webhooks/formularios

**Arquivo:** `src/app/api/webhooks/formularios/route.ts`
**Auth:** Nenhuma (pública, CORS `*`)

### Headers CORS

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: *
```

Implementar também `OPTIONS` retornando `204` com os headers CORS.

### Request Body (raw JSON)

```typescript
{
  name: string;          // mínimo 2 chars após trim
  email: string;         // formato e-mail válido
  phone: string;         // 12–13 dígitos numéricos exatos
  sourceData?: string;   // canal de origem livre (ex: "google", "instagram")
  campaignData?: string | {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    gad_source?: string;
    gad_campaignid?: string;
    gbraid?: string;
    gclid?: string;
    wbraid?: string;
  };
}
```

> `campaignData` pode chegar como string JSON (sites legados) ou como objeto — o webhook parseia ambos.

### Respostas

| Situação | Status | Body |
|----------|--------|------|
| Criado com sucesso | 201 | `{ message: "Formulario registrado com sucesso" }` |
| Duplicata 24h | 200 | `{ message: "Já preencheu formulario" }` |
| Validação falha | 400 | `{ error: "mensagem específica" }` |
| Erro interno | 500 | `{ error: "Algo deu errado. Contate o suporte" }` |

### Erros de validação possíveis

- `"Informe o nome completo"` — name vazio ou < 2 chars
- `"Email valido"` — email ausente ou inválido
- `"Telefone invalido"` — phone não corresponde a `/^\d{12,13}$/`

---

## Endpoint 2: GET /api/forms

**Arquivo:** `src/app/api/forms/route.ts`
**Auth:** Nenhuma (pública)

### Query Params

| Param | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| `phone` | string | sim | mínimo 8 chars |

### Lógica de Resolução

```
1. Busca Form onde phone = params.phone AND createdAt > now - 24h
2. Se encontrado → retorna { name, email, phone } do Form
3. Se não → busca Contact onde phone = params.phone
4. Retorna { name, phone, email } do Contact (campos podem ser undefined)
```

### Resposta

```json
{
  "data": {
    "name": "João Silva",       // pode ser undefined
    "email": "joao@email.com",  // pode ser undefined
    "phone": "5511999999999"    // pode ser undefined
  }
}
```

**Uso típico:** Chamado pelo front-end quando o operador digita um telefone num formulário de criação de pedido para pré-popular nome e e-mail automaticamente.

---

## Endpoint 3: PATCH /api/forms/{id}

**Arquivo:** `src/app/api/forms/[id]/route.ts`
**Auth:** Requerida. Roles permitidas: `SUPERVISOR`, `ADMIN`, `OWNER`

### Route Params

| Param | Tipo | Descrição |
|-------|------|-----------|
| `id` | string | ID cuid() do Form |

### Request Body

```json
{ "status": "CONVERTED" }
```

Valores válidos: `"NOT_CONVERTED"` | `"CONVERTED"` | `"CANCELLED"`

### Resposta de Sucesso (200)

```json
{
  "data": {
    "id": "clxxx...",
    "type": "FORM_FN",
    "status": "CONVERTED",
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "5511999999999",
    "sellerHelenaId": null,
    "source": "google",
    "isCustomer": true,
    "cancelReason": null,
    "createdAt": "2024-03-15T10:00:00.000Z"
  }
}
```

### Erros

| Situação | Status | Mensagem |
|----------|--------|----------|
| Role insuficiente | 403 | `"Usuário sem permissão para atualizar status"` |
| Form não encontrado | 404 | (Prisma lança automaticamente) |
| Status inválido | 400 | (Zod valida automaticamente) |

---

## Endpoint 4: GET /api/tables/forms

**Arquivo:** `src/app/api/tables/forms/route.ts`
**Auth:** Requerida (qualquer role autenticada)

### Query Params

| Param | Tipo | Filtro Prisma |
|-------|------|---------------|
| `status` | `FormStatus` | `{ status: valor }` (exato) |
| `createdAtStart` | string ISO | `{ createdAt: { gte: new Date(valor) } }` |
| `createdAtEnd` | string ISO | `{ createdAt: { lte: new Date(valor) } }` |
| `name` | string | `{ name: { contains: valor, mode: "insensitive" } }` |
| `email` | string | `{ email: { contains: valor, mode: "insensitive" } }` |
| `phone` | string | `{ phone: { contains: valor, mode: "insensitive" } }` |
| `sellers` | string[] | ⚠️ Aceito pelo schema, mas **não aplicado na query atual** |
| `isCustomer` | boolean | ⚠️ Aceito pelo schema, mas **não aplicado na query atual** |

> **Atenção:** Os filtros `sellers` e `isCustomer` estão no schema Zod mas não foram implementados na query Prisma. Ao implementar, adicionar `where.isCustomer = searchParams.isCustomer` e equivalente para sellers.

### Resposta

```typescript
{
  "data": Array<{
    id: string;
    type: FormType;
    status: FormStatus;
    name: string;
    email: string;
    phone: string;
    sellerHelenaId: string | null;
    source: string | null;
    isCustomer: boolean | null;
    cancelReason: string | null;
    createdAt: string; // ISO datetime
    conversionMessages: Array<{
      id: string;
      externalId: string;
      type: ConversionMessageType;
      formId: string;
      sessionId: string | null;
      createdAt: string;
    }>;
  }>
}
```

### Exemplo de chamada (front-end com React Query)

```typescript
const { data } = useQuery({
  queryKey: ["forms", filters],
  queryFn: async () => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.createdAtStart) params.set("createdAtStart", filters.createdAtStart);
    if (filters.createdAtEnd) params.set("createdAtEnd", filters.createdAtEnd);
    if (filters.name) params.set("name", filters.name);
    const res = await fetch(`/api/tables/forms?${params.toString()}`);
    return res.json();
  },
});
```

---

## Estrutura de Arquivos Relevantes

```
src/
├── app/
│   ├── api/
│   │   ├── forms/
│   │   │   ├── route.ts                    # GET por phone
│   │   │   ├── query-form.dto..ts          # QueryFormType
│   │   │   └── [id]/
│   │   │       └── route.ts                # PATCH status
│   │   ├── tables/
│   │   │   └── forms/
│   │   │       └── route.ts                # GET listagem tabela
│   │   └── webhooks/
│   │       └── formularios/
│   │           └── route.ts                # POST webhook do site
│   └── (app)/dashboard/formularios/
│       ├── page.tsx                        # Página com métricas
│       ├── utils.ts                        # getDatePeriodMessage, buildFilters
│       └── _components/
│           ├── form-table.tsx              # Tabela com ações e paginação
│           └── form-filters.tsx            # Filtros do dashboard
└── modules/
    ├── form/
    │   ├── form.dto.ts                     # FormTableItem type
    │   └── form-table.dto.ts               # formFilterOptionsSchema
    └── conversions/
        └── conversion.service.ts           # sendInitialTemplate()
```
