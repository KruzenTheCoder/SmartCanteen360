"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";
import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/shared/query-states";
import { useResource } from "@/lib/hooks";

const fields: Field[] = [
  { name: "name", label: "Product name", required: true },
  { name: "unit", label: "Unit" },
  { name: "barcode", label: "Barcode" },
  { name: "reorderLevel", label: "Reorder level", type: "number", step: 0.001 },
  { name: "unitCost", label: "Unit cost (R)", type: "number", step: 0.01 },
];

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useResource<Record<string, unknown>>("product", `/inventory/${params.id}`);
  return (
    <div className="space-y-6">
      <PageHeader title="Edit Product" description="Update stock item details." />
      {isLoading || !data ? (
        <Card className="p-6"><TableSkeleton rows={4} /></Card>
      ) : (
        <ResourceForm endpoint={`/inventory/${params.id}`} method="patch" initial={data} fields={fields} redirectTo="/inventory" submitLabel="Save changes" />
      )}
    </div>
  );
}
