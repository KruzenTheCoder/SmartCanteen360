"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";

const fields: Field[] = [
  { name: "name", label: "Meal name", required: true, placeholder: "Grilled Chicken & Veg" },
  { name: "imageUrl", label: "Meal photo (image URL)", type: "image", full: true, placeholder: "https://images.unsplash.com/…" },
  { name: "status", label: "Status", type: "select", defaultValue: "PUBLISHED", options: [
    { label: "Draft", value: "DRAFT" },
    { label: "Published", value: "PUBLISHED" },
    { label: "Archived", value: "ARCHIVED" },
  ] },
  { name: "costPrice", label: "Cost price (R)", type: "number", step: 0.01, defaultValue: 0 },
  { name: "retailPrice", label: "Retail price (R)", type: "number", step: 0.01, defaultValue: 0 },
  { name: "subsidyPrice", label: "Subsidy price (R)", type: "number", step: 0.01, defaultValue: 0 },
  { name: "capacity", label: "Daily capacity", type: "number" },
  { name: "description", label: "Description", type: "textarea", placeholder: "Freshly prepared daily…" },
];

export default function NewMealPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add Meal" description="Create a new meal for your menu." />
      <ResourceForm endpoint="/meals" fields={fields} redirectTo="/meals" submitLabel="Create meal" />
    </div>
  );
}
