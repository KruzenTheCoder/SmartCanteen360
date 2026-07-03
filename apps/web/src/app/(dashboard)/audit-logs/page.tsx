"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceTable, type Column } from "@/components/shared/resource-table";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  createdAt: string;
  user?: { email: string } | null;
}

const columns: Column<AuditLog>[] = [
  { header: "When", cell: (l) => new Date(l.createdAt).toLocaleString() },
  { header: "Action", cell: (l) => <Badge variant="secondary">{l.action}</Badge> },
  { header: "Entity", cell: (l) => <span className="font-medium">{l.entity}</span> },
  { header: "Record", cell: (l) => <span className="font-mono text-xs">{l.entityId ?? "—"}</span> },
  { header: "By", cell: (l) => l.user?.email ?? "system" },
];

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Every mutation, who made it and when." />
      <ResourceTable<AuditLog>
        queryKey="audit-logs"
        endpoint="/audit-logs"
        columns={columns}
        emptyTitle="No audit entries yet"
        emptyDescription="Create, update and delete actions are recorded here."
      />
    </div>
  );
}
