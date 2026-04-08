# Forms — Regras de Negócio Detalhadas

## 1. Deduplicação por Telefone (24h)

A principal proteção contra formulários duplicados é baseada em janela de tempo.

**Regra:** Se o mesmo `phone` submeteu um form criado nas últimas 24 horas, **nenhum novo form é criado**. Retorna 200 com mensagem informativa.

```typescript
const last24Hours = subDays(new Date(), 1);

const orCount = await prisma.form.count({
  where: {
    phone: phone,
    createdAt: { gte: last24Hours },
  },
});

if (orCount) {
  // Silenciosamente ignora — não é erro, é comportamento esperado
  return NextResponse.json({ message: "Já preencheu formulario" }, { headers: CORS_HEADERS });
}
```

**Importante:** A deduplicação considera **qualquer** form nas últimas 24h, independente de status. Um form CANCELLED nas últimas 24h ainda bloqueia novo preenchimento.

---

## 2. Lógica de isCustomer

Determina se o lead que preencheu o form é um cliente novo ou recorrente.

```typescript
const isCustomer = await prisma.form.count({
  where: {
    phone,
    status: FormStatus.CONVERTED,
    createdAt: { lt: subDays(new Date(), 1) }, // CONVERTED há mais de 24h
  },
});

// isCustomer = true → novo lead (nunca comprou ou comprou há menos de 24h)
// isCustomer = false → já é cliente (tem CONVERTED antigo)
```

**Semântica do campo:**
- `isCustomer: true` → **novo lead**, nunca converteu (ou converteu nas últimas 24h — edge case raro)
- `isCustomer: false` → **cliente recorrente**, já comprou anteriormente

**Uso no negócio:** Permite filtrar e segmentar campanhas, separar métricas de novos clientes vs. recorrentes no dashboard.

---

## 3. Tipos de Form (FormType)

| Tipo | Origem | Status Inicial | Como é criado |
|------|--------|----------------|---------------|
| `FORM_FN` | Site flores-nobre.com.br | `NOT_CONVERTED` | `POST /api/webhooks/formularios` |
| `SITE_SALE` | WooCommerce | `CONVERTED` | `src/modules/woocommerce/woocommerce.service.ts` |
| `MANUAL` | Operador cria pedido sem form | `CONVERTED` | Lógica interna de `POST /api/orders` |

**FORM_FN** é o tipo mais comum e representa o evento de marketing do funil.

**MANUAL** é criado automaticamente quando um operador registra um pedido no sistema interno para um telefone que não possui um form nos últimos 24 dias — garante que todo pedido tenha um form associado.

**SITE_SALE** é criado pela integração WooCommerce quando um pedido chega do e-commerce, garantindo rastreabilidade do funil digital.

---

## 4. Integração Form → Order (Ciclo de Conversão)

Quando um pedido é criado via `POST /api/orders`, a lógica de conversão funciona assim:

```
1. Busca Form criado nas últimas 24h para o phone do destinatário
   ↓
2a. Form encontrado + status != CONVERTED
    → Atualiza Form para CONVERTED
    → Usa formId deste Form no pedido
   ↓
2b. Form encontrado + status == CONVERTED
    → Usa formId deste Form no pedido (sem alterar status)
   ↓
2c. Nenhum form encontrado
    → Cria Form com type=MANUAL, status=CONVERTED
    → Usa formId do novo Form no pedido
   ↓
3. Upserta Lead por phone para status=CONVERTED
4. Order.formId é atribuído
```

**Consequência:** Todo `Order` no sistema possui um `formId` — a referência ao evento de conversão que o gerou.

---

## 5. ConversionMessage — Rastreamento de Mensagens WhatsApp

Cada form pode ter múltiplas ConversionMessages, rastreando a jornada de comunicação.

```typescript
enum ConversionMessageType {
  WELLCOME,        // Primeira mensagem enviada após preenchimento
  SECOND_ATTEMPT,  // Segunda tentativa de contato (follow-up)
  FEEDBACK,        // Mensagem de feedback pós-conversão
}
```

**Campo sessionId:** UUID da sessão no sistema Helena (WhatsApp). Usado pelo front-end para abrir a conversa diretamente. Na tabela de formulários, o botão de chat usa `conversionMessages[0].sessionId`.

**Fluxo da WELLCOME:**
1. Webhook cria Form
2. `sendInitialTemplate({ phone, formId })` é chamado
3. Tenta enviar mensagem simples "🌹" via ZAPI
4. Se status DELIVERED/SENT/PROCESSING → cria ConversionMessage com `type=WELLCOME`
5. Se status WAIT_REPLY/QUEUED → cancela mensagem, envia template `77dca_formulariositevariavelno`, cria ConversionMessage

**A falha no envio de mensagem NÃO falha o webhook** — é capturada e logada, o Form é criado com sucesso.

---

## 6. Integração com Campanhas Google Ads

O webhook captura dados de rastreamento de anúncios para atribuição de conversão:

```typescript
if (campaignData?.gclid || campaignData?.gbraid || campaignData?.wbraid) {
  await prisma.campaignData.create({
    data: {
      phone,
      gclid: campaignData.gclid || undefined,
      gbraid: campaignData.gbraid || undefined,
      wbraid: campaignData.wbraid || undefined,
    },
  });
}
```

- `gclid`: Google Click ID (cliques via Google Search/Display)
- `gbraid`: Google Beacon Click ID (iOS, com privacidade)
- `wbraid`: Web-to-App Click ID (Android)

Esses dados são criados separadamente do Form, linkados por `phone`, para uso em integrações de conversão com Google Ads API.

---

## 7. Integração com Leads

O webhook de formulário sempre mantém o Lead sincronizado:

```typescript
await prisma.lead.upsert({
  where: { phone },
  create: { name, phone, email, source: LeadSource.FORM },
  update: { name, email },  // Atualiza nome/email se Lead já existia
});
```

**Comportamento:** Se o lead não existia → cria com `source=FORM`. Se já existia (de outro canal) → apenas atualiza nome e e-mail, preservando o `source` original e outros dados.

**Phone é a chave única de Leads** — formulários do mesmo telefone não criam duplicatas de Lead.

---

## 8. Métricas do Dashboard

A página `/dashboard/formularios` calcula métricas client-side a partir dos dados retornados:

```typescript
const total = forms.length;
const converted = forms.filter(f => f.status === FormStatus.CONVERTED).length;
const conversionRate = total > 0 ? (converted / total * 100).toFixed(1) : "0";
```

**Filtros de data importantes para métricas:**
- "Formulários de Hoje": `createdAtStart = startOfDay(today)`, `createdAtEnd = endOfDay(today)`
- "Formulários de Ontem": `createdAtStart = startOfDay(yesterday)`, `createdAtEnd = endOfDay(yesterday)`
- Período customizado: qualquer range via date picker

Os filtros são construídos via `buildFilters()` em `src/app/(app)/dashboard/formularios/utils.ts`.

---

## 9. Permissões e Roles

```typescript
// src/app/api/forms/[id]/route.ts
const ALLOWED_ROLES = [Role.SUPERVISOR, Role.ADMIN, Role.OWNER];

const userRole = (auth!.user as any).role as Role;
if (!hasRoles(ALLOWED_ROLES, userRole)) {
  throw createHttpError.Forbidden("Usuário sem permissão para atualizar status");
}
```

**`hasRoles`** verifica se `userRole` está na lista de roles permitidas. A função está em `src/lib/utils.ts`.

**Roles do sistema:** `USER`, `ADMIN`, `OWNER`, `SUPPLIER`, `SUPERVISOR` — definidos em `@/generated/prisma/enums`.

---

## 10. Pontos de Atenção e Limitações Conhecidas

1. **Filtros não implementados na tabela:** `sellers` e `isCustomer` estão no schema Zod do `GET /api/tables/forms` mas não são aplicados na query Prisma. Ao implementar, adicionar:
   ```typescript
   if (searchParams.isCustomer !== undefined) where.isCustomer = searchParams.isCustomer;
   ```

2. **`sellerHelenaId`:** Campo existe no modelo mas não há endpoint para atribuição de vendedor via Form. A atribuição é um ponto de evolução planejada.

3. **Sem paginação no `GET /api/tables/forms`:** Retorna todos os forms filtrados sem paginação server-side. Para grandes volumes, implementar `skip`/`take` com total count.

4. **CORS total no webhook:** `Access-Control-Allow-Origin: *` é intencional — o webhook deve aceitar requests de qualquer domínio onde o formulário do site estiver hospedado.

5. **`cancelReason`:** Campo existe no modelo mas não há endpoint para salvá-lo. Provavelmente intenção futura ao marcar CANCELLED.
