"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceForm, type Field } from "@/components/shared/resource-form";
import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/shared/query-states";
import { useResource } from "@/lib/hooks";

const fields: Field[] = [
  { name: "status", label: "Status", type: "select", required: true, options: [
    { label: "Pending", value: "PENDING" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Collected", value: "COLLECTED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "No show", value: "NO_SHOW" },
  ] },
];

export default function EditBookingPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useResource<Record<string, unknown>>("booking", `/bookings/${params.id}`);
  return (
    <div className="space-y-6">
      <PageHeader title="Update Booking" description="Change the fulfilment status of this booking." />
      {isLoading || !data ? (
        <Card className="p-6"><TableSkeleton rows={2} /></Card>
      ) : (
        <ResourceForm endpoint={`/bookings/${params.id}`} method="patch" initial={data} fields={fields} redirectTo="/bookings" submitLabel="Update status" />
      )}
    </div>
  );
}
