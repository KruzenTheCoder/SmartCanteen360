import { isSupabaseConfigured } from "./config";
import { createAdminClient } from "./admin";
import { getTenantContext } from "@/lib/data/context";
import { DEFAULT_BRAND, type Brand } from "../branding";

/**
 * Resolve white-label branding for the shell (server side). Reflects the tenant
 * a super admin has switched to; falls back to the platform brand in demo mode
 * or when a super admin has no active tenant selected.
 */
export async function getBrand(): Promise<Brand> {
  if (!isSupabaseConfigured) return DEFAULT_BRAND;

  const ctx = await getTenantContext();
  if (!ctx) return DEFAULT_BRAND;

  interface CompanyBrand {
    name: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
  }
  let company: CompanyBrand | null = null;
  if (ctx.activeCompanyId) {
    const { data } = await createAdminClient()
      .from("companies")
      .select("name, logoUrl, primaryColor")
      .eq("id", ctx.activeCompanyId)
      .single();
    if (data) company = data as CompanyBrand;
  }

  return {
    name: company?.name ?? "NetBite360",
    logoUrl: company?.logoUrl ?? null,
    primaryColor: company?.primaryColor ?? "#4f46e5",
    companyId: ctx.activeCompanyId,
    role: ctx.role,
    isSuperAdmin: ctx.isSuperAdmin,
  };
}
