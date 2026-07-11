"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";
import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/shared/query-states";
import { useResource } from "@/lib/hooks";

const fields: Field[] = [
  { name: "name", label: "Promotion name", required: true },
  { name: "type", label: "Type", type: "select", options: [
    { label: "Percentage discount", value: "PERCENTAGE_DISCOUNT" },
    { label: "Fixed discount", value: "FIXED_DISCOUNT" },
    { label: "Combo", value: "COMBO" },
    { label: "Buy X get Y", value: "BUY_X_GET_Y" },
    { label: "Loyalty multiplier", value: "LOYALTY_MULTIPLIER" },
    { label: "Lucky draw", value: "LUCKY_DRAW" },
  ] },
  { name: "priority", label: "Priority", type: "number" },
];

export default function EditPromotionPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useResource<Record<string, unknown>>("promotion", `/promotions/${params.id}`);
  return (
    <div className="space-y-6">
      <PageHeader title="Edit Promotion" description="Update the discount rule." />
      {isLoading || !data ? (
        <Card className="p-6"><TableSkeleton rows={4} /></Card>
      ) : (
        <ResourceForm endpoint={`/promotions/${params.id}`} method="patch" initial={data} fields={fields} redirectTo="/promotions" submitLabel="Save changes" />
      )}
    </div>
  );
}
