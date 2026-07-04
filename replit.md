# Bloom & Root Nursery

A full-stack flower nursery web app for a single owner with ~500 customers, featuring a customer storefront, shopping cart, order management, and an owner dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/nursery run dev` — run the frontend (port 23555)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `OWNER_USER_ID` — Replit user ID of the nursery owner (grants admin access)
- Required env: `SESSION_SECRET` — secret key for session signing

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Wouter routing
- API: Express 5 with Replit Auth (OIDC/PKCE)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — Drizzle DB schemas (products, orders/carts, auth)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas (used by server)
- `lib/replit-auth-web/` — browser auth hook (`useAuth`)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/nursery/src/` — React frontend

## Architecture decisions

- Contract-first: OpenAPI spec → codegen → typed hooks + Zod schemas
- Owner identified by `OWNER_USER_ID` env var; all other authenticated users are customers
- Role enforcement at API level (owner-only routes return 403 for customers)
- Cart is per-user session; checkout clears cart and creates an order
- Auth via Replit OIDC — no custom login forms

## Product

- **Storefront**: Browse 15+ plants/flowers with category filter and search
- **Product detail**: Care guide (sunlight, watering, care level), add to cart
- **Shopping cart**: Add, update quantity, remove items; checkout with shipping address
- **Order history**: Customers can view their past orders and status
- **Owner dashboard**: Revenue, order counts, customers, low-stock alerts
- **Owner product management**: Create, edit, delete products
- **Owner order management**: View all orders, update status (pending → processing → shipped → delivered)
- **Owner customer management**: View all customers with spend history

## User preferences

_Populate as needed._

## Gotchas

- Set `OWNER_USER_ID` to your Replit user ID to unlock the admin dashboard
- After any OpenAPI spec change, run codegen before using updated types
- `pnpm --filter @workspace/db run push` applies schema changes in dev; production schema is handled by Replit Publish

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
