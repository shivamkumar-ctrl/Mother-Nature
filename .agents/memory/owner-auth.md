---
name: Owner auth pattern
description: How the single-owner is identified and authorized in the nursery app.
---

The app has one owner and ~500 customers. Owner is identified by `OWNER_USER_ID` environment variable (Replit user ID string). All other authenticated users are treated as customers.

The `isOwner(userId)` helper in `artifacts/api-server/src/routes/products.ts` checks this env var. It is imported and reused in orders, customers, and dashboard routes.

**Why:** Replit Auth doesn't have built-in roles. A simple env-var-based owner check is the right balance of simplicity and security for a single-owner business app.

**How to apply:** Owner must set `OWNER_USER_ID` to their Replit user ID to unlock the admin dashboard (`/admin`, `/admin/products`, `/admin/orders`, `/admin/customers`). Without it, admin routes return 403 for everyone.
