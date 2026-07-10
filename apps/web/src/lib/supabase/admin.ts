import "server-only";

import { createClient } from "@supabase/supabase-js";

import { SUPABASE_URL } from "./config";

/**
 * Service-role client — bypasses RLS. SERVER ONLY. Never import this into a
 * client component. Used for privileged admin operations (provisioning tenants,
 * inviting users, cross-tenant super-admin reads).
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!SUPABASE_URL || !serviceKey) {
    throw new Error("Supabase admin client requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
