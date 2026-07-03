# Supabase + Prisma workflow

SmartCanteen 360 uses **Supabase (managed PostgreSQL)** as the single shared
database for the web admin and mobile app, accessed only through the NestJS API.

## Who owns what

| Concern | Owner | Location |
|---------|-------|----------|
| Application tables (`public` schema) | **Prisma** | `prisma/migrations/**` |
| Row-Level Security enablement | Prisma | `prisma/migrations/20260703000100_enable_rls` |
| Storage buckets, extensions | **Supabase CLI** | `../../supabase/migrations/**` |
| Seed data (RBAC, demo tenant) | Prisma seed | `prisma/seed.ts` |

Tables are **not** duplicated into `supabase/migrations` — that would double-manage
the schema. Prisma is the single source of truth for `public`.

## Connection strings (`.env`)

Supabase gives you two URLs — use both:

```env
# Pooled (PgBouncer, port 6543) — runtime queries
DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
# Direct (port 5432) — migrations / introspection
DIRECT_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

Prisma runs migrations over `DIRECT_URL` and the app queries over `DATABASE_URL`
(already wired in `schema.prisma`).

## First-time setup (order matters)

```bash
# 1. Application schema + RLS  → your Supabase Postgres
pnpm db:generate
pnpm db:migrate:deploy          # applies prisma/migrations/* over DIRECT_URL

# 2. Supabase platform objects (storage bucket, extensions)
supabase link --project-ref <ref>
supabase db push                # applies supabase/migrations/*

# 3. Seed RBAC + demo tenant + admin user
pnpm db:seed
```

`db:migrate:deploy` maps to `prisma migrate deploy`. Use **deploy** (not
`migrate dev`) against Supabase so the committed migrations are applied as-is.

## Migrations included

- `20260703000000_init` — all 47 tables, enums, indexes and foreign keys.
- `20260703000100_enable_rls` — enables RLS on every table (defence-in-depth:
  the anon/authenticated Supabase roles get no direct table access; the API
  connects as the service role which bypasses RLS).

## Changing the schema later

Edit `schema.prisma`, then locally:

```bash
pnpm db:migrate --name <change_name>   # prisma migrate dev, generates a new migration
```

Commit the new folder under `prisma/migrations/`, and it ships via
`prisma migrate deploy` in CI/CD.
