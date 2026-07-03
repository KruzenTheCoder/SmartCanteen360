"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";

const fields: Field[] = [
  { name: "firstName", label: "First name", required: true },
  { name: "lastName", label: "Last name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "password", label: "Temporary password", required: true, placeholder: "At least 10 characters" },
  { name: "role", label: "Role", type: "select", required: true, options: [
    { label: "Company Admin", value: "COMPANY_ADMIN" },
    { label: "Kitchen Manager", value: "KITCHEN_MANAGER" },
    { label: "Kitchen Staff", value: "KITCHEN_STAFF" },
    { label: "Cashier", value: "CASHIER" },
    { label: "Inventory Manager", value: "INVENTORY_MANAGER" },
    { label: "Finance", value: "FINANCE" },
    { label: "HR", value: "HR" },
    { label: "Auditor", value: "AUDITOR" },
  ] },
];

export default function NewUserPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Invite User" description="Create an admin or staff account." />
      <ResourceForm endpoint="/users" fields={fields} redirectTo="/users" submitLabel="Create user" />
    </div>
  );
}
