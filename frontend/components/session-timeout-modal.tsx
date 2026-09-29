"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Lock, LogOut, ArrowRight, ShieldAlert } from "lucide-react";
import { authService } from "@/lib/api";

// Default idle timeout: 15 minutes of inactivity
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

export function SessionTimeoutModal() {
  const { user, logout } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset activity timestamp on user interaction
  const recordActivity = useCallback(() => {
    if (!isLocked) {
      lastActivityRef.current = Date.now();
    }
  }, [isLocked]);

  useEffect(() => {
    if (!user) return;

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, recordActivity, { passive: true }));

    // Check idle status every 10 seconds
    timerRef.current = setInterval(() => {
      if (!isLocked && Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        setIsLocked(true);
      }
    }, 10000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, recordActivity));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user, isLocked, recordActivity]);

  if (!isLocked || !user) {
    return null;
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setUnlocking(true);
    setErrorMessage(null);

    try {
      // Re-authenticate user with backend to verify credentials
      await authService.login({
        username: user.username,
        password,
      });

      // Unlock session
      setIsLocked(false);
      setPassword("");
      lastActivityRef.current = Date.now();
    } catch (err: any) {
      setErrorMessage(
        err.message || "លេខសម្ងាត់មិនត្រឹមត្រូវឡើយ (Incorrect password)."
      );
    } finally {
      setUnlocking(false);
    }
  };

  const handleSignOut = async () => {
    setIsLocked(false);
    await logout();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0a1122] border border-[#1e293b] rounded-2xl p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-cyan-600/10 blur-3xl pointer-events-none" />

        {/* Lock Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
            <Lock className="h-7 w-7" />
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            សម័យប្រជុំត្រូវបានចាក់សោរ
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Session Locked Due to Inactivity (15 minutes)
          </p>

          {/* User Badge */}
          <div className="mt-4 px-3 py-1.5 rounded-full bg-[#131d33] border border-[#223354] flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
              {user.username}
            </span>
            <span className="text-[11px] text-slate-400">
              ({user.role})
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-4 leading-relaxed max-w-xs">
            ដើម្បីការពារសុវត្ថិភាពទិន្នន័យ សូមវាយបញ្ចូលលេខសម្ងាត់របស់អ្នកដើម្បីបន្តការងារដោយមិនបាត់បង់ទិន្នន័យ។
          </p>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="mt-6 space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1.5 text-left">
              ពាក្យសម្ងាត់ (Password)
            </label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={unlocking}
              className="w-full h-10 px-3.5 bg-[#0f172a] border border-[#2d3748] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={unlocking}
              className="flex-1 h-10 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>ចាកចេញ (Logout)</span>
            </button>

            <button
              type="submit"
              disabled={unlocking || !password}
              className="flex-1 h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{unlocking ? "កំពុងផ្ទៀងផ្ទាត់..." : "ដោះសោរ (Unlock)"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
