"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService, ApiError } from "./api";
import type { AuthUser, LoginDto } from "@csm/contracts";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("csm_token");
      if (!token) {
        setLoading(false);
        if (pathname !== "/login") {
          router.replace("/login");
        }
        return;
      }

      try {
        // Ensure cookie is synchronized for Next.js middleware if missing
        if (typeof document !== "undefined" && !document.cookie.includes("csm_token=")) {
          document.cookie = `csm_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
        }
        const currentUser = await authService.getMe();
        setUser(currentUser);
      } catch (err) {
        localStorage.removeItem("csm_token");
        setUser(null);
        if (pathname !== "/login") {
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [pathname, router]);

  // Silent background token refresh every 30 minutes to maintain persistent session
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const res = await authService.refreshToken();
        if (res.accessToken) {
          localStorage.setItem("csm_token", res.accessToken);
          document.cookie = `csm_token=${encodeURIComponent(res.accessToken)}; path=/; max-age=604800; SameSite=Lax`;
          setUser(res.user);
        }
      } catch {
        // Silently ignore background refresh failures
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [user]);

  const login = async (dto: LoginDto) => {
    setLoading(true);
    try {
      const res = await authService.login(dto);
      localStorage.setItem("csm_token", res.accessToken);
      // Ensure cookie is available for middleware
      document.cookie = `csm_token=${encodeURIComponent(res.accessToken)}; path=/; max-age=604800; SameSite=Lax`;
      setUser(res.user);
      router.replace("/");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Proceed even if network request fails
    } finally {
      localStorage.removeItem("csm_token");
      document.cookie = "csm_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0; SameSite=Lax;";
      document.cookie = "csm_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;";
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login?logout=true";
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
