"use client";

import { useMemo, useState } from "react";
import { PlayCircle, Clock, RotateCcw, Trash2, Receipt, DoorClosed } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { usePos, type PaymentMethod } from "@/lib/pos/store";

export function OpenShiftScreen() {
  const openShift = usePos((s) => s.openShift);
  const [float, setFloat] = useState("500");

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-4 p-6 text-center">
          <PlayCircle className="mx-auto h-12 w-12 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Open a till session</h2>
            <p className="text-sm text-muted-foreground">Enter the opening cash float to begin.</p>
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="float">Opening float (R)</Label>
            <Input id="float" type="number" min={0} value={float} onChange={(e) => setFloat(e.target.value)} />
          </div>
          <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600" onClick={() => openShift(Number(float) || 0)}>
            Open shift
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ShiftBar() {
  const { shift, held, recall, deleteHeld, closeShift } = usePos();
  const [heldOpen, setHeldOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [cashCount, setCashCount] = useState("");

  const report = useMemo(() => {
    const sales = shift?.sales ?? [];
    const gross = sales.reduce((s, x) => s + x.total, 0);
    const byMethod: Record<PaymentMethod, number> = { CASH: 0, CARD: 0, WALLET: 0, LOYALTY: 0, PAYROLL: 0 };
    for (const sale of sales) {
      for (const p of sale.payments) byMethod[p.method] += p.amount;
    }
    const expectedCash = (shift?.openingFloat ?? 0) + byMethod.CASH - sales.reduce((s, x) => s + x.change, 0);
    return { count: sales.length, gross, byMethod, expectedCash };
  }, [shift]);

  if (!shift) return null;

  const variance = cashCount === "" ? null : Number(cashCount) - report.expectedCash;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="success" className="gap-1">
        <Clock className="h-3 w-3" /> Shift open
      </Badge>
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {report.count} sale{report.count === 1 ? "" : "s"} · {formatCurrency(report.gross)}
      </span>

      <Button variant="outline" size="sm" onClick={() => setHeldOpen(true)}>
        <Receipt className="mr-1.5 h-4 w-4" /> Held ({held.length})
      </Button>
      <Button variant="outline" size="sm" onClick={() => setReportOpen(true)}>
        <DoorClosed className="mr-1.5 h-4 w-4" /> Close shift
      </Button>

      {/* Held sales */}
      <Dialog open={heldOpen} onOpenChange={setHeldOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Held sales</DialogTitle>
          </DialogHeader>
          {held.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No held sales.</p>
          ) : (
            <div className="space-y-2">
              {held.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {h.lines.reduce((s, l) => s + l.qty, 0)} items
                      {h.customer ? ` · ${h.customer.name}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(h.at).toLocaleTimeString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { recall(h.id); setHeldOpen(false); }}>
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Recall
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteHeld(h.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cash-up / close shift */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Close shift · cash-up</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <Row label="Sales" value={String(report.count)} />
            <Row label="Gross takings" value={formatCurrency(report.gross)} />
            <div className="my-2 border-t" />
            {(Object.keys(report.byMethod) as PaymentMethod[]).map((m) => (
              <Row key={m} label={m} value={formatCurrency(report.byMethod[m])} muted />
            ))}
            <div className="my-2 border-t" />
            <Row label="Opening float" value={formatCurrency(shift.openingFloat)} muted />
            <Row label="Expected in drawer" value={formatCurrency(report.expectedCash)} />

            <div className="space-y-2 pt-2">
              <Label htmlFor="count">Counted cash (R)</Label>
              <Input id="count" type="number" value={cashCount} onChange={(e) => setCashCount(e.target.value)} placeholder="0.00" />
              {variance !== null ? (
                <p className={`text-sm font-medium ${Math.abs(variance) < 0.01 ? "text-green-600" : "text-amber-600"}`}>
                  Variance: {formatCurrency(variance)} {Math.abs(variance) < 0.01 ? "(balanced)" : variance > 0 ? "(over)" : "(short)"}
                </p>
              ) : null}
            </div>

            <Button
              className="mt-2 w-full bg-gradient-to-r from-violet-600 to-indigo-600"
              onClick={() => { closeShift(); setReportOpen(false); setCashCount(""); }}
            >
              Close shift &amp; end session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : "font-medium"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
