"use client";

import { ChefHat, CheckCircle2, Clock } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton, EmptyState } from "@/components/shared/query-states";
import { useResource } from "@/lib/hooks";

const today = new Date().toISOString().slice(0, 10);

interface ProductionRow {
  scheduleId: string;
  meal: string;
  toPrepare: number;
  collected: number;
  pending: number;
  capacity: number | null;
}

export default function KitchenPage() {
  const { data, isLoading } = useResource<ProductionRow[]>(
    "kitchen-dashboard",
    `/kitchen/dashboard?date=${today}`,
  );

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Kitchen" description="Today's production plan and collection status." />

      {isLoading ? (
        <Card className="p-6">
          <TableSkeleton />
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Nothing scheduled today"
          description="Meals scheduled for today will show their production numbers here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <Card key={row.scheduleId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{row.meal}</CardTitle>
                  <Badge variant="info">{row.toPrepare} to make</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> Collected
                  </span>
                  <span className="font-medium">{row.collected}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-amber-500" /> Pending
                  </span>
                  <span className="font-medium">{row.pending}</span>
                </div>
                {row.capacity != null ? (
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-medium">{row.capacity}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
