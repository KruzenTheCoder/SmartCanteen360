"use client";

import { Send } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceTable, type Column } from "@/components/shared/resource-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  channel: string;
  status: string;
  createdAt: string;
}

const columns: Column<Notification>[] = [
  { header: "Title", cell: (n) => <span className="font-medium">{n.title}</span> },
  { header: "Type", cell: (n) => n.type.replace(/_/g, " ") },
  { header: "Channel", cell: (n) => <Badge variant="info">{n.channel}</Badge> },
  { header: "Status", cell: (n) => <Badge variant="secondary">{n.status}</Badge> },
  {
    header: "Sent",
    cell: (n) => new Date(n.createdAt).toLocaleString(),
  },
];

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Announcements, reminders and alerts.">
        <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
          <Send className="mr-2 h-4 w-4" /> Broadcast
        </Button>
      </PageHeader>
      <ResourceTable<Notification>
        queryKey="notifications"
        endpoint="/notifications"
        columns={columns}
        emptyTitle="No notifications"
        emptyDescription="Broadcasts and system alerts will appear here."
      />
    </div>
  );
}
