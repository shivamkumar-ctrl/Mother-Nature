---
name: replit-auth-web tsconfig fix
description: lib/replit-auth-web cannot use import.meta.env or vite/client types — workaround used.
---

`lib/replit-auth-web` is a composite lib (not a Vite artifact). Its tsconfig does not and cannot include `vite/client` types because Vite is not a dependency of the lib package.

The template file `lib/replit-auth-web/src/use-auth.ts` originally used `import.meta.env.BASE_URL` which causes `error TS2339: Property 'env' does not exist on type 'ImportMeta'` when typechecked as a lib.

**Fix applied:** Replaced `import.meta.env.BASE_URL` with a `window.__BASE_URL__` fallback pattern (`(window as Window & { __BASE_URL__?: string }).__BASE_URL__ ?? "/"`)

**Why:** The lib package is compiled by tsc (not Vite), so it has no access to Vite's augmented ImportMeta type.

**How to apply:** Every time the replit-auth-web template is copied and added to root tsconfig references, apply this same fix to `use-auth.ts` before running typecheck:libs.
