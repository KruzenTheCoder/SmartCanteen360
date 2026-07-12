"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceTable, type Column } from "@/components/shared/resource-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface EmployeeWallet {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  wallet?: { balance: number } | null;
}

function WalletTopUp({ employeeId, name }: { employeeId: string; name: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [payroll, setPayroll] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    setBusy(true);
    try {
      await api.post(`/wallet/${employeeId}/topup`, { amount: value, payroll, description: payroll ? "Payroll top-up" : "Manual top-up" });
      toast.success(`Topped up ${formatCurrency(value)}`);
      await qc.invalidateQueries({ queryKey: ["wallets"] });
      setOpen(false);
      setAmount("");
    } catch (e) {
      toast.error("Top-up failed", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Top up
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Top up · {name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="amt">Amount (R)</Label>
              <Input id="amt" type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={payroll} onChange={(e) => setPayroll(e.target.checked)} />
              Payroll top-up
            </label>
            <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600" onClick={submit} disabled={busy}>
              {busy ? "Processing…" : "Add funds"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const columns: Column<EmployeeWallet>[] = [
  { header: "Emp #", cell: (e) => <span className="font-mono text-xs">{e.employeeNumber}</span> },
  { header: "Employee", cell: (e) => <span className="font-medium">{e.firstName} {e.lastName}</span> },
  { header: "Balance", cell: (e) => formatCurrency(Number(e.wallet?.balance ?? 0)) },
  {
    header: "",
    className: "text-right",
    cell: (e) => <WalletTopUp employeeId={e.id} name={`${e.firstName} ${e.lastName}`} />,
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
