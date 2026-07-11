"use client";

import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

import { useList } from "@/lib/hooks";
import { useBrand } from "@/components/brand-provider";
import { api } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface Company {
  id: string;
  name: string;
}

/** Lets a super admin "act as" a specific tenant (or view all tenants). */
export function TenantSwitcher() {
  const brand = useBrand();
  const router = useRouter();
  const { data } = useList<Company>("companies", "/companies");

  if (!isSupabaseConfigured || !brand.isSuperAdmin) return null;
  const companies = data?.data ?? [];

  const onChange = async (companyId: string) => {
    await api.post("/tenant/switch", { companyId });
    router.refresh();
  };

  return (
    <div className="hidden items-center gap-2 rounded-lg border px-2 py-1 md:flex">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <select
        value={brand.companyId ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm font-medium outline-none"
        aria-label="Switch tenant"
      >
        <option value="">All tenants</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
