"use client";

import Link from "next/link";
import { Plus, Building2, Palette, UserPlus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableSkeleton, EmptyState } from "@/components/shared/query-states";
import { useList } from "@/lib/hooks";

interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
}

export default function TenantsPage() {
  const { data, isLoading } = useList<Company>("companies", "/companies");
  const companies = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Tenants" description="White-label companies on the platform. Create, brand and onboard.">
        <Button asChild className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600">
          <Link href="/tenants/new">
            <Plus className="mr-2 h-4 w-4" /> New Tenant
          </Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <Card className="p-6"><TableSkeleton rows={3} cols={3} /></Card>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No tenants yet"
          description="Create your first white-label company to get started."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="h-2" style={{ backgroundColor: c.primaryColor ?? "#4f46e5" }} />
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center gap-3">
                  {c.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logoUrl} alt={c.name} className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white" style={{ backgroundColor: c.primaryColor ?? "#4f46e5" }}>
                      <Building2 className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.slug}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/tenants/${c.id}/edit`}>
                      <Palette className="mr-1.5 h-3.5 w-3.5" /> Branding
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/tenants/${c.id}/invite`}>
                      <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Invite admin
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
