"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResource } from "@/lib/hooks";
import { formatCurrency } from "@/lib/utils";

interface Summary {
  mealsToday: number;
  collectedToday: number;
  revenueToday: number;
  inventoryValue: number;
  upcomingBookings: number;
  activeEmployees: number;
}

interface RevenuePoint {
  date: string;
  revenue: number;
}
interface PopularMeal {
  name: string;
  bookings: number;
}

export default function AnalyticsPage() {
  const { data: summary } = useResource<Summary>("analytics-summary", "/analytics/dashboard");
  const { data: revenue } = useResource<RevenuePoint[]>("analytics-revenue", "/analytics/revenue-trend");
  const { data: meals } = useResource<PopularMeal[]>("analytics-popular", "/analytics/popular-meals");
  const { data: dept } = useResource<{ department: string; bookings: number }[]>("analytics-dept", "/analytics/department-usage");
  const { data: waste } = useResource<{ reason: string; cost: number }[]>("analytics-waste", "/analytics/waste");

  const wasteCost = (waste ?? []).reduce((s, w) => s + Number(w.cost), 0);

  const cards = [
    { label: "Revenue today", value: formatCurrency(summary?.revenueToday ?? 0) },
    { label: "Meals today", value: summary?.mealsToday ?? 0 },
    { label: "Collected", value: summary?.collectedToday ?? 0 },
    { label: "Inventory value", value: formatCurrency(summary?.inventoryValue ?? 0) },
    { label: "Upcoming bookings", value: summary?.upcomingBookings ?? 0 },
    { label: "Active employees", value: summary?.activeEmployees ?? 0 },
    { label: "Waste (30d)", value: formatCurrency(wasteCost) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Revenue, popularity and operational insight." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-2xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenue ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tickFormatter={(d) => String(d).slice(5, 10)} fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--sc-indigo))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Popular meals</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={meals ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="bookings" fill="hsl(var(--sc-purple))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department usage</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dept ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="department" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="bookings" fill="hsl(var(--sc-blue))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Waste by reason (30d)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waste ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="reason" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} tickFormatter={(v) => String(v).replace(/_/g, " ")} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="cost" fill="hsl(var(--sc-red))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
