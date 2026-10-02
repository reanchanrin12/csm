"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

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
      setError("សូមបញ្ចូលឈ្មោះគណនី និងពាក្យសម្ងាត់របស់អ្នក");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login({ username: username.trim(), password });
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : "";
      // Clean, simple error: don't reveal remaining attempt countdown or internal details
      if (
        rawMessage.includes("មិនត្រឹមត្រូវ") ||
        rawMessage.toLowerCase().includes("invalid") ||
        rawMessage.toLowerCase().includes("unauthorized")
      ) {
        setError("ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវឡើយ");
      } else {
        setError(rawMessage || "ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវឡើយ");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#070b14] relative overflow-hidden font-sans select-none">
      {/* Soft Ambient Showroom Lighting in Background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[300px] bg-orange-500/8 rounded-full blur-[130px] pointer-events-none" />

      {/* Luxury White Showroom Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-white rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-slate-700/30 overflow-hidden transition-all duration-300">
        {/* Top Dark Brand Banner */}
        <div className="bg-[#0b101d] py-4 px-6 flex items-center justify-center gap-3 border-b border-slate-800">
          <Image
            src="/images/WINWAY.png"
            alt="WINWAY"
            width={120}
            height={32}
            className="h-7 w-auto object-contain select-none"
            priority
          />
          <span className="text-white font-extrabold text-base tracking-[0.2em] uppercase">
            WINWAY
          </span>
        </div>

        {/* Card Body */}
        <div className="p-7 sm:p-8">
          {/* Form Title & Orange Accent Bar */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-black tracking-[0.25em] text-[#1c2d4a] uppercase">
              SIGN IN
            </h1>
            <div className="w-10 h-0.5 bg-orange-500 mx-auto mt-2 rounded-full" />
          </div>

          {/* Sleek, Compact Modern Error Banner */}
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-50/90 border border-rose-200/70 flex items-center gap-2.5 text-rose-800 shadow-xs animate-in fade-in slide-in-from-top-1 duration-150">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span className="text-[13px] sm:text-sm font-medium leading-normal text-rose-800 font-sans">
                {error}
              </span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Phone Field */}
            <div className="space-y-1">
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1c3d73] transition-colors pointer-events-none">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  autoFocus
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="088 855 8298"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#1c3d73] focus:ring-3 focus:ring-[#1c3d73]/10 focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1c3d73] transition-colors pointer-events-none">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-[#1c3d73] focus:ring-3 focus:ring-[#1c3d73]/10 focus:outline-none transition-all placeholder:text-slate-400 font-medium tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-0.5">
              <button
                type="button"
                onClick={() =>
                  alert("សូមទាក់ទងអ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin) ដើម្បីកំណត់ពាក្យសម្ងាត់ឡើងវិញ។")
                }
                className="text-xs text-slate-500 hover:text-[#1c3d73] transition-colors cursor-pointer font-medium hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Solid Navy Blue Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm text-white tracking-wide bg-[#1c3d73] hover:bg-[#15325f] active:bg-[#10274c] shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Footer Notice */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account yet?{" "}
            <span
              onClick={() =>
                alert("សូមទាក់ទងអ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin) ដើម្បីបង្កើតគណនីថ្មី។")
              }
              className="text-[#1c3d73] hover:text-blue-900 font-semibold cursor-pointer hover:underline transition-colors"
            >
              Create an account
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
