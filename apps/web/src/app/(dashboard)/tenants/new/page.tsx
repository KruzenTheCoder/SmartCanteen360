"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";

const fields: Field[] = [
  { name: "name", label: "Company name", required: true, placeholder: "Acme Foods" },
  { name: "slug", label: "Slug (URL id)", placeholder: "acme-foods" },
  { name: "logoUrl", label: "Logo", type: "image", full: true },
  { name: "primaryColor", label: "Primary colour", type: "color", defaultValue: "#4f46e5" },
  { name: "secondaryColor", label: "Secondary colour", type: "color", defaultValue: "#7c3aed" },
  { name: "currency", label: "Currency", defaultValue: "ZAR" },
  { name: "timezone", label: "Timezone", defaultValue: "Africa/Johannesburg" },
  { name: "supportEmail", label: "Support email", type: "email" },
];

export default function NewTenantPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Tenant" description="Provision a white-label company." />
      <ResourceForm endpoint="/companies" fields={fields} redirectTo="/tenants" submitLabel="Create tenant" />
    </div>
  );
}
