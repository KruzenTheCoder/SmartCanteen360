"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceTable, type Column } from "@/components/shared/resource-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Booking {
  id: string;
  bookingRef: string;
  status: string;
  quantity: number;
  totalPrice: number;
  employee?: { employeeNumber: string; firstName: string; lastName: string };
  schedule?: { meal?: { name: string }; serviceDate?: string };
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "info" | "secondary"> = {
  CONFIRMED: "info",
  COLLECTED: "success",
  PENDING: "warning",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
  EXPIRED: "secondary",
};

const columns: Column<Booking>[] = [
  { header: "Ref", cell: (b) => <span className="font-mono text-xs">{b.bookingRef}</span> },
  {
    header: "Employee",
    cell: (b) => (b.employee ? `${b.employee.firstName} ${b.employee.lastName}` : "—"),
  },
  { header: "Meal", cell: (b) => b.schedule?.meal?.name ?? "—" },
  { header: "Qty", cell: (b) => b.quantity },
  { header: "Total", cell: (b) => formatCurrency(Number(b.totalPrice)) },
  { header: "Status", cell: (b) => <Badge variant={statusVariant[b.status] ?? "secondary"}>{b.status}</Badge> },
];

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="All pre-orders and their fulfilment status.">
        <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600">
          <Link href="/bookings/new">
            <Plus className="mr-2 h-4 w-4" /> New Booking
          </Link>
        </Button>
      </PageHeader>
      <ResourceTable<Booking>
        queryKey="bookings"
        endpoint="/bookings"
        columns={columns}
        resource="bookings"
        emptyTitle="No bookings yet"
        emptyDescription="Bookings placed by employees will appear here."
      />
    </div>
  );
}
