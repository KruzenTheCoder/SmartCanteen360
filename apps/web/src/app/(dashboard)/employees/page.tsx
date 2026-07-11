"use client";

import Link from "next/link";
import { Plus, Upload } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceTable, type Column } from "@/components/shared/resource-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  status: string;
  department?: { name: string } | null;
  wallet?: { balance: number } | null;
  loyaltyAccount?: { pointsBalance: number; tier: string } | null;
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  ACTIVE: "success",
  ON_LEAVE: "warning",
  SUSPENDED: "warning",
  TERMINATED: "destructive",
};

const columns: Column<Employee>[] = [
  { header: "Emp #", cell: (e) => <span className="font-mono text-xs">{e.employeeNumber}</span> },
  { header: "Name", cell: (e) => <span className="font-medium">{e.firstName} {e.lastName}</span> },
  { header: "Department", cell: (e) => e.department?.name ?? "—" },
  { header: "Wallet", cell: (e) => formatCurrency(Number(e.wallet?.balance ?? 0)) },
  { header: "Loyalty", cell: (e) => `${e.loyaltyAccount?.pointsBalance ?? 0} pts` },
  {
    header: "Status",
    cell: (e) => <Badge variant={statusVariant[e.status] ?? "secondary"}>{e.status}</Badge>,
  },
];

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Employees" description="Manage staff, subsidies, wallets and loyalty.">
        <Button asChild variant="outline">
          <Link href="/employees/import">
            <Upload className="mr-2 h-4 w-4" /> Import
          </Link>
        </Button>
        <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600">
          <Link href="/employees/new">
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Link>
        </Button>
      </PageHeader>

      <ResourceTable<Employee>
        queryKey="employees"
        endpoint="/employees"
        columns={columns}
        resource="employees"
        emptyTitle="No employees yet"
        emptyDescription="Add employees individually or bulk-import from CSV."
      />
    </div>
  );
}
