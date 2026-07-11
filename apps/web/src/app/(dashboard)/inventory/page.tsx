"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceTable, type Column } from "@/components/shared/resource-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
  quantityOnHand: number;
  reorderLevel: number;
  unitCost: number;
  category?: { name: string } | null;
}

const columns: Column<Product>[] = [
  { header: "SKU", cell: (p) => <span className="font-mono text-xs">{p.sku}</span> },
  { header: "Product", cell: (p) => <span className="font-medium">{p.name}</span> },
  { header: "Category", cell: (p) => p.category?.name ?? "—" },
  {
    header: "On hand",
    cell: (p) => {
      const low = Number(p.quantityOnHand) <= Number(p.reorderLevel);
      return (
        <span className="flex items-center gap-2">
          {Number(p.quantityOnHand)} {p.unit}
          {low ? <Badge variant="warning">Low</Badge> : null}
        </span>
      );
    },
  },
  { header: "Reorder", cell: (p) => `${Number(p.reorderLevel)} ${p.unit}` },
  { header: "Unit cost", cell: (p) => formatCurrency(Number(p.unitCost)) },
];

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Stock levels, reorder points and expiry.">
        <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600">
          <Link href="/inventory/new">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Link>
        </Button>
      </PageHeader>
      <ResourceTable<Product>
        queryKey="inventory"
        endpoint="/inventory"
        columns={columns}
        resource="inventory"
        emptyTitle="No products yet"
        emptyDescription="Add inventory products to start tracking stock."
      />
    </div>
  );
}
