import axios, { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const ACCESS_TOKEN_KEY = "sc_access_token";
const REFRESH_TOKEN_KEY = "sc_refresh_token";

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:4000/api/v1";

export const api = axios.create({ baseURL, timeout: 15000 });

export const tokenStore = {
  async getAccess() {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefresh() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async set(access: string, refresh?: string) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
    if (refresh) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

// Attach the bearer token to every request.
api.interceptors.request.use(async (config) => {
  const token = await tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, try a single refresh then replay the original request.
let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !("_retried" in original)) {
      (original as { _retried?: boolean })._retried = true;
      refreshing ??= (async () => {
        try {
          const refreshToken = await tokenStore.getRefresh();
          if (!refreshToken) return null;
          const { data } = await axios.post<{ accessToken: string; refreshToken?: string }>(
            `${baseURL}/auth/refresh`,
            { refreshToken },
          );
          await tokenStore.set(data.accessToken, data.refreshToken);
          return data.accessToken;
        } catch {
          await tokenStore.clear();
          return null;
        } finally {
          refreshing = null;
        }
      })();

      const newToken = await refreshing;
      if (newToken && original.headers) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Extract a friendly message from an Axios error. */
export function apiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
}
