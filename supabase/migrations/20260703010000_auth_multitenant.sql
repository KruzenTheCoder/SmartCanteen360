-- ============================================================================
-- NetBite360 — multi-tenant auth, RBAC and white-label layer (Supabase)
--
-- Prereq: apply the Prisma init migration first (creates companies, employees,
-- meals, … tables). Then run this in the Supabase SQL editor (or `supabase db
-- push`). It links Supabase Auth users to companies + roles, adds tenant RLS,
-- and adds white-label branding.
-- ============================================================================

-- 1) White-label branding on the tenant --------------------------------------
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS "primaryColor" TEXT DEFAULT '#4f46e5';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT DEFAULT '#7c3aed';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS "supportEmail" TEXT;

-- 2) Roles enum for profiles (mirror of the app RBAC) ------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'SUPER_ADMIN','COMPANY_ADMIN','KITCHEN_MANAGER','KITCHEN_STAFF','CASHIER',
    'INVENTORY_MANAGER','FINANCE','HR','EMPLOYEE','AUDITOR'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Profiles: link auth.users -> company + role -----------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "companyId" TEXT REFERENCES public.companies(id) ON DELETE SET NULL,
  role        public.app_role NOT NULL DEFAULT 'EMPLOYEE',
  "fullName"  TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Helper functions used by RLS --------------------------------------------
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT "companyId" FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN');
$$;

-- 5) RLS on profiles ---------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_self_read ON public.profiles;
CREATE POLICY profiles_self_read ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_super_admin() OR "companyId" = public.current_company_id());

DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_super_admin());

-- 6) Auto-create a profile when a new auth user signs up ---------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, "companyId", role, "fullName")
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data->>'companyId','')::TEXT,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'EMPLOYEE'),
    NEW.raw_user_meta_data->>'fullName'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7) Tenant isolation on every table that has a companyId column -------------
--    (super admins see all tenants; everyone else only their own company)
DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'companyId'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I FOR ALL TO authenticated '
      'USING (public.is_super_admin() OR "companyId" = public.current_company_id()) '
      'WITH CHECK (public.is_super_admin() OR "companyId" = public.current_company_id())',
      tbl
    );
  END LOOP;
END $$;

-- 8) Companies table: a user may read/write only their own company -----------
DROP POLICY IF EXISTS company_access ON public.companies;
CREATE POLICY company_access ON public.companies
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR id = public.current_company_id())
  WITH CHECK (public.is_super_admin());

-- NOTE: child tables without a companyId column (meal_nutrition, booking_items,
-- wallet_transactions, pos_items, …) are reached through the app's server layer
-- using the service-role key with explicit tenant scoping, so they stay locked
-- to anon/authenticated by the earlier RLS-enable migration. Add EXISTS-based
-- policies here later if you want direct client access to them.

-- 9) Seed a demo tenant (idempotent) -----------------------------------------
INSERT INTO public.companies (id, name, slug, currency, timezone, "isActive", "primaryColor", "updatedAt")
VALUES ('netbite-demo', 'NetBite360 Demo', 'netbite-demo', 'ZAR', 'Africa/Johannesburg', true, '#4f46e5', now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CREATE YOUR SUPER ADMIN (run after creating the auth user)
--
--   1. Supabase → Authentication → Users → Add user
--      email: admin@netbite360.io   (set a password, mark email confirmed)
--   2. Copy that user's UUID, then:
--
--   UPDATE public.profiles
--   SET role = 'SUPER_ADMIN', "companyId" = 'netbite-demo', "fullName" = 'Platform Owner'
--   WHERE id = '<AUTH_USER_UUID>';
--
-- Super admins bypass tenant isolation and can manage every company.
-- ============================================================================
