"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { User, Lock, Eye, EyeOff, ShieldCheck, Car } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("សូមបញ្ចូល Username និង Password");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login({ username: username.trim(), password });
    } catch (err: any) {
      setError(
        err?.message ||
          "ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវ។ សូមព្យាយាមម្តងទៀត។",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#070c18] relative overflow-hidden font-sans select-none px-4">
      {/* Luxury cockpit ambient lighting background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#030611] via-[#091124] to-[#040816]" />
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Grid line pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-[#0c1527]/95 border border-[#1e2c4a] rounded-xl shadow-2xl p-7 sm:p-8 backdrop-blur-md">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 mb-3.5">
            <div className="w-full h-full bg-[#080e1c] rounded-[10px] flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-cyan-400"
              >
                <path d="M4 4l8 16L20 4M8 4l4 8 4-8" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-black tracking-[0.2em] text-white">
            VOYAH & MHERO
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide mt-1 uppercase">
            Car Showroom Management System (CSM 1.0)
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
            <span className="text-red-400 font-bold">⚠️</span>
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Login Name (ឈ្មោះគណនី)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="បញ្ចូល Login Name..."
                autoComplete="username"
                className="w-full pl-9 pr-3 py-2.5 bg-[#070c18] border border-[#1f2d4d] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg text-sm text-white placeholder-slate-500 transition-colors outline-none"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Login Password (លេខសម្ងាត់)
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="បញ្ចូលលេខសម្ងាត់..."
                autoComplete="current-password"
                className="w-full pl-9 pr-10 py-2.5 bg-[#070c18] border border-[#1f2d4d] focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-lg text-sm text-white placeholder-slate-500 transition-colors outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-[0.99] text-white font-bold text-sm rounded-lg shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>កំពុងផ្ទៀងផ្ទាត់...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>ចូលប្រើប្រព័ន្ធ (Login)</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info hint */}
        <div className="mt-6 pt-4 border-t border-[#1a253f] text-center">
          <p className="text-[11px] text-slate-400">
            គណនីលំនាំដើម Super Admin:{" "}
            <span className="text-cyan-400 font-mono font-bold">admin</span> /{" "}
            <span className="text-cyan-400 font-mono font-bold">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
