"use client";

import { FileText, FileSpreadsheet, FileDown } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const REPORTS = [
  { key: "revenue", title: "Revenue", description: "Sales and revenue by day, week or month." },
  { key: "bookings", title: "Bookings", description: "Bookings, collections and no-shows." },
  { key: "subsidy", title: "Subsidy", description: "Employer subsidy spend per department." },
  { key: "kitchen", title: "Kitchen", description: "Production, collection and waste." },
  { key: "inventory", title: "Inventory", description: "Stock value, movements and low stock." },
  { key: "pos", title: "POS", description: "Cashier totals and payment mix." },
  { key: "employees", title: "Employees", description: "Headcount and usage by department." },
  { key: "loyalty", title: "Loyalty", description: "Points earned, redeemed and outstanding." },
  { key: "finance", title: "Finance", description: "Reconciliation across wallet and payments." },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Generate and export operational reports." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Card key={r.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-indigo-500" /> {r.title}
              </CardTitle>
              <CardDescription>{r.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" size="sm">
                <FileDown className="mr-1.5 h-3.5 w-3.5" /> PDF
              </Button>
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Excel
              </Button>
              <Button variant="outline" size="sm">
                CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
