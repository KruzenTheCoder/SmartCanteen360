import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface TenantContext {
  userId: string;
  email: string;
  companyId: string | null;
  role: string;
  isSuperAdmin: boolean;
}

/**
 * Resolve the signed-in user's tenant + role for server-side data access.
 * Returns null when there is no valid session.
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("companyId, role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as string) ?? "EMPLOYEE";
  return {
    userId: user.id,
    email: user.email ?? "",
    companyId: (profile?.companyId as string | null) ?? null,
    role,
    isSuperAdmin: role === "SUPER_ADMIN",
  };
}
