"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";

const fields: Field[] = [
  { name: "sku", label: "SKU", required: true, placeholder: "VEG-001" },
  { name: "name", label: "Product name", required: true },
  { name: "unit", label: "Unit", defaultValue: "unit", placeholder: "kg, case, unit" },
  { name: "barcode", label: "Barcode" },
  { name: "reorderLevel", label: "Reorder level", type: "number", step: 0.001, defaultValue: 0 },
  { name: "unitCost", label: "Unit cost (R)", type: "number", step: 0.01, defaultValue: 0 },
];

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add Product" description="Add an inventory item to track stock." />
      <ResourceForm endpoint="/inventory" fields={fields} redirectTo="/inventory" submitLabel="Create product" />
    </div>
  );
}
