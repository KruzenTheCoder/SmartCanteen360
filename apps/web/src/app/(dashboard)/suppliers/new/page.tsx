"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";

const fields: Field[] = [
  { name: "name", label: "Supplier name", required: true },
  { name: "contactName", label: "Contact person" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "address", label: "Address", type: "textarea" },
];

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Add Supplier" description="Add a vendor for purchase orders." />
      <ResourceForm endpoint="/suppliers" fields={fields} redirectTo="/suppliers" submitLabel="Create supplier" />
    </div>
  );
}
