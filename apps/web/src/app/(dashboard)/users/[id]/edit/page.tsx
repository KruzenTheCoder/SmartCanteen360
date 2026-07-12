"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";
import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/shared/query-states";
import { useResource } from "@/lib/hooks";

const fields: Field[] = [
  { name: "fullName", label: "Full name" },
  { name: "role", label: "Role", type: "select", required: true, options: [
    { label: "Super Admin", value: "SUPER_ADMIN" },
    { label: "Company Admin", value: "COMPANY_ADMIN" },
    { label: "Kitchen Manager", value: "KITCHEN_MANAGER" },
    { label: "Kitchen Staff", value: "KITCHEN_STAFF" },
    { label: "Cashier", value: "CASHIER" },
    { label: "Inventory Manager", value: "INVENTORY_MANAGER" },
    { label: "Finance", value: "FINANCE" },
    { label: "HR", value: "HR" },
    { label: "Employee", value: "EMPLOYEE" },
    { label: "Auditor", value: "AUDITOR" },
  ] },
  { name: "status", label: "Status", type: "select", options: [
    { label: "Active", value: "ACTIVE" },
    { label: "Disabled", value: "DISABLED" },
  ] },
];

export default function EditUserPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useResource<Record<string, unknown>>("user", `/users/${params.id}`);
  return (
    <div className="space-y-6">
      <PageHeader title="Edit User" description="Change this user's role and status." />
      {isLoading || !data ? (
        <Card className="p-6"><TableSkeleton rows={3} /></Card>
      ) : (
        <ResourceForm endpoint={`/users/${params.id}`} method="patch" initial={data} fields={fields} redirectTo="/users" submitLabel="Save changes" />
      )}
    </div>
  );
}
