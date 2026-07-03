"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useList } from "@/lib/hooks";

interface Schedule {
  id: string;
  serviceDate: string;
  status: string;
  capacity: number | null;
  meal?: { name: string } | null;
}

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function MealCalendarPage() {
  const week = useMemo(() => {
    const start = startOfWeek(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, []);

  const from = week[0]!.toISOString().slice(0, 10);
  const to = week[6]!.toISOString().slice(0, 10);

  const { data } = useList<Schedule>("meal-schedules", "/meal-schedules", { from, to });
  const schedules = data?.data ?? [];

  const byDay = (d: Date) =>
    schedules.filter((s) => s.serviceDate.slice(0, 10) === d.toISOString().slice(0, 10));

  return (
    <div className="space-y-6">
      <PageHeader title="Meal Calendar" description="Plan meals and capacity for the week.">
        <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
          <Plus className="mr-2 h-4 w-4" /> Schedule Meal
        </Button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-7">
        {week.map((d) => {
          const items = byDay(d);
          const isToday = d.toDateString() === new Date().toDateString();
          return (
            <Card key={d.toISOString()} className={isToday ? "border-primary" : ""}>
              <div className="border-b p-3 text-center">
                <p className="text-xs uppercase text-muted-foreground">
                  {d.toLocaleDateString("en-ZA", { weekday: "short" })}
                </p>
                <p className="text-lg font-semibold">{d.getDate()}</p>
              </div>
              <div className="space-y-2 p-3">
                {items.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground">—</p>
                ) : (
                  items.map((s) => (
                    <div key={s.id} className="rounded-md bg-muted/50 p-2 text-xs">
                      <p className="font-medium">{s.meal?.name ?? "Meal"}</p>
                      <Badge variant="info" className="mt-1">
                        {s.capacity != null ? `${s.capacity} cap` : s.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
