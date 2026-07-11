import axios from "axios";
import Constants from "expo-constants";

import { supabase } from "./supabase";

/**
 * Base URL points at the NetBite360 web app's API routes, e.g.
 * https://your-app.vercel.app/api  — set EXPO_PUBLIC_API_URL accordingly.
 */
const baseURL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:3000/api";

export const api = axios.create({ baseURL, timeout: 15000 });

// Attach the current Supabase access token to every request. supabase-js
// auto-refreshes the session, so getSession() always returns a fresh token.
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Extract a friendly message from an error (Axios or Supabase). */
export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
}
