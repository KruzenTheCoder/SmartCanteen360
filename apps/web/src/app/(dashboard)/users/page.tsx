"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceTable, type Column } from "@/components/shared/resource-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles?: { role: { name: string; label: string } }[];
}

const columns: Column<AdminUser>[] = [
  { header: "Name", cell: (u) => <span className="font-medium">{u.firstName} {u.lastName}</span> },
  { header: "Email", cell: (u) => u.email },
  {
    header: "Roles",
    cell: (u) => (
      <div className="flex flex-wrap gap-1">
        {(u.roles ?? []).map((r) => (
          <Badge key={r.role.name} variant="secondary">{r.role.label}</Badge>
        ))}
      </div>
    ),
  },
  {
    header: "Status",
    cell: (u) => <Badge variant={u.status === "ACTIVE" ? "success" : "secondary"}>{u.status}</Badge>,
  },
];

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Admin and staff accounts with role assignments.">
        <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600">
          <Link href="/users/new">
            <UserPlus className="mr-2 h-4 w-4" /> Invite User
          </Link>
        </Button>
      </PageHeader>
      <ResourceTable<AdminUser>
        queryKey="users"
        endpoint="/users"
        columns={columns}
        emptyTitle="No users yet"
        emptyDescription="Invite administrators and staff to the portal."
      />
    </div>
  );
}
