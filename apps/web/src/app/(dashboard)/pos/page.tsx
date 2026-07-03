"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { usePos } from "@/lib/pos/store";
import { ProductGrid } from "@/components/pos/product-grid";
import { CartPanel } from "@/components/pos/cart-panel";
import { OpenShiftScreen, ShiftBar } from "@/components/pos/shift-controls";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";

export default function PosPage() {
  const shift = usePos((s) => s.shift);
  const lastSale = usePos((s) => s.lastSale);
  const clearLastSale = usePos((s) => s.clearLastSale);

  return (
    <div className="space-y-6">
      <PageHeader title="Point of Sale" description="Touch till with card machine, wallet, loyalty and payroll.">
        <ShiftBar />
      </PageHeader>

      {!shift ? (
        <OpenShiftScreen />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Products */}
          <Card className="p-4 lg:col-span-2">
            <div className="h-[calc(100vh-16rem)]">
              <ProductGrid />
            </div>
          </Card>

          {/* Cart / till */}
          <Card className="p-4">
            <div className="h-[calc(100vh-16rem)]">
              <CartPanel />
            </div>
          </Card>
        </div>
      )}

      <ReceiptDialog sale={lastSale} onClose={clearLastSale} />
    </div>
  );
}
