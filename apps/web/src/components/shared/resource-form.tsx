"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface Field {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "textarea" | "select" | "image" | "color" | "password";
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
  /** Prefill values (edit mode). */
  initial?: Record<string, unknown>;
}

/** Generic create/edit form: renders fields, posts JSON, toasts and redirects. */
export function ResourceForm({
  endpoint,
  fields,
  redirectTo,
  submitLabel = "Save",
  method = "post",
  initial,
}: ResourceFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => {
        const fromInitial = initial?.[f.name];
        const val = fromInitial != null ? fromInitial : f.defaultValue;
        return [f.name, val != null ? String(val) : ""];
      }),
    ),
  );
  const [submitting, setSubmitting] = useState(false);

  const set = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));

  const [uploading, setUploading] = useState<string | null>(null);
  const uploadImage = async (name: string, file: File) => {
    setUploading(name);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "images");
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Upload failed");
      set(name, json.url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error("Upload failed", { description: (e as Error).message });
    } finally {
      setUploading(null);
    }
  };

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

              {f.type === "image" ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      id={f.name}
                      type="url"
                      placeholder={f.placeholder ?? "https://…/photo.jpg"}
                      value={values[f.name]}
                      onChange={(e) => set(f.name, e.target.value)}
                    />
                    {isSupabaseConfigured ? (
                      <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted">
                        {uploading === f.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading === f.name}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void uploadImage(f.name, file);
                          }}
                        />
                      </label>
                    ) : null}
                  </div>
                  <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-lg border bg-muted">
                    {values[f.name] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={values[f.name]} alt="preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        Image preview
                      </div>
                    )}
                  </div>
                </div>
              ) : f.type === "textarea" ? (
                <textarea
                  id={f.name}
                  className={cn(inputCls, "h-24 py-2")}
                  placeholder={f.placeholder}
                  value={values[f.name]}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : f.type === "color" ? (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={`${f.label} colour`}
                    value={values[f.name] || "#4f46e5"}
                    onChange={(e) => set(f.name, e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border"
                  />
                  <Input value={values[f.name]} placeholder="#4f46e5" onChange={(e) => set(f.name, e.target.value)} />
                </div>
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
