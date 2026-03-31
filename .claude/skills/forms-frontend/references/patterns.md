# Forms Frontend — Padrões de Extensão

## Adicionar uma nova coluna na FormTable

1. Adicionar o `<TableHead>` no `<TableHeader>`:
```tsx
<TableHead className="text-center font-medium text-foreground py-4">
  Nova Coluna
</TableHead>
```

2. Adicionar o `<TableCell>` correspondente no `currentForms.map(...)`:
```tsx
<TableCell className="text-center py-4">
  {form.novoCampo || "-"}
</TableCell>
```

3. Se o dado vem de uma relação não incluída, adicionar ao include da query no back-end em `GET /api/tables/forms` e atualizar o tipo `FormTableItem` em `src/modules/form/form.dto.ts`.

4. Adicionar o skeleton da nova coluna em `FormTable.Skeleton`:
```tsx
<TableCell className="py-4">
  <Skeleton className="h-4 w-20 mx-auto" />
</TableCell>
```

---

## Adicionar um novo filtro

### 1. Adicionar ao tipo `FormFilterOptions` em `form-filters.tsx`

```typescript
export interface FormFilterOptions {
  // ...campos existentes
  novoCampo?: string; // ou o tipo correto
}
```

### 2. Adicionar ao `useForm` em `FormsPage` (`page.tsx`)

```typescript
const [filterOptions, setFilterOptions] = useState<FormFilterOptions>({
  // ...campos existentes
  novoCampo: "",
});
```

### 3. Adicionar o campo no formulário de `FormFilters`

```tsx
<div className="mb-4 space-y-2">
  <Label>Novo Campo:</Label>
  <Controller
    name="novoCampo"
    control={control}
    render={({ field }) => (
      <Input
        type="text"
        value={field.value || ""}
        onChange={field.onChange}
        placeholder="Placeholder"
      />
    )}
  />
</div>
```

### 4. Garantir que o back-end aceita e processa o filtro

- Adicionar ao `formFilterOptionsSchema` em `src/modules/form/form-table.dto.ts`
- Aplicar o filtro na query Prisma em `src/app/api/tables/forms/route.ts`

> **Atenção:** `buildFilters()` em `utils.ts` já serializa automaticamente o novo campo para query params desde que não seja falsy.

---

## Adicionar uma nova métrica

As métricas são calculadas em `FormsPage` via `useMemo` sobre `filteredForms`. Para adicionar uma nova:

```typescript
const metrics = useMemo(() => {
  const total = filteredForms.length;
  const converted = filteredForms.filter(f => f.status === FormStatus.CONVERTED).length;
  const novaMétrica = filteredForms.filter(/* condição */).length;
  const conversionTax = total > 0 ? (converted / total) * 100 : 0;
  return { total, converted, conversionTax, novaMétrica };
}, [filteredForms]);
```

Adicionar o card no JSX seguindo o mesmo padrão visual dos 3 cards existentes:

```tsx
<div className="rounded-xl border border-border bg-card text-card-foreground p-6 shadow-sm transition-all hover:shadow-md">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-muted-foreground">Label da Métrica</p>
      <p className="text-3xl font-bold text-foreground mt-2 tracking-tight">
        {metrics.novaMétrica.toLocaleString("pt-BR")}
      </p>
    </div>
    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground">
      <IconComponent className="h-5 w-5" />
    </div>
  </div>
</div>
```

Atualizar o `grid-cols-3` para `grid-cols-4` se adicionar um 4º card.

---

## Adicionar uma nova ação na tabela

Seguir o padrão da coluna "Ações" existente:

```tsx
<TableCell className="text-center py-4">
  <div className="flex items-center justify-center gap-2">
    {/* Ação existente: Chat */}
    <Button variant="ghost" size="sm" className="h-8 gap-2 ...">
      <MessageCircle className="h-4 w-4" />
      <span className="hidden xl:inline">Chat</span>
    </Button>

    {/* Nova ação */}
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
      onClick={() => { /* handler */ }}
      disabled={/* condição */}
    >
      <NovoIcone className="h-4 w-4" />
      <span className="hidden xl:inline">Label</span>
    </Button>
  </div>
</TableCell>
```

---

## Restringir ação por permissão

Usar `canPerformAction` do `src/lib/utils.ts`:

```typescript
const { data: session } = authClient.useSession();

const podeExecutarAcao = canPerformAction(
  [Role.SUPERVISOR], // roles mínimas — ADMIN e OWNER herdam automaticamente
  session?.user.role as Role,
);
```

Renderização condicional:
```tsx
{podeExecutarAcao && (
  <Button onClick={...}>Ação Restrita</Button>
)}
```

---

## Disparar um mutation com invalidação

Padrão usado na atualização de status — aplicar para novas mutations:

```typescript
const queryClient = useQueryClient();

const { mutate: minhaAcao, isPending } = useMutation({
  mutationFn: ({ id, dado }: { id: string; dado: string }) =>
    axios.post(`/api/forms/${id}/minha-rota`, { dado }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["forms"] }),
  onError: (error) => {
    // tratar erro — ex: toast
  },
});
```

---

## Adicionar campo de data ao filtro

Padrão de conversão Luxon usado nos campos de data existentes:

```tsx
<Controller
  name="novaData"
  control={control}
  render={({ field }) => (
    <Input
      type="date"
      value={field.value ? DateTime.fromISO(field.value).toFormat("yyyy-MM-dd") : ""}
      onChange={(e) =>
        field.onChange(
          e.target.value
            ? DateTime.fromFormat(e.target.value, "yyyy-MM-dd").toISO()
            : "",
        )
      }
    />
  )}
/>
```

Para data de fim, usar `.endOf("day")` para incluir todo o dia:
```typescript
DateTime.fromFormat(e.target.value, "yyyy-MM-dd").endOf("day").toISO()
```

---

## Atualizar o `getDatePeriodMessage` para novo caso

A função em `utils.ts` usa cálculo de diferença de dias. Para adicionar novo caso:

```typescript
export function getDatePeriodMessage(dataInicio?: string, dataFim?: string): string {
  // Adicionar novo caso antes dos existentes
  if (/* condição específica */) {
    return "Mensagem customizada";
  }
  // ...lógica existente
}
```

---

## Skeleton da página (FormsPageSkeleton)

Ao adicionar novos cards de métricas, atualizar o skeleton da página:

```tsx
function FormsPageSkeleton() {
  return (
    <div className="...">
      {/* Header skeleton — não muda */}
      {/* Cards — atualizar length para refletir número de cards */}
      {[1, 2, 3, 4].map((i) => (  // era [1,2,3] para 3 cards
        <Skeleton key={i} className="h-36 w-full rounded-xl" />
      ))}
    </div>
  );
}
```

---

## Pontos de Atenção

1. **`FormFilterOptions` é exportado de `form-filters.tsx`**, não de um arquivo de tipos dedicado. Ao importar em `page.tsx`, usar:
   ```typescript
   import FormFilters, { FormFilterOptions } from "./_components/form-filters";
   ```

2. **Paginação é client-side**: toda a lista filtrada é carregada e fatiada localmente. Para listas grandes, considerar paginação server-side com `skip`/`take` na API.

3. **`FormTable.Skeleton` está comentado em `page.tsx`**: o skeleton da página é exibido em vez do skeleton da tabela durante o loading. Para usar o skeleton da tabela em contextos diferentes:
   ```tsx
   <FormTable.Skeleton rows={10} />
   ```

4. **O Combobox de vendedores usa `User.id`** mas a tabela resolve nomes via `User.helenaId`. São campos diferentes — o filtro de vendedores no back-end ainda não está implementado, então não há inconsistência funcional por ora.

5. **Importações Prisma no cliente**: usar `@/generated/prisma/browser` (não `@/generated/prisma/client`) para tipos seguros no lado do cliente. Ex: `FormStatus`, `Role`, `User` devem vir de `browser`.
