"use client";

import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const save = (section: string) => () => toast.success(`${section} saved`);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Company profile, service and integration settings." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company profile</CardTitle>
            <CardDescription>Branding and localisation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company name</Label>
              <Input id="company" defaultValue="Demo Corp Canteen" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" defaultValue="ZAR" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tz">Timezone</Label>
                <Input id="tz" defaultValue="Africa/Johannesburg" />
              </div>
            </div>
            <Button onClick={save("Company profile")}>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking rules</CardTitle>
            <CardDescription>Cutoffs and limits for meal bookings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cutoff">Default booking cutoff (hours before service)</Label>
              <Input id="cutoff" type="number" defaultValue={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Max bookings per employee per day</Label>
              <Input id="limit" type="number" defaultValue={2} />
            </div>
            <Button onClick={save("Booking rules")}>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Loyalty</CardTitle>
            <CardDescription>Earn rate and tiers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="earn">Points earned per R1 spent</Label>
              <Input id="earn" type="number" defaultValue={0.1} step={0.1} />
            </div>
            <Button onClick={save("Loyalty")}>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payments</CardTitle>
            <CardDescription>Enabled providers (keys via environment).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Wallet, Payroll deduction, PayFast, Peach, Ozow and Yoco are configured through server environment variables and toggled per company here.</p>
            <Button variant="outline" onClick={save("Payments")}>Manage providers</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
