# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema Flores Nobre — internal management system for a Brazilian flower delivery business. Handles orders, payments, supplier fulfillment, lead management, and WooCommerce integration.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx prisma migrate dev --name <description>   # Create & apply migration
npx prisma generate  # Regenerate Prisma client (also runs on npm install)
```

No test suite is configured.

## Architecture

- **Next.js 16.1** with App Router, TypeScript 5
- **Prisma** with PostgreSQL (via `@prisma/adapter-pg` for connection pooling)
- **Better-Auth** for authentication (email/password, role-based: USER, ADMIN, OWNER, SUPPLIER)
- **shadcn/ui** + Radix UI components, Tailwind CSS 4
- **React Hook Form** + **Zod** for form/API validation
- **Zustand** for client-side state (with localStorage persistence)
- **TanStack Query** for client-side data fetching

## Behaviors
- When in "Plan Mode," simply converse to develop the necessary context and wait for clear instructions to generate the plan.

### Key directories

- `src/app/(app)/` — Protected routes (auth required via layout)
- `src/app/api/` — REST API routes
- `src/app/api/webhooks/` — Incoming webhooks (Pagar.me, ZAPI, Helena, WooCommerce, etc.)
- `src/modules/<domain>/` — Business logic: `*.service.ts`, `dtos/`, `constants.ts`
- `src/lib/` — Shared utilities, external service clients, Prisma instance
- `src/components/ui/` — Reusable shadcn components
- `src/generated/prisma/` — Auto-generated Prisma types and enums

### API route pattern

All API routes use the `createRoute` wrapper (`src/lib/handler/route-handler.ts`):

```typescript
import { createRoute } from "@/lib/handler/route-handler";

export const POST = createRoute(
  async (req, { body, auth, params, searchParams }) => {
    // body is Zod-validated; auth has session/user (null if public)
    return "Success";          // → { message: "Success", status: 201 }
    return { data: {...} };    // → { message: "Operação realizada com sucesso", status: 200, data: {...} }
  },
  { body: zodSchema, public: true }  // public: true skips auth check
);
```

- `HttpError` → proper status code; `ZodError` → 400 with field errors; unhandled → 500
- POST returns 201, other methods return 200
- Options: `body` (Zod schema), `searchParams` (Zod schema), `public` (boolean)

### External integrations

- **Pagar.me** (`src/lib/pagarme/`) — Payment gateway (boleto, PIX, credit card)
- **ZAPI** (`src/lib/zapi.ts`) — WhatsApp messaging
- **Helena** (`src/lib/helena.ts`) — SMS service
- **AWS S3** (`src/lib/s3.ts`) — Image storage
- **WooCommerce** (`src/lib/woocommerce/`, `src/modules/woocommerce/`) — Order/product sync
- **Upstash Redis** (`src/lib/redis.ts`) — Kanban board cache
- **N8N** — Automation webhooks

### Environment

All env vars validated via `@t3-oss/env-nextjs` in `src/lib/env.ts`. All dates use **São Paulo timezone** (`America/Sao_Paulo`, exported as `SP_TIMEZONE` from `src/lib/env.ts`).

### Important conventions

- Enums are defined in Prisma schema, import from `@/generated/prisma/enums`
- Currency helper: `formatBRL()` from `src/lib/utils.ts`
- Phone/CNPJ/CPF formatting helpers also in `src/lib/utils.ts`
- Auth in server components: `auth.api.getSession({ headers: await headers() })`
- Auth client-side: `authClient` from `src/lib/auth/client`
- Language: UI text and API messages are in **Brazilian Portuguese**
- Always use ENUMS to assign values ​​when applicable: `const a = 'PAGO'` is incorrect; `const a = PaymentStatus.PAID` is correct.
