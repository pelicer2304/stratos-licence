# Copilot instructions (LicenseHub / Stratus)

## Project at a glance
- Frontend: Vite + React 18 + TypeScript (no router). Entry: [src/App.tsx](../src/App.tsx) and [src/main.tsx](../src/main.tsx).
- Backend: Supabase (Postgres + Auth + RLS). Schema/migrations live in [supabase/migrations/](../supabase/migrations/).
- Styling: Tailwind with a custom dark theme palette in [tailwind.config.js](../tailwind.config.js) and base styles in [src/index.css](../src/index.css).

## Developer workflows
- Dev server: `npm run dev`
- Typecheck: `npm run typecheck` (uses `tsconfig.app.json`)
- Lint: `npm run lint`
- Build/preview: `npm run build` / `npm run preview`
- Supabase smoke scripts (use carefully; may contain hardcoded creds): [test-supabase.js](../test-supabase.js), [test-user.js](../test-user.js)

## Auth + “admin-only” access model (critical)
- The app is gated by `admin_users`: authentication alone isn’t enough.
- `AuthProvider` checks session + queries `admin_users` to set `isAdmin`; non-admins see “Acesso Negado”. See [src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx) and the guard in [src/App.tsx](../src/App.tsx).
- To grant admin access in dev, follow [SETUP_ADMIN.md](../SETUP_ADMIN.md).

## Data access patterns (Supabase)
- Use the shared client from [src/lib/supabase.ts](../src/lib/supabase.ts) (reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
- Read models via hooks in [src/hooks/](../src/hooks/):
  - Licenses: `useLicenses()` reads from the DB view `v_licenses_with_brokers` and applies UI filters client-side. See [src/hooks/useLicenses.ts](../src/hooks/useLicenses.ts).
  - Brokers: `useBrokers()` queries `brokers` + `broker_servers` then merges in-memory. See [src/hooks/useBrokers.ts](../src/hooks/useBrokers.ts).
- Mutations are plain async functions (not React Query): `create*/update*/delete*` live alongside hooks.
- After mutations, pages call `refetch()` and show toasts. Example flows: [src/pages/Licenses.tsx](../src/pages/Licenses.tsx), [src/pages/Brokers.tsx](../src/pages/Brokers.tsx).
- Auditing: mutations log into `audit_logs` via `logAudit(...)` inside the hooks modules.

## UI conventions
- Pages live in [src/pages/](../src/pages/); navigation is local state (`currentPage`) not `react-router`. If you add a page, wire it into [src/App.tsx](../src/App.tsx) and the sidebar.
- Reusable primitives are in [src/components/ui/](../src/components/ui/) (e.g. `Button`, `Card`, `Modal`, `Select`, `MultiSelect`). Prefer composing these over introducing new UI frameworks.
- Forms:
  - Licenses use `react-hook-form` + `zod` schema validation (modal form). See [src/components/licenses/LicenseFormModal.tsx](../src/components/licenses/LicenseFormModal.tsx).
  - Brokers modal uses local `useState` form handling. See [src/components/brokers/BrokerFormModal.tsx](../src/components/brokers/BrokerFormModal.tsx).
- Notifications: use `useToast().success/error/info` from [src/contexts/ToastContext.tsx](../src/contexts/ToastContext.tsx).

## Supabase schema + edge validation
- Admin-only RLS is implemented via `is_admin()` and policies created in migrations like [supabase/migrations/20260114165239_refactor_schema_for_admin_system_v2.sql](../supabase/migrations/20260114165239_refactor_schema_for_admin_system_v2.sql).
- External license validation is a Supabase Edge Function: [supabase/functions/validate_license/index.ts](../supabase/functions/validate_license/index.ts).
  - Request JSON: `{ license_key, login, server }`
  - Returns `{ ok: boolean, reason?: string, expires_at?: string }` and writes to `validation_logs`.

## Gotchas / repo-specific pitfalls
- Typed DB model file [src/types/database.ts](../src/types/database.ts) appears out-of-date vs current migrations (e.g., it still mentions `allowed_servers`, `user_id`). If you touch schema-related TS types, update/regenerate it to match the current tables/views used by hooks.
- Don’t add secrets to the repo. Prefer `.env` for frontend (`VITE_*`) and Supabase Function secrets for service role keys.
