import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

import { api, tokenStore, apiError } from "@/lib/api";

interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  companyId?: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isBootstrapping: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface TokenPayload {
  sub: string;
  email: string;
  roles?: string[];
  companyId?: string;
  exp: number;
}

function userFromToken(token: string): AuthUser | null {
  try {
    const p = jwtDecode<TokenPayload>(token);
    if (p.exp * 1000 < Date.now()) return null;
    return { id: p.sub, email: p.email, roles: p.roles ?? [], companyId: p.companyId };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isBootstrapping: true,
  error: null,

  /** Restore session from secure storage on app launch. */
  async bootstrap() {
    const token = await tokenStore.getAccess();
    set({ user: token ? userFromToken(token) : null, isBootstrapping: false });
  },

  async login(email, password) {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post<{ accessToken: string; refreshToken?: string }>(
        "/auth/login",
        { email, password },
      );
      await tokenStore.set(data.accessToken, data.refreshToken);
      set({ user: userFromToken(data.accessToken), isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: apiError(e) });
      throw e;
    }
  },

  async logout() {
    try {
      await api.post("/auth/logout", {});
    } catch {
      // ignore
    }
    await tokenStore.clear();
    set({ user: null });
  },
}));
