import { createClient } from "./server";
import { isSupabaseConfigured } from "./config";
import { DEFAULT_BRAND, type Brand } from "../branding";

/**
 * Resolve the signed-in user's tenant + role + white-label branding (server
 * side). Falls back to the default NetBite360 brand in demo mode.
 */
export async function getBrand(): Promise<Brand> {
  if (!isSupabaseConfigured) return DEFAULT_BRAND;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_BRAND;

  const { data: profile } = await supabase
    .from("profiles")
    .select('role, companyId, company:companies(name, logoUrl, primaryColor)')
    .eq("id", user.id)
    .single();

  const company = (profile?.company ?? null) as
    | { name: string; logoUrl: string | null; primaryColor: string | null }
    | null;

  const role = (profile?.role as string) ?? "EMPLOYEE";
  return {
    name: company?.name ?? "NetBite360",
    logoUrl: company?.logoUrl ?? null,
    primaryColor: company?.primaryColor ?? "#4f46e5",
    companyId: (profile?.companyId as string) ?? null,
    role,
    isSuperAdmin: role === "SUPER_ADMIN",
  };
}
