# Bloom & Root Nursery — High-Level Code Flow

## 1. What this app is
A full-stack flower nursery web app with:
- A **customer storefront** (browse plants, cart, checkout, order history)
- An **owner/admin dashboard** (products, orders, customers, revenue stats)

## 2. Big picture architecture

```
┌─────────────────────┐        HTTP (via shared proxy)        ┌──────────────────────┐
│   Frontend (React)   │  ───────────────────────────────────▶ │   API Server (Express)│
│  artifacts/nursery    │  ◀─────────────────────────────────── │  artifacts/api-server │
└─────────────────────┘         JSON responses                 └──────────┬───────────┘
                                                                            │
                                                                            ▼
                                                                 ┌──────────────────────┐
                                                                 │   PostgreSQL (Drizzle)│
                                                                 │       lib/db          │
                                                                 └──────────────────────┘
```

Both pieces are separate deployable services in the same pnpm monorepo, connected by:
- **OpenAPI spec** (`lib/api-spec/openapi.yaml`) — the single source of truth for every API endpoint and data shape.
- **Codegen** — running `pnpm --filter @workspace/api-spec run codegen` reads that spec and generates:
  - `lib/api-client-react` — typed React Query hooks the frontend calls (e.g. `useListOrders`, `useCreateOrder`)
  - `lib/api-zod` — Zod schemas the backend uses to validate incoming requests/params

This means: **change the spec → regenerate → both frontend hooks and backend validation update together**, so they never drift out of sync.

## 3. Request flow (example: customer places an order)

1. Customer fills out the cart/checkout form in `artifacts/nursery/src/pages/Cart.tsx`.
2. On submit, the page calls a generated hook (e.g. `useCreateOrder()`), which sends `POST /api/orders`.
3. The request crosses the shared reverse proxy and lands in `artifacts/api-server`.
4. In `artifacts/api-server/src/routes/orders.ts`, the route handler:
   - Confirms the user is authenticated (`req.isAuthenticated()`), via Replit Auth session
   - Validates the request body against a Zod schema (from `lib/api-zod`)
   - Reads/writes data via Drizzle ORM (`lib/db`) into PostgreSQL
   - Returns a JSON response matching the OpenAPI-defined shape
5. React Query on the frontend receives the response, updates its cache, and the UI re-renders (e.g. cart clears, order confirmation shows).

Admin actions (managing products/orders/customers) follow the same pattern, but routes additionally check `isOwner(req.user.id)` — only the account matching `OWNER_USER_ID` can access owner-only endpoints; everyone else gets a 403.

## 4. Folder map (where to look for what)

| Concern | Location |
|---|---|
| API contract (source of truth) | `lib/api-spec/openapi.yaml` |
| Generated frontend API hooks | `lib/api-client-react/src/generated/` |
| Generated backend validation schemas | `lib/api-zod/src/generated/` |
| Database tables/schema | `lib/db/src/schema/` (products, orders/carts, auth/users) |
| Backend route handlers | `artifacts/api-server/src/routes/` |
| Auth (login/session) helpers, browser hook | `lib/replit-auth-web/` |
| Storefront pages (browse, cart, orders) | `artifacts/nursery/src/pages/` |
| Admin pages (dashboard, products, orders, customers) | `artifacts/nursery/src/pages/admin/` |
| Shared UI components | `artifacts/nursery/src/components/` |

## 5. Authentication & roles
- Login is handled entirely by **Replit Auth** (OIDC) — there are no custom login forms or password handling.
- Every logged-in user is stored in the `users` table.
- One specific user ID (set via the `OWNER_USER_ID` environment variable) is treated as the nursery owner — that account alone can see `/admin/*` pages and hit owner-only API routes.
- All other authenticated users are treated as regular customers.

## 6. Data model (simplified)
- **users** — one row per person who has logged in (id, email, name)
- **products** — plants/flowers for sale (name, price, stock, care info)
- **carts** — one active cart per user, holding cart items
- **orders** — placed orders, each storing a snapshot of `customerName`, `shippingAddress`, `phoneNumber`, `status`, `total`, and line items — so historical orders stay accurate even if a product or user profile changes later

## 7. How a typical feature change ripples through the stack
Example: "add a `giftMessage` field to orders"
1. Add the field to the `orders` table schema in `lib/db/src/schema/orders.ts`, then run `pnpm --filter @workspace/db run push`.
2. Add `giftMessage` to the relevant schema(s) in `lib/api-spec/openapi.yaml`.
3. Run `pnpm --filter @workspace/api-spec run codegen` to regenerate hooks/Zod schemas.
4. Update the backend route in `artifacts/api-server/src/routes/orders.ts` to read/write the new field.
5. Update the frontend form/page in `artifacts/nursery/src/pages/` to collect and display it.
6. Run `pnpm run typecheck` to confirm everything lines up end-to-end.

## 8. Key operational notes
- The API server does **not hot-reload** — after any backend code change, its workflow must be restarted for the change to take effect (it runs a one-time `build && start`).
- The frontend (Vite) does hot-reload during development.
- `pnpm run typecheck` is the fastest way to confirm the whole stack (frontend + backend + shared libs) is consistent after a change.
