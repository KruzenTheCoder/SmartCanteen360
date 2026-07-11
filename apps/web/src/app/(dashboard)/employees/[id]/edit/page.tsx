"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";
import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/shared/query-states";
import { useResource } from "@/lib/hooks";

const fields: Field[] = [
  { name: "status", label: "Status", type: "select", options: [
    { label: "Active", value: "ACTIVE" },
    { label: "On leave", value: "ON_LEAVE" },
    { label: "Suspended", value: "SUSPENDED" },
    { label: "Terminated", value: "TERMINATED" },
  ] },
  { name: "firstName", label: "First name", required: true },
  { name: "lastName", label: "Last name", required: true },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "mealSubsidy", label: "Meal subsidy (R)", type: "number", step: 0.01 },
];

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useResource<Record<string, unknown>>("employee", `/employees/${params.id}`);
  return (
    <div className="space-y-6">
      <PageHeader title="Edit Employee" description="Update employee details and subsidy." />
      {isLoading || !data ? (
        <Card className="p-6"><TableSkeleton rows={4} /></Card>
      ) : (
        <ResourceForm endpoint={`/employees/${params.id}`} method="patch" initial={data} fields={fields} redirectTo="/employees" submitLabel="Save changes" />
      )}
    </div>
  );
}
