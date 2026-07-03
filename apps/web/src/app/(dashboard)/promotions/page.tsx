"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceTable, type Column } from "@/components/shared/resource-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Promotion {
  id: string;
  name: string;
  type: string;
  priority: number;
  isActive: boolean;
}

const columns: Column<Promotion>[] = [
  { header: "Name", cell: (p) => <span className="font-medium">{p.name}</span> },
  { header: "Type", cell: (p) => p.type.replace(/_/g, " ") },
  { header: "Priority", cell: (p) => p.priority },
  {
    header: "Status",
    cell: (p) => (
      <Badge variant={p.isActive ? "success" : "secondary"}>
        {p.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Promotions" description="Campaigns, discount rules and competitions.">
        <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600">
          <Link href="/promotions/new">
            <Plus className="mr-2 h-4 w-4" /> New Promotion
          </Link>
        </Button>
      </PageHeader>
      <ResourceTable<Promotion>
        queryKey="promotions"
        endpoint="/promotions"
        columns={columns}
        emptyTitle="No promotions yet"
        emptyDescription="Create discount rules, combos and campaigns."
      />
    </div>
  );
}
