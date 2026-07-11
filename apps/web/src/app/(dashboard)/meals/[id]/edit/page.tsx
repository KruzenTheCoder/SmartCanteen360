"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";
import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/shared/query-states";
import { useResource } from "@/lib/hooks";

const fields: Field[] = [
  { name: "name", label: "Meal name", required: true },
  { name: "imageUrl", label: "Meal photo (image URL)", type: "image", full: true },
  { name: "status", label: "Status", type: "select", options: [
    { label: "Draft", value: "DRAFT" },
    { label: "Published", value: "PUBLISHED" },
    { label: "Archived", value: "ARCHIVED" },
  ] },
  { name: "costPrice", label: "Cost price (R)", type: "number", step: 0.01 },
  { name: "retailPrice", label: "Retail price (R)", type: "number", step: 0.01 },
  { name: "subsidyPrice", label: "Subsidy price (R)", type: "number", step: 0.01 },
  { name: "capacity", label: "Daily capacity", type: "number" },
  { name: "description", label: "Description", type: "textarea" },
];

export default function EditMealPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useResource<Record<string, unknown>>("meal", `/meals/${params.id}`);

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Meal" description="Update this meal's details and photo." />
      {isLoading || !data ? (
        <Card className="p-6"><TableSkeleton rows={4} /></Card>
      ) : (
        <ResourceForm
          endpoint={`/meals/${params.id}`}
          method="patch"
          initial={data}
          fields={fields}
          redirectTo="/meals"
          submitLabel="Save changes"
        />
      )}
    </div>
  );
}
