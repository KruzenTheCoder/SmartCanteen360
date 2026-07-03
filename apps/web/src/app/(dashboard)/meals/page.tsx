"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceTable, type Column } from "@/components/shared/resource-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Meal {
  id: string;
  name: string;
  status: string;
  category?: { name: string } | null;
  costPrice: number;
  retailPrice: number;
  subsidyPrice: number;
  nutrition?: { calories: number } | null;
}

const statusVariant: Record<string, "success" | "secondary" | "warning"> = {
  PUBLISHED: "success",
  DRAFT: "secondary",
  ARCHIVED: "warning",
};

const columns: Column<Meal>[] = [
  { header: "Meal", cell: (m) => <span className="font-medium">{m.name}</span> },
  { header: "Category", cell: (m) => m.category?.name ?? "—" },
  { header: "Cost", cell: (m) => formatCurrency(Number(m.costPrice)) },
  { header: "Retail", cell: (m) => formatCurrency(Number(m.retailPrice)) },
  { header: "Subsidy", cell: (m) => formatCurrency(Number(m.subsidyPrice)) },
  { header: "kcal", cell: (m) => m.nutrition?.calories ?? "—" },
  { header: "Status", cell: (m) => <Badge variant={statusVariant[m.status] ?? "secondary"}>{m.status}</Badge> },
];

export default function MealsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Meals" description="Catalogue, pricing, nutrition and allergens.">
        <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600">
          <Link href="/meals/new">
            <Plus className="mr-2 h-4 w-4" /> Add Meal
          </Link>
        </Button>
      </PageHeader>

      <ResourceTable<Meal>
        queryKey="meals"
        endpoint="/meals"
        columns={columns}
        emptyTitle="No meals yet"
        emptyDescription="Create your first meal to start building menus."
      />
    </div>
  );
}
