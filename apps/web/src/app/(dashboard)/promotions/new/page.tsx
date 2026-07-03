"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";

const fields: Field[] = [
  { name: "name", label: "Promotion name", required: true, placeholder: "Burger Friday" },
  { name: "type", label: "Type", type: "select", required: true, options: [
    { label: "Percentage discount", value: "PERCENTAGE_DISCOUNT" },
    { label: "Fixed discount", value: "FIXED_DISCOUNT" },
    { label: "Combo", value: "COMBO" },
    { label: "Buy X get Y", value: "BUY_X_GET_Y" },
    { label: "Loyalty multiplier", value: "LOYALTY_MULTIPLIER" },
    { label: "Lucky draw", value: "LUCKY_DRAW" },
  ] },
  { name: "priority", label: "Priority", type: "number", defaultValue: 0 },
];

export default function NewPromotionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Promotion" description="Create a discount rule or campaign." />
      <ResourceForm endpoint="/promotions" fields={fields} redirectTo="/promotions" submitLabel="Create promotion" />
    </div>
  );
}
