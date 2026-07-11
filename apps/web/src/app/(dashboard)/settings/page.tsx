"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableSkeleton } from "@/components/shared/query-states";
import { ResourceForm, type Field } from "@/components/shared/resource-form";
import { useBrand } from "@/components/brand-provider";
import { useList, useResource } from "@/lib/hooks";
import { api } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const brandingFields: Field[] = [
  { name: "name", label: "Company name", required: true },
  { name: "logoUrl", label: "Logo", type: "image", full: true },
  { name: "primaryColor", label: "Primary colour", type: "color" },
  { name: "secondaryColor", label: "Secondary colour", type: "color" },
  { name: "currency", label: "Currency" },
  { name: "timezone", label: "Timezone" },
  { name: "supportEmail", label: "Support email", type: "email" },
];

interface RuleField {
  name: string;
  label: string;
  step?: number;
  defaultValue: number;
}

/** A settings card that reads/writes one JSON setting key. */
function RuleCard({
  title,
  description,
  settingKey,
  fields,
  current,
}: {
  title: string;
  description: string;
  settingKey: string;
  fields: RuleField[];
  current: Record<string, unknown> | undefined;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, String(current?.[f.name] ?? f.defaultValue)])),
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const value = Object.fromEntries(fields.map((f) => [f.name, Number(values[f.name])]));
      await api.post("/settings", { key: settingKey, value });
      toast.success(`${title} saved`);
    } catch (e) {
      toast.error("Could not save", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((f) => (
          <div key={f.name} className="space-y-2">
            <Label htmlFor={f.name}>{f.label}</Label>
            <Input
              id={f.name}
              type="number"
              step={f.step}
              value={values[f.name]}
              onChange={(e) => setValues((s) => ({ ...s, [f.name]: e.target.value }))}
            />
          </div>
        ))}
        <Button onClick={save} disabled={saving}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Rules() {
  const { data, isLoading } = useList<{ key: string; value: Record<string, unknown> }>("settings", "/settings");
  if (isLoading) return <Card className="p-6"><TableSkeleton rows={3} /></Card>;
  const map = Object.fromEntries((data?.data ?? []).map((s) => [s.key, s.value]));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <RuleCard
        title="Booking rules"
        description="Cutoffs and limits for meal bookings."
        settingKey="booking"
        current={map.booking as Record<string, unknown> | undefined}
        fields={[
          { name: "cutoffHours", label: "Booking cutoff (hours before service)", defaultValue: 2 },
          { name: "maxPerDay", label: "Max bookings per employee per day", defaultValue: 2 },
        ]}
      />
      <RuleCard
        title="Loyalty"
        description="Points earned per R1 spent."
        settingKey="loyalty"
        current={map.loyalty as Record<string, unknown> | undefined}
        fields={[{ name: "earnRate", label: "Points per R1", step: 0.1, defaultValue: 0.1 }]}
      />
    </div>
  );
}

function Branding({ companyId }: { companyId: string }) {
  const { data, isLoading } = useResource<Record<string, unknown>>("company-settings", `/companies/${companyId}`);
  if (isLoading || !data) return <Card className="p-6"><TableSkeleton rows={4} /></Card>;
  return (
    <ResourceForm
      endpoint={`/companies/${companyId}`}
      method="patch"
      initial={data}
      fields={brandingFields}
      submitLabel="Save branding"
    />
  );
}

export default function SettingsPage() {
  const brand = useBrand();
  const canBrand = isSupabaseConfigured && !!brand.companyId;

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Your company profile, branding and service rules." />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Branding</h2>
        {canBrand ? (
          <Branding companyId={brand.companyId as string} />
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Branding is managed per tenant. Sign in to a company (or, as a super admin, switch to one) to edit its
              name, logo and colours.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Service rules</h2>
        <Rules />
      </section>
    </div>
  );
}
