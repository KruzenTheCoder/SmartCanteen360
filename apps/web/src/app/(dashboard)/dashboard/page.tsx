"use client";

import Link from "next/link";
import {
  TrendingUp,
  Users,
  ChefHat,
  Wallet,
  Calendar,
  Boxes,
  CheckCircle2,
  Star,
  Activity,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useResource, useList } from "@/lib/hooks";
import { formatCurrency, cn } from "@/lib/utils";

interface Summary {
  mealsToday: number;
  collectedToday: number;
  revenueToday: number;
  inventoryValue: number;
  upcomingBookings: number;
  activeEmployees: number;
}
interface PopularMeal {
  name: string;
  bookings: number;
}
interface AuditRow {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  user?: { email: string } | null;
}

const actionColor: Record<string, string> = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "destructive",
  LOGIN: "secondary",
  REFUND: "warning",
};

export default function DashboardPage() {
  const { data: s } = useResource<Summary>("dash-summary", "/analytics/dashboard");
  const { data: popular } = useResource<PopularMeal[]>("dash-popular", "/analytics/popular-meals");
  const { data: audit } = useList<AuditRow>("dash-audit", "/audit-logs", { pageSize: "8" });
  const activity = audit?.data ?? [];

  const stats = [
    { title: "Today's Meals", value: String(s?.mealsToday ?? 0), icon: ChefHat, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950" },
    { title: "Collected Today", value: String(s?.collectedToday ?? 0), icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950" },
    { title: "Revenue Today", value: formatCurrency(s?.revenueToday ?? 0), icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950" },
    { title: "Active Employees", value: String(s?.activeEmployees ?? 0), icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950" },
    { title: "Upcoming Bookings", value: String(s?.upcomingBookings ?? 0), icon: Calendar, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950" },
    { title: "Inventory Value", value: formatCurrency(s?.inventoryValue ?? 0), icon: Boxes, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Live overview of your canteen today.</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600">
          <Link href="/analytics">
            <TrendingUp className="mr-2 h-4 w-4" /> View Analytics
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={cn(stat.bg, stat.color, "rounded-lg p-2")}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Recent Activity
            </CardTitle>
            <CardDescription>Latest changes across your canteen</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activity.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50">
                    <Badge variant={(actionColor[a.action] as "success") ?? "secondary"}>{a.action}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{a.entity}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.user?.email ?? "system"}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" /> Popular Meals
            </CardTitle>
            <CardDescription>Most booked recently</CardDescription>
          </CardHeader>
          <CardContent>
            {(popular ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {(popular ?? []).slice(0, 6).map((m, i) => (
                  <div key={m.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-muted-foreground">{i + 1}.</span>
                      {m.name}
                    </span>
                    <span className="text-sm font-medium">{m.bookings}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
