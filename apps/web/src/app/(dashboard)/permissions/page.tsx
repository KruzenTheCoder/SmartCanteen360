"use client";

import { Shield } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/** Mirrors the RBAC catalogue in @smartcanteen/shared. */
const ROLES = [
  { name: "SUPER_ADMIN", label: "Super Admin", description: "Unrestricted access across all tenants." },
  { name: "COMPANY_ADMIN", label: "Company Admin", description: "Full access within a single company." },
  { name: "KITCHEN_MANAGER", label: "Kitchen Manager", description: "Meals, scheduling, production, waste." },
  { name: "KITCHEN_STAFF", label: "Kitchen Staff", description: "Execute production and mark collections." },
  { name: "CASHIER", label: "Cashier", description: "Operate the POS and process sales." },
  { name: "INVENTORY_MANAGER", label: "Inventory Manager", description: "Stock, suppliers and purchasing." },
  { name: "FINANCE", label: "Finance", description: "Wallet, payments, reports, reconciliation." },
  { name: "HR", label: "HR", description: "Employees and subsidies." },
  { name: "EMPLOYEE", label: "Employee", description: "Bookings, wallet, loyalty, shop (mobile)." },
  { name: "AUDITOR", label: "Auditor", description: "Read-only oversight across the platform." },
];

export default function PermissionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Granular, resource-scoped permissions per role."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((r) => (
          <Card key={r.name}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-indigo-500" /> {r.label}
              </CardTitle>
              <CardDescription>{r.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="font-mono text-[10px]">{r.name}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
