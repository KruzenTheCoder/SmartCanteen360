import { create } from "zustand";

import { supabase } from "@/lib/supabase";
import { apiError } from "@/lib/api";

interface AuthUser {
  id: string;
  email: string;
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

const toUser = (session: { user: { id: string; email?: string } } | null): AuthUser | null =>
  session ? { id: session.user.id, email: session.user.email ?? "" } : null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isBootstrapping: true,
  error: null,

  /** Restore the Supabase session on launch and subscribe to auth changes. */
  async bootstrap() {
    const { data } = await supabase.auth.getSession();
    set({ user: toUser(data.session), isBootstrapping: false });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: toUser(session) });
    });
  },

  async login(email, password) {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      set({ isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: apiError(e) });
      throw e;
    }
  },

  async logout() {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
