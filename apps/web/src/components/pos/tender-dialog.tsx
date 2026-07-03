"use client";

import { useEffect, useRef, useState } from "react";
import {
  Banknote,
  CreditCard,
  Wallet as WalletIcon,
  Star,
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  Delete,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getTerminal, type TerminalStage } from "@/lib/pos/card-terminal";
import type { Customer, Payment, PaymentMethod } from "@/lib/pos/store";

type View = "methods" | "cash" | "card" | "wallet" | "loyalty" | "payroll";

interface TenderDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  total: number;
  customer: Customer | null;
  onComplete: (payments: Payment[], change: number) => void;
}

const METHODS: { key: View; method: PaymentMethod; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "cash", method: "CASH", label: "Cash", icon: Banknote },
  { key: "card", method: "CARD", label: "Card machine", icon: CreditCard },
  { key: "wallet", method: "WALLET", label: "Wallet", icon: WalletIcon },
  { key: "loyalty", method: "LOYALTY", label: "Loyalty points", icon: Star },
  { key: "payroll", method: "PAYROLL", label: "Payroll deduction", icon: Building2 },
];

export function TenderDialog({ open, onOpenChange, total, customer, onComplete }: TenderDialogProps) {
  const [view, setView] = useState<View>("methods");
  const [tenderedCents, setTenderedCents] = useState(0);

  // Card terminal state
  const [stage, setStage] = useState<TerminalStage>("idle");
  const [terminalMsg, setTerminalMsg] = useState("");
  const chargingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setView("methods");
      setTenderedCents(0);
      setStage("idle");
    }
  }, [open]);

  const finish = (payments: Payment[], change = 0) => {
    onComplete(payments, change);
    onOpenChange(false);
  };

  // ---- Card machine flow ----
  const startCard = async () => {
    if (chargingRef.current) return;
    chargingRef.current = true;
    setStage("connecting");
    const terminal = getTerminal();
    const result = await terminal.charge({ amount: total, currency: "ZAR" }, (u) => {
      setStage(u.stage);
      setTerminalMsg(u.message);
    });
    chargingRef.current = false;
    if (result.approved) {
      setTimeout(
        () =>
          finish([
            {
              method: "CARD",
              amount: total,
              authCode: result.authCode,
              cardScheme: result.cardScheme,
              maskedPan: result.maskedPan,
            },
          ]),
        700,
      );
    }
  };

  useEffect(() => {
    if (view === "card" && stage === "idle") void startCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const cancelCard = () => {
    getTerminal().cancel();
    setView("methods");
    setStage("idle");
  };

  const tendered = tenderedCents / 100;
  const change = Math.max(0, tendered - total);
  const keypad = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "00", "0", "⌫"];
  const press = (k: string) => {
    if (k === "⌫") setTenderedCents((c) => Math.floor(c / 10));
    else if (k === "00") setTenderedCents((c) => c * 100);
    else setTenderedCents((c) => c * 10 + Number(k));
  };

  const walletOk = (customer?.walletBalance ?? 0) >= total;
  const pointsNeeded = Math.ceil(total);
  const loyaltyOk = (customer?.loyaltyPoints ?? 0) >= pointsNeeded;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" hideClose={view === "card" && stage !== "declined" && stage !== "idle"}>
        <DialogHeader>
          <DialogTitle>
            {view === "methods" ? `Take payment · ${formatCurrency(total)}` : ""}
            {view === "cash" ? "Cash" : ""}
            {view === "card" ? "Card machine" : ""}
            {view === "wallet" ? "Wallet" : ""}
            {view === "loyalty" ? "Loyalty points" : ""}
            {view === "payroll" ? "Payroll deduction" : ""}
          </DialogTitle>
        </DialogHeader>

        {/* Method selection */}
        {view === "methods" && (
          <div className="grid grid-cols-2 gap-3">
            {METHODS.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  onClick={() => setView(m.key)}
                  className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:border-primary hover:bg-muted/50"
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">{m.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Cash */}
        {view === "cash" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground">Tendered</p>
              <p className="text-3xl font-bold">{formatCurrency(tendered)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Change due: <span className="font-semibold text-foreground">{formatCurrency(change)}</span>
              </p>
            </div>
            <div className="flex gap-2">
              {[total, 50, 100, 200].map((q, i) => (
                <Button key={i} variant="outline" size="sm" className="flex-1" onClick={() => setTenderedCents(Math.round(q * 100))}>
                  {i === 0 ? "Exact" : formatCurrency(q)}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {keypad.map((k) => (
                <Button key={k} variant="outline" className="h-12 text-lg" onClick={() => press(k)}>
                  {k === "⌫" ? <Delete className="h-5 w-5" /> : k}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setView("methods")}>Back</Button>
              <Button
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600"
                disabled={tendered < total}
                onClick={() => finish([{ method: "CASH", amount: total }], change)}
              >
                Complete
              </Button>
            </div>
          </div>
        )}

        {/* Card machine */}
        {view === "card" && (
          <div className="space-y-6 py-4 text-center">
            <div className="flex flex-col items-center gap-3">
              {stage === "approved" ? (
                <CheckCircle2 className="h-14 w-14 text-green-500" />
              ) : stage === "declined" ? (
                <XCircle className="h-14 w-14 text-red-500" />
              ) : (
                <div className="relative">
                  <CreditCard className="h-14 w-14 text-primary" />
                  <Loader2 className="absolute -right-3 -top-2 h-5 w-5 animate-spin text-primary" />
                </div>
              )}
              <p className="text-lg font-semibold">{formatCurrency(total)}</p>
              <p className="text-sm text-muted-foreground">{terminalMsg || "Preparing terminal…"}</p>
            </div>

            {stage === "declined" && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setView("methods")}>Change method</Button>
                <Button className="flex-1" onClick={() => { setStage("idle"); void startCard(); }}>Retry</Button>
              </div>
            )}
            {stage !== "approved" && stage !== "declined" && (
              <Button variant="ghost" className="text-muted-foreground" onClick={cancelCard}>
                Cancel payment
              </Button>
            )}
          </div>
        )}

        {/* Wallet */}
        {view === "wallet" && (
          <TenderConfirm
            ok={walletOk}
            okLabel={`Charge ${formatCurrency(total)} to wallet`}
            errorLabel="Insufficient wallet balance"
            detail={customer ? `Balance: ${formatCurrency(customer.walletBalance)}` : "No customer attached"}
            enabled={!!customer && walletOk}
            onBack={() => setView("methods")}
            onConfirm={() => finish([{ method: "WALLET", amount: total }])}
          />
        )}

        {/* Loyalty */}
        {view === "loyalty" && (
          <TenderConfirm
            ok={loyaltyOk}
            okLabel={`Redeem ${pointsNeeded} points`}
            errorLabel="Not enough points"
            detail={customer ? `Available: ${customer.loyaltyPoints} pts` : "No customer attached"}
            enabled={!!customer && loyaltyOk}
            onBack={() => setView("methods")}
            onConfirm={() => finish([{ method: "LOYALTY", amount: total }])}
          />
        )}

        {/* Payroll */}
        {view === "payroll" && (
          <TenderConfirm
            ok={!!customer}
            okLabel={`Deduct ${formatCurrency(total)} from payroll`}
            errorLabel="Attach a customer first"
            detail={customer ? `${customer.name} · ${customer.employeeNumber}` : "No customer attached"}
            enabled={!!customer}
            onBack={() => setView("methods")}
            onConfirm={() => finish([{ method: "PAYROLL", amount: total }])}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TenderConfirm({
  ok,
  okLabel,
  errorLabel,
  detail,
  enabled,
  onBack,
  onConfirm,
}: {
  ok: boolean;
  okLabel: string;
  errorLabel: string;
  detail: string;
  enabled: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className={`rounded-lg p-4 text-center ${ok ? "bg-muted/50" : "bg-red-50 dark:bg-red-950/40"}`}>
        <p className={`text-sm font-medium ${ok ? "" : "text-red-600"}`}>{ok ? detail : errorLabel}</p>
        {ok ? null : <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>Back</Button>
        <Button className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600" disabled={!enabled} onClick={onConfirm}>
          {okLabel}
        </Button>
      </div>
    </div>
  );
}
