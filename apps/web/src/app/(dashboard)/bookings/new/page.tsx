"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useList } from "@/lib/hooks";
import { api } from "@/lib/api";

interface Schedule {
  id: string;
  serviceDate: string;
  meal?: { name: string } | null;
}

const today = new Date().toISOString().slice(0, 10);
const in14 = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);

export default function NewBookingPage() {
  const router = useRouter();
  const { data } = useList<Schedule>("schedules-new", "/meal-schedules", { from: today, to: in14 });
  const schedules = data?.data ?? [];

  const [scheduleId, setScheduleId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  const inputCls = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleId) {
      toast.error("Please choose a meal");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/bookings", {
        scheduleId,
        quantity: Number(quantity) || 1,
        ...(employeeId ? { employeeId } : {}),
      });
      toast.success("Booking created");
      router.push("/bookings");
      router.refresh();
    } catch (err) {
      toast.error("Could not book", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="New Booking" description="Book a scheduled meal on behalf of an employee." />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={submit} className="grid max-w-xl gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule">Meal</Label>
              <select id="schedule" className={inputCls} value={scheduleId} onChange={(e) => setScheduleId(e.target.value)}>
                <option value="">Select a scheduled meal…</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.meal?.name ?? "Meal"} — {new Date(s.serviceDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee">Employee number (optional)</Label>
              <Input id="employee" placeholder="E-0001" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input id="qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-violet-600 to-indigo-600">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Booking…</> : "Create booking"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
