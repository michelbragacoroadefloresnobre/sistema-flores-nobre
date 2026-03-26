# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema Flores Nobre — internal management system for a flower delivery business (Flores Nobre / Coroas Nobre). Built with Next.js 16 (App Router), React 19, Prisma 7 (PostgreSQL via `pg` adapter), and better-auth for authentication. The UI uses shadcn/ui (new-york style) with Tailwind CSS v4.

The application is in Brazilian Portuguese (pt-BR).

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- `npx prisma generate` — regenerate Prisma client (output: `src/generated/prisma`)
- `npx prisma migrate dev` — run migrations in development
- `npx prisma migrate deploy` — apply migrations in production

## Architecture

### Route structure

- `src/app/(app)/` — authenticated admin panel pages (dashboard, pedidos, configuracoes)
- `src/app/painel/[id]` — supplier panel (external-facing)
- `src/app/checkout/` — customer checkout flow
- `src/app/api/` — API route handlers (REST-style)

### API route pattern

All API routes use `createRoute()` from `src/lib/handler/route-handler.ts`. This wrapper handles auth verification, Zod body/query validation, and standardized error responses (http-errors + ZodError). Mark routes as `{ public: true }` to skip auth.

### Modules (`src/modules/`)

Business logic layer organized by domain: orders, payments, products, suppliers, form, cities, conversions, files, message, users, woocommerce. Each module contains services (`*.service.ts`) and DTOs (`*.dto.ts` with Zod schemas).

### Key integrations

- **Pagar.me** (`src/lib/pagarme/`) — payment gateway (PIX, boleto, credit card)
- **Z-API** (`src/lib/zapi.ts`) — WhatsApp messaging
- **Helena** (`src/lib/helena/`) — CRM/sales assistant
- **AWS S3** (`src/lib/s3.ts`) — file uploads with presigned URLs
- **Upstash Redis** (`src/lib/redis.ts`) — kanban cache
- **WooCommerce** (`src/modules/woocommerce/`) — site order sync
- **N8N** — workflow automation (webhook triggers)

### Database

PostgreSQL with Prisma. The Prisma client is generated to `src/generated/prisma/` (do not edit). Singleton instance in `src/lib/prisma.ts` uses the `pg` adapter with connection pooling. Configuration in `prisma.config.ts` reads `DATABASE_URL` from env.

### Auth

Uses better-auth (`src/lib/auth/`). Roles: OWNER, ADMIN, SUPERVISOR, SELLER. Client hook in `src/hooks/useAuth.ts`.

### Environment

Env vars are validated at startup via `@t3-oss/env-nextjs` in `src/lib/env.ts`. The import is loaded in `next.config.ts` so missing vars fail the build early. Timezone constant: `SP_TIMEZONE = "America/Sao_Paulo"`.

### Path alias

`@/*` maps to `./src/*`

### UI components

shadcn/ui components live in `src/components/ui/`. State management with Zustand, server state with TanStack React Query.
