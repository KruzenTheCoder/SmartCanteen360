"use client";

import { Printer, CheckCircle2 } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Sale } from "@/lib/pos/store";

function receiptHtml(sale: Sale): string {
  const line = (l: { label: string; qty: number; unitPrice: number }) =>
    `<tr><td>${l.qty} × ${l.label}</td><td style="text-align:right">${formatCurrency(l.unitPrice * l.qty)}</td></tr>`;
  const pay = (p: { method: string; amount: number; cardScheme?: string; maskedPan?: string; authCode?: string }) =>
    `<tr><td>${p.method}${p.cardScheme ? ` (${p.cardScheme} ${p.maskedPan ?? ""})` : ""}${p.authCode ? ` auth ${p.authCode}` : ""}</td><td style="text-align:right">${formatCurrency(p.amount)}</td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>${sale.receiptNumber}</title>
  <style>
    * { font-family: 'Courier New', monospace; font-size: 12px; }
    body { width: 300px; margin: 0 auto; padding: 12px; color: #000; }
    h1 { font-size: 16px; text-align: center; margin: 0; }
    .muted { color: #555; text-align: center; margin: 2px 0 8px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 0; }
    hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; }
    .bold { font-weight: bold; }
    .center { text-align: center; }
  </style></head><body>
    <h1>NetBite360</h1>
    <div class="muted">Tax Invoice</div>
    <div class="row"><span>Receipt</span><span>${sale.receiptNumber}</span></div>
    <div class="row"><span>Date</span><span>${new Date(sale.at).toLocaleString()}</span></div>
    <div class="row"><span>Cashier</span><span>${sale.cashier}</span></div>
    ${sale.customer ? `<div class="row"><span>Customer</span><span>${sale.customer.name} (${sale.customer.employeeNumber})</span></div>` : ""}
    <hr>
    <table>${sale.lines.map(line).join("")}</table>
    <hr>
    <div class="row"><span>Subtotal</span><span>${formatCurrency(sale.subtotal)}</span></div>
    ${sale.discount ? `<div class="row"><span>Discount</span><span>-${formatCurrency(sale.discount)}</span></div>` : ""}
    <div class="row"><span>VAT (15% incl)</span><span>${formatCurrency(sale.vat)}</span></div>
    <div class="row bold"><span>TOTAL</span><span>${formatCurrency(sale.total)}</span></div>
    <hr>
    <table>${sale.payments.map(pay).join("")}</table>
    ${sale.change ? `<div class="row"><span>Change</span><span>${formatCurrency(sale.change)}</span></div>` : ""}
    <hr>
    <div class="center">Thank you! VAT No. 4XXXXXXXXX</div>
  </body></html>`;
}

export function ReceiptDialog({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  const print = () => {
    if (!sale) return;
    const w = window.open("", "_blank", "width=360,height=640");
    if (!w) return;
    w.document.write(receiptHtml(sale));
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Dialog open={!!sale} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" hideClose>
        {sale ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-lg font-semibold">Sale complete</p>
              <p className="text-sm text-muted-foreground">{sale.receiptNumber}</p>
            </div>

            <div className="rounded-lg border p-4 font-mono text-xs">
              {sale.lines.map((l) => (
                <div key={l.id} className="flex justify-between">
                  <span>{l.qty} × {l.label}</span>
                  <span>{formatCurrency(l.unitPrice * l.qty)}</span>
                </div>
              ))}
              <div className="my-2 border-t border-dashed" />
              <div className="flex justify-between"><span>VAT (15% incl)</span><span>{formatCurrency(sale.vat)}</span></div>
              <div className="flex justify-between font-bold"><span>TOTAL</span><span>{formatCurrency(sale.total)}</span></div>
              {sale.change > 0 ? (
                <div className="flex justify-between text-green-600"><span>Change</span><span>{formatCurrency(sale.change)}</span></div>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={print}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600" onClick={onClose}>
                New sale
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
