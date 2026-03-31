---
name: forms-frontend
description: Este skill deve ser utilizado quando for necessário entender, criar, modificar ou remover qualquer interface, componente ou lógica de UI relacionada ao sistema de formulários do Sistema Flores Nobre. Ativadores: "página de formulários", "tabela de formulários", "filtros de formulários", "componente de form", "dashboard de conversão", "atualizar status na tabela", "adicionar coluna na tabela de forms", "novo filtro nos formulários", "métricas de conversão front-end", "FormTable", "FormFilters", "FormsPage", "form-table.tsx", "form-filters.tsx", "página de formulários recebidos", "formularios do site", "taxa de conversão front-end". Para contexto de back-end e contratos de API, utilizar o skill "forms" em conjunto.
version: 1.0.0
---

# Forms Frontend — Interfaces e Componentes

Este skill cobre toda a camada de UI do sistema de formulários, localizada em `src/app/(app)/dashboard/formularios/`. É a tela onde os times de vendas acompanham e gerenciam os eventos de conversão vindos do site.

## Quando usar este skill

- Adicionar ou remover colunas na tabela de formulários
- Criar ou modificar filtros do painel
- Atualizar as métricas exibidas na página
- Corrigir bugs de renderização, seleção ou paginação na tabela
- Integrar um novo campo do back-end na UI
- Alterar as permissões de visibilidade de ações na tabela
- Criar uma nova página ou subpágina dentro do módulo de formulários
- Entender como os dados chegam do back-end e são exibidos

> Para contratos de API, modelo de dados, regras de negócio e endpoints, usar o skill **"forms"** em conjunto.

---

## Mapa de Arquivos

```
src/app/(app)/dashboard/formularios/
├── page.tsx                         # Página principal — métricas + layout
├── utils.ts                         # getDatePeriodMessage, buildFilters
└── _components/
    ├── form-table.tsx               # Tabela de formulários com paginação
    └── form-filters.tsx             # Painel de filtros (Sheet lateral)
```

---

## Componente: `FormsPage` (page.tsx)

Componente Client (`"use client"`). É o orquestrador da página — gerencia estado de filtros, faz os fetches e distribui dados para os filhos.

### Estado principal

```typescript
const [filterOptions, setFilterOptions] = useState<FormFilterOptions>({
  isCustomer: "" as any,
  createdAtStart: DateTime.now().startOf("day").toISO(), // padrão: hoje
  createdAtEnd: "",
  status: "" as any,
  name: "", email: "", phone: "",
  sellers: [],
});
```

**Padrão inicial:** exibe apenas formulários do dia atual.

### Queries (React Query)

| queryKey | Endpoint | Propósito |
|----------|----------|-----------|
| `["forms", filterOptions]` | `GET /api/tables/forms` | Lista de forms filtrados |
| `["sellers"]` | `GET /api/users?role=SELLER,SUPERVISOR` | Nomes dos vendedores para exibição |

Os filtros são transformados antes do fetch via `buildFilters(filterOptions)`.

### Métricas (calculadas client-side)

```typescript
const metrics = useMemo(() => {
  const total = filteredForms.length;
  const converted = filteredForms.filter(f => f.status === FormStatus.CONVERTED).length;
  const conversionTax = total > 0 ? (converted / total) * 100 : 0;
  return { total, converted, conversionTax };
}, [filteredForms]);
```

Três cards exibem: **Total**, **Convertidos**, **Taxa de Conversão** (com barra de progresso animada).

### Props passadas aos filhos

```typescript
// FormFilters recebe:
sellers={sellers || []}
onApplyFilter={setFilterOptions}
initialFilters={filterOptions}

// FormTable recebe:
forms={filteredForms || []}
sellerNames={new Map(sellers?.filter(s => s.helenaId).map(s => [s.helenaId!, s.name]))}
```

**`sellerNames`** é um `Map<helenaId, name>` usado pela tabela para resolver o nome do vendedor via `form.sellerHelenaId`.

### Loading state

Exibe `<FormsPageSkeleton />` (3 cards + header em skeleton) enquanto o fetch inicial não conclui.

---

## Componente: `FormTable` (form-table.tsx)

Tabela paginada com seleção múltipla, ações inline e variante skeleton.

### Interface de Props

```typescript
interface LeadTableProps {
  forms: FormTableItem[];
  itemsPerPageOptions?: number[];  // padrão: [10, 25, 50, 100]
  defaultItemsPerPage?: number;    // padrão: 25
  sellerNames: Map<string, string>; // Map<helenaId, nome>
}
```

### Colunas da Tabela

| Coluna | Dado | Observação |
|--------|------|------------|
| Checkbox | seleção | Select-all com estado indeterminate |
| Nome | `form.name` | Sempre em negrito |
| Contato | `form.email` + `form.phone` | Phone formatado via `formatPhoneInput()` |
| Vendedor | `sellerNames.get(form.sellerHelenaId)` | "Não Atendido" (itálico) se não atribuído |
| Motivo | `form.cancelReason` | Truncado (max-w-50), tooltip com valor completo no `title` |
| Tipo | `form.isCustomer` | `true` → badge "Lead"; `false` → badge "Cliente" |
| Criado Em | `form.createdAt` | `toLocaleString("pt-BR")` com dia/mês/ano/hora/minuto |
| Status | `form.status` | Select (supervisores) ou badge colorido (demais) |
| Ações | chat | Botão de chat para Helena (desabilitado se sem sessionId) |

### Lógica de Permissão de Status

```typescript
const canUpdateStatus = canPerformAction([Role.SUPERVISOR], session?.user.role as Role);
```

`canPerformAction` verifica se o role do usuário está na lista. `SUPERVISOR`, `ADMIN` e `OWNER` têm acesso — atenção: `canPerformAction` é hierárquico, roles superiores herdam permissão.

**Com permissão:** `<Select>` inline que chama `PATCH /api/forms/{id}`.
**Sem permissão:** badge estático com cor correspondente.

### Cores dos Badges de Status

| Status | Classes |
|--------|---------|
| `NOT_CONVERTED` | `bg-warning/15 text-warning border-warning/30` |
| `CONVERTED` | `bg-success/15 text-success border-success/30` |
| `CANCELLED` | `bg-destructive/15 text-destructive border-destructive/30` |

### Mutation de Status

```typescript
const { mutate: updateStatus } = useMutation({
  mutationFn: ({ id, status }) => axios.patch(`/api/forms/${id}`, { status }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forms"] }),
});
```

Invalida `["forms"]` no sucesso, forçando re-fetch automático.

### Paginação (client-side)

Paginação é feita localmente sobre o array `forms` já filtrado pelo servidor.

```typescript
const totalPages = Math.ceil(forms.length / itemsPerPage);
const currentForms = forms.slice(startIndex, endIndex);
```

Controles: primeira/última página, anterior/próxima, até 5 botões de número de página com janela deslizante. Seletor de itens por página no rodapé (10, 25, 50, 100).

### Botão de Chat

```typescript
onClick={() => window.open(
  "https://web.helena.run/chat2/sessions/" + form.conversionMessages[0].sessionId
)}
disabled={!form.conversionMessages[0]?.sessionId}
```

Abre a sessão do chat na Helena em nova aba. Desabilitado se o form não possui `ConversionMessage` com `sessionId`.

### Variante Skeleton

```typescript
FormTable.Skeleton = ({ rows = 5 }: { rows?: number }) => { ... }
```

Uso: `<FormTable.Skeleton rows={10} />` — renderiza a mesma estrutura da tabela com Skeletons em vez de dados.

---

## Componente: `FormFilters` (form-filters.tsx)

Painel de filtros em `<Sheet>` lateral (lado direito), acionado por botão "Abrir Filtros".

### Interface de Props

```typescript
interface FormFiltersProps {
  onApplyFilter: (data: FormFilterOptions) => void;
  initialFilters: FormFilterOptions;
  sellers: User[];  // lista de User do Prisma com id e name
}
```

### Campos do Formulário

| Campo | Componente | Tipo de Valor | Observação |
|-------|-----------|--------------|------------|
| Já comprou? | `<Select>` | boolean | "true"/"false"/"none" — converte para boolean |
| Status | `<Select>` | `FormStatus` | NOT_CONVERTED, CONVERTED, CANCELLED |
| Nome | `<Input>` | string | busca parcial |
| Email | `<Input>` | string | busca parcial |
| Telefone | `<Input>` | string | busca parcial |
| Vendedores | `<Combobox multiple>` | string[] | IDs dos usuários |
| Data Início | `<Input type="date">` | ISO string | converte via Luxon, início do dia |
| Data Fim | `<Input type="date">` | ISO string | converte via Luxon, `.endOf("day")` |

**Comportamento do Sheet:** fecha automaticamente via `useEffect(() => setOpen(false), [initialFilter])` quando novos filtros são aplicados.

**Limpeza antes de enviar:** valores `""`, `"none"` ou arrays vazios são removidos do objeto antes de chamar `onApplyFilter`.

### Combobox de Vendedores

Usa o componente customizado `<Combobox>` em modo `multiple`. Recebe `sellers: User[]` e utiliza `item.id` como value. A tabela, por sua vez, usa `helenaId` para exibição — **atenção:** o filtro de sellers na API ainda não está implementado no back-end.

---

## Utilitários (utils.ts)

### `getDatePeriodMessage(dataInicio?, dataFim?)`

Gera mensagem descritiva do período exibido no header da página.

| Situação | Retorno |
|----------|---------|
| Hoje | `"Formularios de Hoje"` |
| Ontem (mesmo dia) | `"Formularios de Ontem"` |
| Dia específico | `"Formularios do dia DD/MM/AAAA"` |
| Desde ontem | `"Formularios desde ontem"` |
| Últimos N dias | `"Formularios nos últimos N dias"` |
| Intervalo | `"Formularios entre DD/MM - DD/MM"` |
| Sem filtro de data | `""` |

### `buildFilters(filterOptions)`

Serializa o objeto de filtros para query params do axios.

- Arrays → `join(",")` (ex: `["a","b"]` → `"a,b"`)
- Sets → `Array.from(set).join(",")`
- Arrays vazios, valores falsy → removidos

---

## Fluxo de Dados

```
Usuário abre /dashboard/formularios
         ↓
FormsPage monta com filtro padrão (hoje)
         ↓
React Query: GET /api/tables/forms?createdAtStart=...
         ↓
filteredForms → métricas calculadas via useMemo
         ↓
FormTable recebe forms + sellerNames
         ↓
Usuário abre filtros → FormFilters (Sheet)
         ↓
Aplica filtros → setFilterOptions → React Query re-fetch
         ↓
Supervisor muda status → PATCH /api/forms/{id}
         ↓
invalidateQueries(["forms"]) → tabela atualiza
```

---

## Referências Detalhadas

- **`references/components-api.md`** — Props completas, estados internos e padrões de extensão de cada componente
- **`references/patterns.md`** — Como adicionar colunas, filtros, métricas e permissões seguindo os padrões do módulo
