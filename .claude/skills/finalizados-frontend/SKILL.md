---
name: finalizados-frontend
description: Contexto completo do front-end da página de pedidos finalizados — componentes, filtros, tabela, página de detalhes, métricas, queries React Query, mutations e navegação. Use quando precisar entender, modificar ou estender qualquer parte da interface de /dashboard/finalizados.
disable-model-invocation: false
user-invocable: true
argument-hint: [contexto]
allowed-tools: Read, Grep, Glob, Bash
---

# Front-end — Pedidos Finalizados

Cobre toda a interface de `/dashboard/finalizados`: página principal com métricas e tabela, painel lateral de filtros, e página de detalhes do pedido.

---

## Estrutura de Arquivos

```
src/app/(app)/dashboard/finalizados/
├── page.tsx                         # Client Component — métricas + orquestração
├── utils.ts                         # buildFilters, getDatePeriodMessage
├── _components/
│   ├── completed-filters.tsx        # Sheet lateral de filtros (react-hook-form)
│   └── completed-table.tsx          # Tabela paginada com seleção em lote
└── [id]/
    └── page.tsx                     # Server Component — detalhes completos do pedido
```

**Suporte:**
- `src/modules/orders/dtos/completed-order-table.dto.ts` — Schema Zod dos filtros + tipo `CompletedFilterOptions`
- `src/app/api/tables/completed-orders/route.ts` — API GET + PATCH

---

## Página Principal (`page.tsx`)

**Tipo:** Client Component (`"use client"`)

### Estado Local

```typescript
const [filterOptions, setFilterOptions] = useState<CompletedFilterOptions>({
  createdAtStart: DateTime.now().startOf("day").toISO(), // padrão: hoje
  createdAtEnd: "",
  idOrder: "",
  canceledOrders: "",
  paidStatus: "",
  paidAtStart: "",
  paidAtEnd: "",
  supplierPaymentStatus: "",
  contact: "",
  contactType: "",
  contactOrigin: "",
  taxId: "",
  sellers: [],
  suppliers: [],
  product: "",
  coverageAreaStart: "",
  coverageAreaEnd: "",
});
```

O estado inicial carrega só pedidos do dia atual (via `createdAtStart`).

### Queries

```typescript
// Pedidos finalizados — re-executa ao mudar filterOptions
const { data: orders, isPending } = useQuery<CompletedOrderItem[]>({
  queryKey: ["orders", "completed", filterOptions],
  queryFn: () =>
    axios.get("/api/tables/completed-orders", {
      params: buildFilters(filterOptions),
    }).then((r) => r.data.data),
});

// Vendedores (Role.SELLER + Role.SUPERVISOR)
const { data: sellers } = useQuery<User[]>({
  queryKey: ["sellers"],
  queryFn: () =>
    axios.get("/api/users", { params: { role: [Role.SELLER, Role.SUPERVISOR] } })
      .then((r) => r.data.data),
});

// Fornecedores
const { data: suppliers } = useQuery<SupplierOption[]>({
  queryKey: ["suppliers"],
  queryFn: () => axios.get("/api/suppliers").then((r) => r.data.data),
});
```

### Métricas Calculadas (em tempo real sobre `orders`)

| Métrica | Fórmula |
|---------|---------|
| `total` | `orders.length` |
| `totalVendas` | `sum(order.amount)` |
| `totalCusto` | `sum(order.cost)` |
| `ticketMedio` | `totalVendas / total` |
| `lucroMedio` | `(totalVendas - totalCusto) / diasUteisUnicos` |
| `repasse` | `(totalCusto / totalVendas) * 100` |

**Dias úteis únicos** — apenas pedidos criados entre 9h–17h, agrupados por `toISODate()`:

```typescript
const uniqueWorkDays = new Set(
  orders
    .map((o) => {
      const date = DateTime.fromISO(o.createdAt);
      if (date.hour < 9 || date.hour > 17) return null;
      return date.toISODate();
    })
    .filter(Boolean),
);
const lucroMedio = uniqueWorkDays.size > 0 ? profit / uniqueWorkDays.size : 0;
```

### Layout

- 6 cards de métricas em grid responsivo (`grid-cols-2 md:grid-cols-3`)
- Título dinâmico via `getDatePeriodMessage(createdAtStart, createdAtEnd)`
- Botão "Abrir Filtros" abre o `CompletedFilters` (Sheet)
- `CompletedTable` recebe `orders` + `queryKey` + sellers/suppliers

---

## Filtros (`completed-filters.tsx`)

**Tipo:** Client Component — abre em um `Sheet` (modal lateral à direita)

### Interface de Props

```typescript
interface FormFiltersProps {
  onApplyFilter: (data: CompletedFilterOptions) => void;
  initialFilters: CompletedFilterOptions;
  sellers: User[];
  suppliers: SupplierOption[];
}
```

### Campos do Formulário (15 filtros)

| Campo | Tipo | Filtro |
|-------|------|--------|
| Data início criação | `<input type="date">` | `createdAtStart` |
| Data fim criação | `<input type="date">` | `createdAtEnd` |
| ID do pedido | `<Input>` | `idOrder` |
| Pedidos cancelados | `<Select>` | `canceledOrders` ("true"/"false") |
| Status pagamento cliente | `<Select>` enum `PaymentStatus` | `paidStatus` |
| Data início pagamento | `<input type="date">` | `paidAtStart` |
| Data fim pagamento | `<input type="date">` | `paidAtEnd` |
| Status pagamento fornecedor | `<Select>` enum `SupplierPaymentStatus` | `supplierPaymentStatus` |
| Contato (nome/email/tel) | `<Input>` | `contact` |
| Tipo de contato | `<Select>` enum `PersonType` | `contactType` |
| Origem do contato | `<Select>` enum `ContactOrigin` | `contactOrigin` |
| CPF/CNPJ | `<Input>` | `taxId` |
| Vendedores | `<MultiSelect>` | `sellers` (array de IDs) |
| Fornecedores | `<MultiSelect>` | `suppliers` (array de IDs) |
| Produto | `<Input>` | `product` |
| CEP início | `<Input>` c/ máscara | `coverageAreaStart` |
| CEP fim | `<Input>` c/ máscara | `coverageAreaEnd` |

### Comportamentos Importantes

**Máscara de CEP:**
```typescript
function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}
```

**Conversão de datas** — input `yyyy-MM-dd` ↔ ISO string:
```typescript
// Leitura
value: DateTime.fromISO(field.value).toFormat("yyyy-MM-dd")

// escrita (createdAtEnd usa .endOf("day"))
onChange: (e) =>
  field.onChange(
    e.target.value
      ? DateTime.fromFormat(e.target.value, "yyyy-MM-dd").endOf("day").toISO()
      : ""
  )
```

**Submit — filtra valores vazios e "none":**
```typescript
const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
  if (value && value !== "none" && (Array.isArray(value) ? value.length > 0 : true)) {
    acc[key as keyof CompletedFilterOptions] = value;
  }
  return acc;
}, {} as CompletedFilterOptions);

onApplyFilter(filteredData);
setOpen(false);
```

---

## Tabela (`completed-table.tsx`)

**Tipo:** Client Component

### Interface de Props

```typescript
interface CompletedTableProps {
  orders: CompletedOrderItem[];
  queryKey: unknown[];
  itemsPerPageOptions?: number[];    // padrão: [10, 25, 50, 100]
  defaultItemsPerPage?: number;      // padrão: 25
}
```

### CompletedOrderItem

```typescript
export interface CompletedOrderItem {
  id: string;
  supplierName: string;
  contactName: string;
  sellerName: string;
  amount: number;
  cost: number;
  createdAt: string;                 // ISO
  paymentStatus: PaymentStatus;
  supplierPaymentStatus: SupplierPaymentStatus;
}
```

### Colunas (9)

| # | Header | Conteúdo |
|---|--------|---------|
| 1 | Checkbox | Seleção individual / select-all |
| 2 | Fornecedor | `order.supplierName` |
| 3 | Cliente | `order.contactName` |
| 4 | Vendedor | `order.sellerName` (italic se "Não Atribuído") |
| 5 | Valor | `formatCurrency(order.amount)` |
| 6 | Custo | `formatCurrency(order.cost)` |
| 7 | Data | `new Date(createdAt).toLocaleDateString("pt-BR")` |
| 8 | Pagamento | Badge dupla: ícone User (cliente) + ícone Store (fornecedor) |
| 9 | Ações | Dropdown: Ver Detalhes, Editar Pedido, Exportar |

### Cores dos Badges de Pagamento

**Cliente (`PaymentStatus`):**
```typescript
PAID        → "bg-success/15 text-success"
ACTIVE      → "bg-primary/15 text-primary"
PROCESSING  → "bg-warning/15 text-warning"
CANCELLED   → "bg-destructive/15 text-destructive"
default     → "bg-muted text-muted-foreground"
```

**Fornecedor (`SupplierPaymentStatus`):**
```typescript
PAID    → "bg-success/15 text-success"
WAITING → "bg-destructive/15 text-destructive"
default → "bg-muted text-muted-foreground"
```

### Seleção Múltipla

```typescript
const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

const allSelected = orders.length > 0 && orders.length === selectedOrders.length;
const isIndeterminate = !allSelected && selectedOrders.length > 0;

// Select All
const handleSelectAll = (isChecked: CheckedState) => {
  if (isChecked === true) setSelectedOrders(orders.map((o) => o.id));
  else setSelectedOrders([]);
};
```

### Mutation — Atualizar Pagamento ao Fornecedor em Lote

```typescript
const updateSupplierPayment = useMutation({
  mutationFn: (params: {
    orderIds: string[];
    supplierPaymentStatus: SupplierPaymentStatus;
  }) => axios.patch("/api/tables/completed-orders", params).then((r) => r.data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey });
    setSelectedOrders([]);
  },
});

// Botões no toolbar (habilitados só quando selectedOrders.length > 0)
// "Marcar como Pago"    → SupplierPaymentStatus.PAID
// "Marcar como Não Pago" → SupplierPaymentStatus.WAITING
```

`updateSupplierPayment.isPending` desabilita os botões durante a requisição.

### Paginação (client-side)

```typescript
const totalPages = Math.ceil(orders.length / itemsPerPage);
const currentOrders = orders.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage,
);
```

Controles: primeira página, anterior, próxima, última + seletor de itens por página.

### Estados Especiais

- **Skeleton:** `CompletedTable.Skeleton = ({ rows = 5 }) => ...` — renderiza linhas de skeleton
- **Vazio:** ícone `Inbox` + "Nenhum registro encontrado"

---

## Página de Detalhes (`[id]/page.tsx`)

**Tipo:** Server Component assíncrono — lê diretamente do Prisma.

### Query Prisma

```typescript
const order = await prisma.order.findUnique({
  where: { id },
  include: {
    user: { select: { id, name } },
    contact: { include: { city: true } },
    city: true,
    orderProducts: {
      include: {
        variant: {
          include: { product: { select: { name, basePrice } } }
        }
      }
    },
    payments: { orderBy: { createdAt: "desc" } },
    supplierPanels: {
      include: {
        supplier: { select: { name } },
        supplierPanelPhotos: { orderBy: { createdAt: "desc" } }
      },
      orderBy: { createdAt: "desc" }
    }
  }
});
```

### Seções da Página

| Seção | Campos |
|-------|--------|
| **Header** | `#NOBRE{ultimos6digitos}`, badge status, data, vendedor |
| **Detalhes** | Homenageado, remetente, frase cartão, origem contato, pedido aguardado, notas, ID WooCommerce |
| **Entrega** | Data/período, CEP, endereço, bairro, complemento, cidade/UF |
| **Contato** | Nome, telefone, email, tipo pessoa, CPF/CNPJ, razão social (PJ), IE (PJ), endereço, cidade |
| **Produtos** | Grid com imagem thumbnail, nome, variante (tamanho/cor), preço, quantidade |
| **Pagamentos** | Tipo (icon), badge "Site", status, datas, link comprovante, valor bruto/líquido |
| **Fornecedor** | Custo + frete = total, recebedor, data entregue, motivo cancelamento, badge pagamento |
| **Fotos** | Grid de fotos por painel, status badge, razão rejeição, link nova aba |

### Helpers de Status → Variante do Badge

```typescript
orderStatusVariant(status)        → "success" | "warning" | "destructive"
paymentStatusVariant(status)      → "success" | "warning" | "destructive"
supplierPanelStatusVariant(status) → "success" | "warning" | "destructive"
photoStatusVariant(status)        → "success" | "warning" | "destructive"
```

### Formatações Usadas

| Dado | Função | Resultado |
|------|--------|-----------|
| Data/hora | `format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })` | `31/03/2026 às 14:30` |
| Moeda | `formatBRL(value)` | `R$ 1.234,56` |
| Telefone | `formatPhoneInput(value)` | `+55 (11) 98765-4321` |
| CPF | `formatCPFInput(value)` | `123.456.789-10` |
| CNPJ | `formatCNPJInput(value)` | `12.345.678/0001-90` |
| CEP | `formatZipCodeInput(value)` | `12345-678` |

---

## Utilitários (`utils.ts`)

### `buildFilters`

Prepara o objeto de filtros para query params. Remove valores falsy, converte arrays para CSV:

```typescript
export const buildFilters = (filterOptions: Record<string, any>) => {
  return Object.fromEntries(
    Object.entries(filterOptions)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return value.length ? [key, value.join(",")] : [key, undefined];
        }
        return [key, value];
      })
      .filter(([_, value]) => value),
  );
};
```

### `getDatePeriodMessage`

Retorna string humanizada para o título da página:
- `"Formulários de Hoje"` / `"Formulários de Ontem"`
- `"Formulários entre XX/XX/XXXX - XX/XX/XXXX"`
- `"Formulários nos últimos N dias"`

---

## Navegação

| De | Para | Como |
|----|------|------|
| `/dashboard/finalizados` | `/dashboard/finalizados/{id}` | Dropdown → "Ver Detalhes" |
| `/dashboard/finalizados` | `/pedidos/{id}` | Dropdown → "Editar Pedido" |
| `/dashboard/finalizados/{id}` | `/dashboard/finalizados` | Botão voltar (ArrowLeft) |

---

## Dependências-chave

| Lib | Uso |
|-----|-----|
| `@tanstack/react-query` | Queries (orders, sellers, suppliers) + mutation (patch payment) |
| `axios` | HTTP client |
| `luxon` | Manipulação de datas (DateTime) |
| `react-hook-form` + `Controller` | Formulário de filtros |
| `lucide-react` | Ícones (ArrowLeft, Inbox, User, Store…) |
| `next/link` | Navegação entre rotas |
| `next/image` | Thumbnails de produtos e fotos |

**Componentes shadcn usados:** Button, Input, Label, Select, Sheet, MultiSelect, Table, Checkbox, DropdownMenu, Skeleton, Badge

---

## Mapa de Arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `finalizados/page.tsx` | Orquestração, métricas, estado dos filtros, queries |
| `finalizados/utils.ts` | `buildFilters`, `getDatePeriodMessage` |
| `finalizados/_components/completed-filters.tsx` | Sheet de filtros (react-hook-form) |
| `finalizados/_components/completed-table.tsx` | Tabela com seleção, paginação, mutation em lote |
| `finalizados/[id]/page.tsx` | Server Component com detalhes completos do pedido |
| `src/modules/orders/dtos/completed-order-table.dto.ts` | Schema Zod + tipo `CompletedFilterOptions` |
| `src/app/api/tables/completed-orders/route.ts` | API GET (filtros) + PATCH (pagamento fornecedor) |
| `src/lib/utils.ts` | `formatBRL`, `formatPhoneInput`, `formatCPFInput`, `formatCNPJInput`, `formatZipCodeInput`, maps de enums |

---

## Regras Importantes

- **Não há Zustand** nessa página — filtros vivem em `useState` local em `page.tsx` e são passados via props
- **Paginação é client-side** — toda a lista é carregada e fatiada no front
- **Métricas são derivadas** dos dados já carregados, sem chamada extra ao servidor
- **`queryKey` inclui `filterOptions`** — qualquer mudança de filtro dispara novo fetch automaticamente
- **`buildFilters` remove falsy** antes de enviar — evita query params desnecessários
- **Server Component no `[id]`** — usa Prisma diretamente, sem TanStack Query
- Sempre usar enums importados de `@/generated/prisma/enums` (nunca strings diretas)
- Moeda: sempre `formatBRL()` de `src/lib/utils.ts`
