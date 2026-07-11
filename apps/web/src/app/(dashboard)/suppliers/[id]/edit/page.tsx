"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";
import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/shared/query-states";
import { useResource } from "@/lib/hooks";

const fields: Field[] = [
  { name: "name", label: "Supplier name", required: true },
  { name: "contactName", label: "Contact person" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "address", label: "Address", type: "textarea" },
];

export default function EditSupplierPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useResource<Record<string, unknown>>("supplier", `/suppliers/${params.id}`);
  return (
    <div className="space-y-6">
      <PageHeader title="Edit Supplier" description="Update supplier contact details." />
      {isLoading || !data ? (
        <Card className="p-6"><TableSkeleton rows={4} /></Card>
      ) : (
        <ResourceForm endpoint={`/suppliers/${params.id}`} method="patch" initial={data} fields={fields} redirectTo="/suppliers" submitLabel="Save changes" />
      )}
    </div>
  );
}
