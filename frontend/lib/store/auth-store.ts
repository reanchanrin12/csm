import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "../api";
import type { AuthUser, LoginDto } from "@csm/contracts";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (dto: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("csm_token") : null,
  loading: true,
  error: null,
  isAuthenticated: false,

  login: async (dto: LoginDto) => {
    set({ loading: true, error: null });
    try {
      const res = await authService.login(dto);
      const token = res.accessToken;

      if (typeof window !== "undefined") {
        localStorage.setItem("csm_token", token);
        document.cookie = `csm_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
      }

      set({
        user: res.user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវ។";
      set({ error: msg, loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Proceed even if network request fails
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("csm_token");
        document.cookie = "csm_token=; path=/; max-age=0;";
      }
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  },

  checkAuth: async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("csm_token") : null;
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, loading: false });
      return;
    }

    try {
      const user = await authService.getMe();
      set({ user, token, isAuthenticated: true, loading: false, error: null });
    } catch (err) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("csm_token");
        document.cookie = "csm_token=; path=/; max-age=0;";
      }
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  clearError: () => set({ error: null }),
}));
