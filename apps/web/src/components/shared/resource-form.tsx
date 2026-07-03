"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface Field {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: string | number;
  step?: number;
  full?: boolean;
}

interface ResourceFormProps {
  endpoint: string;
  fields: Field[];
  redirectTo: string;
  submitLabel?: string;
  method?: "post" | "patch";
}

/** Generic create/edit form: renders fields, posts JSON, toasts and redirects. */
export function ResourceForm({
  endpoint,
  fields,
  redirectTo,
  submitLabel = "Save",
  method = "post",
}: ResourceFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue != null ? String(f.defaultValue) : ""])),
  );
  const [submitting, setSubmitting] = useState(false);

  const set = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing = fields.filter((f) => f.required && !values[f.name]?.trim());
    if (missing.length) {
      toast.error("Please complete required fields", { description: missing.map((m) => m.label).join(", ") });
      return;
    }

    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = values[f.name];
      if (raw === "" || raw == null) continue;
      payload[f.name] = f.type === "number" ? Number(raw) : raw;
    }

    setSubmitting(true);
    try {
      await api[method](endpoint, payload);
      toast.success("Saved successfully");
      router.push(redirectTo as never);
      router.refresh();
    } catch (err) {
      toast.error("Could not save", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f.name} className={cn("space-y-2", f.full || f.type === "textarea" ? "md:col-span-2" : "")}>
              <Label htmlFor={f.name}>
                {f.label}
                {f.required ? <span className="text-red-500"> *</span> : null}
              </Label>

              {f.type === "textarea" ? (
                <textarea
                  id={f.name}
                  className={cn(inputCls, "h-24 py-2")}
                  placeholder={f.placeholder}
                  value={values[f.name]}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : f.type === "select" ? (
                <select
                  id={f.name}
                  className={inputCls}
                  value={values[f.name]}
                  onChange={(e) => set(f.name, e.target.value)}
                >
                  <option value="">Select…</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={f.name}
                  type={f.type ?? "text"}
                  step={f.step}
                  placeholder={f.placeholder}
                  value={values[f.name]}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
            </div>
          ))}

          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-violet-600 to-indigo-600">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : submitLabel}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
