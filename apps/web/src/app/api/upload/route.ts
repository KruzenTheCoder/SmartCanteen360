import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantContext } from "@/lib/data/context";

export const dynamic = "force-dynamic";

const BUCKET = "netbite360";

/**
 * Upload an image to Supabase Storage and return its public URL.
 * multipart/form-data: `file` (required), `folder` (optional, default "uploads").
 */
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext(req);
  if (!ctx) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No file provided" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ message: "File too large (max 10 MB)" }, { status: 400 });
  }

  const folder = (form.get("folder") as string) || "uploads";
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const scope = ctx.activeCompanyId ?? ctx.companyId ?? "shared";
  const path = `${scope}/${folder}/${crypto.randomUUID()}.${ext}`;

  const db = createAdminClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await db.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
