import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Supabase client for the mobile app. Auth session is persisted in
 * AsyncStorage and auto-refreshed. Data still flows through the NetBite360 API
 * (the web app's /api routes) using the session's access token as a bearer.
 */
export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "public-anon-key", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
