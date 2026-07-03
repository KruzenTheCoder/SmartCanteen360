# SmartCanteen 360 — Architecture

## Principles

- **Clean, modular architecture.** Each backend feature is a self-contained
  NestJS module with `controller → service → repository` layers, DTOs,
  validators and tests. Business rules live in services; data access lives in
  repositories; HTTP concerns live in controllers.
- **Single shared database.** Web and mobile talk to the same NestJS API, which
  owns the only connection to the shared Supabase Postgres. No client-side DB
  access. This guarantees one set of validation, RBAC and audit rules.
- **Contracts first.** `@smartcanteen/shared` holds the RBAC catalogue, response
  envelope and Zod schemas imported by the API and both clients, so the wire
  format can't drift between platforms.
- **Strict TypeScript everywhere.** `strict`, `noUncheckedIndexedAccess`, no
  `any`.

## Request lifecycle (API)

```
HTTP → Helmet → CORS → RateLimit → JwtAuthGuard → PermissionsGuard
     → ValidationPipe (Zod/class-validator) → Controller → Service → Repository → Prisma → Supabase
     → TransformInterceptor (envelope) → AuditInterceptor → response
Errors → AllExceptionsFilter → { success:false, error:{ code, message, details } }
```

## Layering per module

```
modules/<feature>/
├── <feature>.controller.ts     REST endpoints, Swagger decorators
├── <feature>.service.ts        business logic, orchestration, transactions
├── <feature>.repository.ts     Prisma queries, soft-delete filtering
├── dto/                        request/response DTOs + validation
├── entities/                   domain view models (API-facing shapes)
├── <feature>.module.ts         DI wiring
└── <feature>.service.spec.ts   unit tests (+ e2e under apps/api/test)
```

## Multi-tenancy

Most tables carry `companyId`. A `TenantContext` (derived from the JWT) scopes
every repository query. `SUPER_ADMIN` may cross tenants; all other roles are
pinned to their company.

## Authentication & RBAC

- **JWT access token** (short-lived, ~15m) + **refresh token** (long-lived,
  rotated on every use, hashed at rest in `refresh_tokens`).
- **RBAC**: `roles` ↔ `permissions` (many-to-many). The `@RequirePermissions()`
  decorator + `PermissionsGuard` enforce `"<resource>:<action>"` keys from the
  shared catalogue. `SUPER_ADMIN` is an implicit wildcard.
- 2FA-ready (TOTP secret column), email verification, password reset, session
  management via refresh-token records.

## Cross-cutting concerns

| Concern        | Implementation |
|----------------|----------------|
| Validation     | Zod contracts (shared) + Nest `ValidationPipe` |
| Errors         | `AllExceptionsFilter` → stable `ErrorCode` envelope |
| Logging        | Pino structured logs, request-id correlation |
| Audit          | `AuditInterceptor` writes `audit_logs` on mutations |
| Background jobs | BullMQ (Redis): notifications, reports, analytics snapshots, expiry sweeps |
| Realtime       | WebSocket gateway (kitchen board, POS, notifications) |
| Scheduling     | `@nestjs/schedule` cron: booking cutoffs, low-stock alerts, daily rollups |
| Files          | Supabase Storage adapter (meal images, receipts, avatars) |
| Payments       | Provider-agnostic `PaymentService` with PayFast/Peach/Ozow/Yoco/Wallet adapters |

## Payments abstraction

```
PaymentService.charge(request)
  └── resolves PaymentProviderAdapter by `provider`
        ├── WalletAdapter          (internal ledger debit)
        ├── PayrollDeductionAdapter (batched, exported to payroll)
        ├── LoyaltyAdapter         (points redemption)
        ├── PayFastAdapter / PeachAdapter / OzowAdapter / YocoAdapter (external)
```

Each adapter implements `authorize`, `capture`, `refund`, `verifyWebhook`.

## Shared database, two clients

```
        ┌────────────┐        ┌────────────┐
        │  Web Admin │        │  Mobile    │
        │ (Next.js)  │        │ (Expo)     │
        └─────┬──────┘        └─────┬──────┘
              │  REST /api/v1        │
              └───────────┬──────────┘
                    ┌─────▼─────┐
                    │ NestJS API│  ← only DB client; RBAC, audit, validation
                    └─────┬─────┘
                    ┌─────▼─────────┐
                    │ Supabase      │  Postgres + Storage
                    │ (shared DB)   │
                    └───────────────┘
```
