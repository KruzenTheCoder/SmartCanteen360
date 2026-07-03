# SmartCanteen 360 — Build Roadmap

Status of the incremental build. ✅ done · 🚧 in progress · ⬜ pending.

## Foundation
- ✅ Monorepo (pnpm workspaces + Turborepo), strict TS base config
- ✅ `@smartcanteen/database` — full Prisma schema (Supabase Postgres), client, seed
- ✅ **SQL migrations** — `20260703000000_init` (47 tables, enums, indexes, 66 FKs)
  + `20260703000100_enable_rls`; verified counts (47 tables = 47 PKs = 47 RLS),
  all FK targets resolve, longest identifier ≤ 63 chars
- ✅ **Supabase files** — `supabase/config.toml`, storage-bucket + extensions
  migration, seed pointer; workflow + apply-order in `packages/database/SUPABASE.md`
- ✅ `@smartcanteen/shared` — RBAC catalogue, API envelope, Zod contracts
- ✅ Architecture & README docs

## Backend (apps/api)
- ✅ NestJS bootstrap: config, Prisma module, Swagger, Helmet, versioning, validation
- ✅ Auth module (login/refresh/logout, reset, RBAC guards) + PermissionsGuard wired to shared catalogue
- ✅ Modules with controller/service(/repository)/DTO layers, tenant-scoped, permission-guarded:
  users, employees, meals, meal-schedules, bookings, kitchen, pos, inventory,
  suppliers (+ purchase orders/goods-received), wallet, loyalty, notifications,
  analytics, promotions
- ⬜ Queues (BullMQ workers), WebSocket gateway, cron jobs (booking cutoff, low-stock, daily rollups)
- ⬜ Payment provider adapters (PayFast/Peach/Ozow/Yoco) behind PaymentService
- ⬜ Reports export (PDF/Excel/CSV), Supabase Storage uploads, email service
- 🚧 Tests: employees.service unit test in place; broaden to all modules + e2e
- ⚠️ Not yet compiled/verified in this environment (pnpm not installed here) — run `pnpm install && pnpm -F @smartcanteen/api typecheck`

## Web admin (apps/web)
- ✅ Next.js 14 App Router, Tailwind + shadcn/ui design system, dark/light
- ✅ Auth flow (login, forgot/reset password, invite-only register), protected layout, sidebar nav
- ✅ All feature pages build (27 routes): dashboard, employees, meals, meal-calendar,
  bookings, kitchen, POS (cart+checkout), inventory, suppliers, wallet, loyalty,
  promotions, analytics (Recharts), reports, notifications, users, permissions,
  audit-logs, settings — wired to the API via TanStack Query with loading/empty/error states
- ✅ `next build` green (verified)

## Mobile (apps/mobile)
- ✅ Expo Router + NativeWind + React Query + Secure Store; axios client with refresh-token retry
- ✅ Auth store, root auth-gating layout, tabs + modal/stack routing
- ✅ All screens: login, forgot-password, dashboard, bookings, book-meal, meal-history,
  QR card (SVG QR), wallet, loyalty, shop (wallet checkout), notifications, profile,
  nutrition, favourites, promotions, competition, settings
- ⚠️ Not compiled here (mobile deps not installed in this env) — run `cd apps/mobile && npm install && npx tsc --noEmit`

## DevOps
- ⬜ Dockerfiles + docker-compose (api, redis, web)
- ⬜ GitHub Actions CI (lint, typecheck, test, build)
- ⬜ Health checks, structured logging, monitoring hooks

## Blocked / needs input
- ⬜ **Design import** — pull `SmartCanteen 360.dc.html` via Claude Design
  ("Send to Claude Code Web") so the UI matches the mockup exactly.
