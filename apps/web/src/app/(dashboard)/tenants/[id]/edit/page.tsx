"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";
import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/shared/query-states";
import { useResource } from "@/lib/hooks";

const fields: Field[] = [
  { name: "name", label: "Company name", required: true },
  { name: "logoUrl", label: "Logo", type: "image", full: true },
  { name: "primaryColor", label: "Primary colour", type: "color" },
  { name: "secondaryColor", label: "Secondary colour", type: "color" },
  { name: "currency", label: "Currency" },
  { name: "timezone", label: "Timezone" },
  { name: "supportEmail", label: "Support email", type: "email" },
];

export default function EditTenantPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useResource<Record<string, unknown>>("company", `/companies/${params.id}`);
  return (
    <div className="space-y-6">
      <PageHeader title="Tenant Branding" description="Logo, colours and locale for this white-label company." />
      {isLoading || !data ? (
        <Card className="p-6"><TableSkeleton rows={4} /></Card>
      ) : (
        <ResourceForm
          endpoint={`/companies/${params.id}`}
          method="patch"
          initial={data}
          fields={fields}
          redirectTo="/tenants"
          submitLabel="Save branding"
        />
      )}
    </div>
  );
}
