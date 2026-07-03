"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceTable, type Column } from "@/components/shared/resource-table";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface EmployeeWallet {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  wallet?: { balance: number } | null;
}

const columns: Column<EmployeeWallet>[] = [
  { header: "Emp #", cell: (e) => <span className="font-mono text-xs">{e.employeeNumber}</span> },
  { header: "Employee", cell: (e) => <span className="font-medium">{e.firstName} {e.lastName}</span> },
  { header: "Balance", cell: (e) => formatCurrency(Number(e.wallet?.balance ?? 0)) },
  {
    header: "",
    className: "text-right",
    cell: () => (
      <Button variant="outline" size="sm">
        Top up
      </Button>
    ),
  },
];

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Wallets" description="Employee balances, top-ups and refunds." />
      <ResourceTable<EmployeeWallet>
        queryKey="wallets"
        endpoint="/employees"
        columns={columns}
        emptyTitle="No wallets yet"
        emptyDescription="Wallets are created automatically with each employee."
      />
    </div>
  );
}
