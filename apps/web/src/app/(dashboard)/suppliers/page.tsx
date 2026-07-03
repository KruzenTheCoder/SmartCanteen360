"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceTable, type Column } from "@/components/shared/resource-table";
import { Button } from "@/components/ui/button";

interface Supplier {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
}

const columns: Column<Supplier>[] = [
  { header: "Supplier", cell: (s) => <span className="font-medium">{s.name}</span> },
  { header: "Contact", cell: (s) => s.contactName ?? "—" },
  { header: "Email", cell: (s) => s.email ?? "—" },
  { header: "Phone", cell: (s) => s.phone ?? "—" },
];

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" description="Vendors, contacts and purchase orders.">
        <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600">
          <Link href="/suppliers/new">
            <Plus className="mr-2 h-4 w-4" /> Add Supplier
          </Link>
        </Button>
      </PageHeader>
      <ResourceTable<Supplier>
        queryKey="suppliers"
        endpoint="/suppliers"
        columns={columns}
        emptyTitle="No suppliers yet"
        emptyDescription="Add suppliers to raise purchase orders and receive stock."
      />
    </div>
  );
}
