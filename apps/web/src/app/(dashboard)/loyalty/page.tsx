"use client";

import { Plus, Trophy } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceTable, type Column } from "@/components/shared/resource-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useResource } from "@/lib/hooks";

interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  stock: number | null;
  status: string;
}

interface LeaderRow {
  id: string;
  lifetimePoints: number;
  employee?: { firstName: string; lastName: string };
}

const columns: Column<Reward>[] = [
  { header: "Reward", cell: (r) => <span className="font-medium">{r.name}</span> },
  { header: "Cost", cell: (r) => `${r.pointsCost} pts` },
  { header: "Stock", cell: (r) => (r.stock == null ? "∞" : r.stock) },
  { header: "Status", cell: (r) => <Badge variant="success">{r.status}</Badge> },
];

export default function LoyaltyPage() {
  const { data: leaders } = useResource<LeaderRow[]>("loyalty-leaderboard", "/loyalty/leaderboard");

  return (
    <div className="space-y-6">
      <PageHeader title="Loyalty" description="Reward catalogue, points and leaderboards.">
        <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
          <Plus className="mr-2 h-4 w-4" /> Add Reward
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ResourceTable<Reward>
            queryKey="rewards"
            endpoint="/loyalty/rewards"
            columns={columns}
            emptyTitle="No rewards yet"
            emptyDescription="Add rewards employees can redeem with points."
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-amber-500" /> Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(leaders ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              (leaders ?? []).map((l, i) => (
                <div key={l.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-5 text-muted-foreground">{i + 1}.</span>
                    {l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : "—"}
                  </span>
                  <span className="font-medium">{l.lifetimePoints} pts</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
