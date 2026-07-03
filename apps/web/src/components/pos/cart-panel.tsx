"use client";

import { useState } from "react";
import { Minus, Plus, Trash2, UserPlus, UserCheck, Pause, X, ScanLine } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { usePos, computeTotals, type Customer } from "@/lib/pos/store";
import { TenderDialog } from "./tender-dialog";

interface EmployeeLookup {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  wallet?: { balance: number } | null;
  loyaltyAccount?: { pointsBalance: number } | null;
}

export function CartPanel() {
  const { cart, customer, discount, inc, dec, removeLine, setDiscount, clearCart, setCustomer, hold, completeSale } = usePos();
  const totals = computeTotals(cart, discount);

  const [tenderOpen, setTenderOpen] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupCode, setLookupCode] = useState("");
  const [looking, setLooking] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountInput, setDiscountInput] = useState("");

  const doLookup = async () => {
    if (!lookupCode.trim()) return;
    setLooking(true);
    try {
      const emp = await api.get<EmployeeLookup>(`/pos/lookup/${encodeURIComponent(lookupCode.trim())}`);
      const c: Customer = {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        employeeNumber: emp.employeeNumber,
        walletBalance: Number(emp.wallet?.balance ?? 0),
        loyaltyPoints: Number(emp.loyaltyAccount?.pointsBalance ?? 0),
      };
      setCustomer(c);
      setLookupOpen(false);
      setLookupCode("");
    } catch (e) {
      toast.error("Customer not found", { description: (e as Error).message });
    } finally {
      setLooking(false);
    }
  };

  const onComplete = (payments: Parameters<typeof completeSale>[0], change: number) => {
    const cashier = auth.getUser()?.email ?? "cashier";
    const sale = completeSale(payments, change, cashier);
    if (sale) {
      // Best-effort backend sync (demo returns ok).
      void api
        .post("/pos/checkout", {
          employeeId: sale.customer?.id,
          method: payments[0]?.method ?? "CASH",
          discount: sale.discount,
          items: sale.lines.map((l) => ({ retailProductId: l.kind === "retail" ? l.id : undefined, label: l.label, quantity: l.qty, unitPrice: l.unitPrice })),
        })
        .catch(() => undefined);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Customer */}
      {customer ? (
        <div className="mb-3 flex items-center justify-between rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm font-medium">{customer.name}</p>
              <p className="text-xs text-muted-foreground">
                {customer.employeeNumber} · {formatCurrency(customer.walletBalance)} · {customer.loyaltyPoints} pts
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCustomer(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" className="mb-3 w-full" onClick={() => setLookupOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Attach customer
        </Button>
      )}

      {/* Lines */}
      <div className="flex-1 overflow-auto">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <ScanLine className="mb-2 h-8 w-8" />
            Add items from the left to start a sale
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((l) => (
              <div key={l.id} className="flex items-center gap-2 rounded-lg border p-2">
                <div className="flex-1">
                  <p className="text-sm font-medium leading-tight">{l.label}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(l.unitPrice)} each</p>
                </div>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => dec(l.id)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-5 text-center text-sm">{l.qty}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => inc(l.id)}>
                  <Plus className="h-3 w-3" />
                </Button>
                <span className="w-16 text-right text-sm font-medium">{formatCurrency(l.unitPrice * l.qty)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeLine(l.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="mt-3 space-y-1.5 border-t pt-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>
        <button className="flex w-full justify-between text-muted-foreground hover:text-foreground" onClick={() => { setDiscountInput(discount ? String(discount) : ""); setDiscountOpen(true); }}>
          <span>Discount</span>
          <span>{discount ? `- ${formatCurrency(discount)}` : "Add"}</span>
        </button>
        <div className="flex justify-between text-muted-foreground">
          <span>VAT (15% incl)</span>
          <span>{formatCurrency(totals.vat)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatCurrency(totals.total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={hold} disabled={cart.length === 0}>
          <Pause className="mr-2 h-4 w-4" /> Hold
        </Button>
        <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>
          <Trash2 className="mr-2 h-4 w-4" /> Clear
        </Button>
      </div>
      <Button
        className="mt-2 h-12 w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-base"
        disabled={cart.length === 0}
        onClick={() => setTenderOpen(true)}
      >
        Pay {formatCurrency(totals.total)}
      </Button>

      <TenderDialog open={tenderOpen} onOpenChange={setTenderOpen} total={totals.total} customer={customer} onComplete={onComplete} />

      {/* Customer lookup dialog */}
      <Dialog open={lookupOpen} onOpenChange={setLookupOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Attach customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="code">Scan QR or enter employee number</Label>
            <Input
              id="code"
              autoFocus
              placeholder="E-0001"
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doLookup()}
            />
            <Button className="w-full" onClick={doLookup} disabled={looking}>
              {looking ? "Looking up…" : "Attach"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount dialog */}
      <Dialog open={discountOpen} onOpenChange={setDiscountOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Apply discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="disc">Discount amount (R)</Label>
            <Input id="disc" type="number" min={0} step={0.5} value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setDiscount(0); setDiscountOpen(false); }}>
                Remove
              </Button>
              <Button className="flex-1" onClick={() => { setDiscount(Number(discountInput) || 0); setDiscountOpen(false); }}>
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
