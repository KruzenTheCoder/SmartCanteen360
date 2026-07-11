import "server-only";

import type { NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface TenantContext {
  userId: string;
  email: string;
  companyId: string | null;
  role: string;
  isSuperAdmin: boolean;
  employeeId: string | null;
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
  return {
    userId,
    email,
    companyId: (profile?.companyId as string | null) ?? null,
    role,
    isSuperAdmin: role === "SUPER_ADMIN",
    employeeId: (profile?.employeeId as string | null) ?? null,
  };
}
