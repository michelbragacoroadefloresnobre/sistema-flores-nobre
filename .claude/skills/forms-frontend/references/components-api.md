# Forms Frontend — API de Componentes

## FormsPage (`page.tsx`)

### Estado completo

```typescript
// Estado de filtros — compartilhado com FormFilters e QueryKey
const [filterOptions, setFilterOptions] = useState<FormFilterOptions>({
  isCustomer: "" as any,       // boolean | "" (vazio = sem filtro)
  createdAtStart: DateTime.now().startOf("day").toISO(), // ISO string
  createdAtEnd: "",            // ISO string | ""
  status: "" as any,           // FormStatus | ""
  name: "",
  email: "",
  phone: "",
  sellers: [],                 // string[] de IDs de User
});
```

### Dependências externas

| Import | De onde vem | Para que serve |
|--------|-------------|----------------|
| `useQuery` | `@tanstack/react-query` | Fetch de dados |
| `FormStatus`, `Role`, `User` | `@/generated/prisma/browser` | Tipos Prisma (client-safe) |
| `FormTableItem` | `@/modules/form/form.dto` | Tipo da lista de forms |
| `axios` | `axios` | HTTP client |
| `DateTime` | `luxon` | Manipulação de datas |
| `FormFilters`, `FormFilterOptions` | `./_components/form-filters` | Componente + tipo de filtros |
| `FormTable` | `./_components/form-table` | Componente de tabela |
| `buildFilters`, `getDatePeriodMessage` | `./utils` | Utilitários |

### Como os vendedores são resolvidos

```typescript
// 1. Query busca sellers com roles SELLER e SUPERVISOR
const { data: sellers } = useQuery<User[]>({
  queryKey: ["sellers"],
  queryFn: () => axios.get("/api/users", { params: { role: [Role.SELLER, Role.SUPERVISOR] } })
    .then(res => res.data.data),
});

// 2. Map helenaId → name (apenas users com helenaId)
const sellerNames = new Map(
  sellers?.filter(s => s.helenaId).map(s => [s.helenaId!, s.name]) || []
);
// sellerNames é passado para FormTable
```

---

## FormTable (`_components/form-table.tsx`)

### Props

```typescript
interface LeadTableProps {
  forms: FormTableItem[];
  itemsPerPageOptions?: number[];  // default: [10, 25, 50, 100]
  defaultItemsPerPage?: number;    // default: 25
  sellerNames: Map<string, string>; // Map<helenaId, nomeDoVendedor>
}
```

### Estado interno

```typescript
const [selectedLeads, setSelectedLeads] = useState<string[]>([]); // IDs selecionados
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
```

### Dependências externas

| Import | De onde vem | Para que serve |
|--------|-------------|----------------|
| `authClient` | `@/lib/auth/client` | Obtém sessão do usuário atual |
| `canPerformAction` | `@/lib/utils` | Verifica permissão de role |
| `formatPhoneInput` | `@/lib/utils` | Formata telefone para exibição |
| `cn` | `@/lib/utils` | Merge de classes Tailwind |
| `FormTableItem` | `@/modules/form/form.dto` | Tipo que inclui conversionMessages |
| `useMutation`, `useQueryClient` | `@tanstack/react-query` | Atualização de status |

### Verificação de permissão

```typescript
const { data: session } = authClient.useSession();
// canPerformAction é hierárquico: SUPERVISOR, ADMIN, OWNER têm acesso
const canUpdateStatus = canPerformAction([Role.SUPERVISOR], session?.user.role as Role);
```

> **Atenção:** Apesar da lista conter apenas `[Role.SUPERVISOR]`, `canPerformAction` no projeto é hierárquico — `ADMIN` e `OWNER` também têm acesso. Verificar implementação em `src/lib/utils.ts`.

### Renderização condicional de status

```typescript
// Com permissão: Select interativo
<Select
  value={form.status}
  onValueChange={(value) => updateStatus({ id: form.id, status: value as FormStatus })}
  disabled={isUpdatingStatus}
>
  <SelectTrigger className={cn("h-7 w-auto px-2.5 rounded-full text-xs font-medium border gap-1.5", statusProps.className)}>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value={FormStatus.NOT_CONVERTED}>Não Convertido</SelectItem>
    <SelectItem value={FormStatus.CONVERTED}>Convertido</SelectItem>
    <SelectItem value={FormStatus.CANCELLED}>Cancelado</SelectItem>
  </SelectContent>
</Select>

// Sem permissão: badge estático
<span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border", statusProps.className)}>
  {statusProps.label}
</span>
```

### Badge de Tipo (isCustomer)

```typescript
// isCustomer: true = novo lead; false = cliente recorrente (lógica invertida visualmente)
<span className={cn(
  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
  form.isCustomer
    ? "bg-secondary text-secondary-foreground border-border"  // Lead (novo)
    : "bg-primary/10 text-primary border-primary/20",          // Cliente (recorrente)
)}>
  {form.isCustomer ? "Lead" : "Cliente"}
</span>
```

### Paginação — algoritmo de janela de páginas

```typescript
// Mostra até 5 botões de página com janela deslizante
Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
  let pageNumber;
  if (totalPages <= 5)              pageNumber = i + 1;
  else if (currentPage <= 3)        pageNumber = i + 1;
  else if (currentPage >= totalPages - 2) pageNumber = totalPages - 4 + i;
  else                              pageNumber = currentPage - 2 + i;
  return pageNumber;
});
```

### Skeleton

```typescript
FormTable.Skeleton = ({ rows = 5 }: { rows?: number }) => JSX.Element
// Renderiza tabela com estrutura idêntica mas usando <Skeleton> da shadcn
// Colunas do skeleton: Checkbox, Nome, Contato, Vendedor, Motivo, Tipo, Criado Em, Status, Ações
```

---

## FormFilters (`_components/form-filters.tsx`)

### Props

```typescript
interface FormFiltersProps {
  onApplyFilter: (data: FormFilterOptions) => void;
  initialFilters: FormFilterOptions;
  sellers: User[];  // User do Prisma — campos usados: id, name
}
```

### Tipo de Filtros

```typescript
// Exportado do componente — usado também em page.tsx
export interface FormFilterOptions {
  status?: FormStatus;
  createdAtStart?: string;  // ISO datetime string
  createdAtEnd?: string;    // ISO datetime string (com endOf("day"))
  isCustomer?: boolean;
  name?: string;
  email?: string;
  phone?: string;
  sellers?: Array<string>;  // Array de User.id
}
```

### Comportamento do Sheet

```typescript
const [open, setOpen] = useState(false);

// Fecha automaticamente quando os filtros mudam (após onApplyFilter ser chamado)
useEffect(() => setOpen(false), [initialFilter]);
```

### Limpeza de valores antes de aplicar

```typescript
const onSubmit = (data: FormFilterOptions) => {
  const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
    if (value && value !== "none" && (Array.isArray(value) ? value.length > 0 : true)) {
      acc[key as keyof FormFilterOptions] = value;
    }
    return acc;
  }, {} as FormFilterOptions);

  onApplyFilter(filteredData);
};
```

Remove: strings vazias, valor `"none"`, arrays vazios, `undefined`, `null`, `false`.

### Conversão de datas com Luxon

```typescript
// Exibição no input type="date": converte ISO → "yyyy-MM-dd"
DateTime.fromISO(field.value).toFormat("yyyy-MM-dd")

// Ao salvar createdAtStart: converte "yyyy-MM-dd" → ISO
DateTime.fromFormat(e.target.value, "yyyy-MM-dd").toISO()

// Ao salvar createdAtEnd: sempre final do dia
DateTime.fromFormat(e.target.value, "yyyy-MM-dd").endOf("day").toISO()
```

### Componentes shadcn utilizados

| Componente | Uso |
|-----------|-----|
| `Sheet`, `SheetContent`, `SheetTitle`, `SheetTrigger` | Painel lateral |
| `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | Dropdowns de Status e isCustomer |
| `Input` | Nome, Email, Telefone, datas |
| `Label` | Labels dos campos |
| `Button` | Trigger do Sheet e submit |
| `Combobox` (customizado) | Multi-seleção de vendedores |

### Combobox de vendedores

```typescript
<Combobox
  items={sellers || []}
  multiple
  value={field.value}            // string[] de User.id
  onValueChange={(items) => field.onChange(items)}
>
  <ComboboxChips>
    <ComboboxValue>
      {(field.value || []).map((v) => (
        <ComboboxChip key={v}>
          {sellers?.find(s => s.id === v)?.name}
        </ComboboxChip>
      ))}
    </ComboboxValue>
    <ComboboxChipsInput placeholder="Adicione um vendedor" />
  </ComboboxChips>
  <ComboboxContent>
    <ComboboxEmpty>Nenhum vendedor encontrado</ComboboxEmpty>
    <ComboboxList>
      {(item) => <ComboboxItem key={item.id} value={item.id}>{item.name}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>
```

> **Atenção:** O filtro de vendedores é aceito pelo schema do back-end mas **não aplicado na query Prisma**. Ao implementar no back-end, adicionar `where.sellerHelenaId = { in: searchParams.sellers }`.
