"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";

const fields: Field[] = [
  { name: "fullName", label: "Full name", required: true, placeholder: "Jane Admin" },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "password", label: "Temporary password", type: "password", required: true, placeholder: "At least 10 characters" },
  { name: "role", label: "Role", type: "select", defaultValue: "COMPANY_ADMIN", options: [
    { label: "Company Admin", value: "COMPANY_ADMIN" },
    { label: "HR", value: "HR" },
    { label: "Finance", value: "FINANCE" },
    { label: "Kitchen Manager", value: "KITCHEN_MANAGER" },
  ] },
];

export default function InviteTenantAdminPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Invite Admin" description="Create the first login for this tenant." />
      <ResourceForm
        endpoint={`/companies/${params.id}/invite`}
        fields={fields}
        redirectTo="/tenants"
        submitLabel="Create login"
      />
    </div>
  );
}
