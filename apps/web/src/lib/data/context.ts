import "server-only";

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Cookie a super admin sets to "act as" a specific tenant. */
export const ACTIVE_COMPANY_COOKIE = "nb_active_company";

export interface TenantContext {
  userId: string;
  email: string;
  /** The user's home company (from their profile). */
  companyId: string | null;
  role: string;
  isSuperAdmin: boolean;
  employeeId: string | null;
  /**
   * The company data should be scoped to. For normal users this equals their
   * home company. For a super admin it is the tenant they've switched to, or
   * null meaning "all tenants".
   */
  activeCompanyId: string | null;
}

/**
 * Resolve the signed-in user's tenant + role for server-side data access.
 * Accepts either a cookie session (web) or an `Authorization: Bearer <jwt>`
 * header (mobile). Returns null when there is no valid session.
 */
export async function getTenantContext(req?: NextRequest): Promise<TenantContext | null> {
  let userId: string | undefined;
  let email = "";

  // 1) Bearer token (mobile / API clients)
  const authHeader = req?.headers.get("authorization") ?? req?.headers.get("Authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7);
    const { data } = await createAdminClient().auth.getUser(token);
    if (data.user) {
      userId = data.user.id;
      email = data.user.email ?? "";
    }
  }

  // 2) Cookie session (web)
  if (!userId) {
    const {
      data: { user },
    } = await createClient().auth.getUser();
    if (user) {
      userId = user.id;
      email = user.email ?? "";
    }
  }

  if (!userId) return null;

  // Profile lookup via service role (works for both auth paths).
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("companyId, role, employeeId")
    .eq("id", userId)
    .single();

  const role = (profile?.role as string) ?? "EMPLOYEE";
  const isSuperAdmin = role === "SUPER_ADMIN";
  const companyId = (profile?.companyId as string | null) ?? null;

  // Super admins may switch tenants via a cookie; everyone else is pinned.
  let activeCompanyId = companyId;
  if (isSuperAdmin) {
    let selected: string | null = null;
    try {
      selected = cookies().get(ACTIVE_COMPANY_COOKIE)?.value ?? null;
    } catch {
      selected = null;
    }
    activeCompanyId = selected || null; // null = all tenants
  }

  return {
    userId,
    email,
    companyId,
    role,
    isSuperAdmin,
    employeeId: (profile?.employeeId as string | null) ?? null,
    activeCompanyId,
  };
}
