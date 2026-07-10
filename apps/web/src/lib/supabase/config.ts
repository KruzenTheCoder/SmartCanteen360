/**
 * Supabase configuration. When these public env vars are present the app runs
 * in PRODUCTION mode (real auth + data); when absent it falls back to demo
 * mode (in-memory mock data + fake login) so the app always renders.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when a Supabase project is wired up (drives prod-vs-demo behaviour). */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
