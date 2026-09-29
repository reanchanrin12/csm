"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
      setError("សូមបញ្ចូលឈ្មោះគណនី និងលេខសម្ងាត់ (Please enter username and password)");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login({ username: username.trim(), password });
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "ឈ្មោះគណនី ឬលេខសម្ងាត់មិនត្រឹមត្រូវ។ សូមព្យាយាមម្តងទៀត។"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative p-4 sm:p-6 bg-cover bg-center bg-no-repeat font-sans select-none"
      style={{
        backgroundImage: "url('/images/mhero_interior_luxury.jpg')",
      }}
    >
      {/* ── Dark Translucent Overlay across full background ── */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] pointer-events-none" />

      {/* ── Center Login Card (Split Left Form & Right Showcase) ── */}
      <div className="relative z-10 w-full max-w-[960px] bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px] border border-white/20">
        
        {/* ── LEFT PANE: White Sign In Form ── */}
        <div className="md:col-span-5 flex flex-col bg-white">
          {/* Top Brand Banner matching the original black bar */}
          <div className="w-full bg-[#0a0a0a] py-3.5 px-6 flex items-center justify-center border-b border-black">
            <div className="relative h-9 w-44 flex items-center justify-center">
              <Image
                src="/images/logo-mhero-voyah-white.png"
                alt="MHERO | VOYAH"
                width={170}
                height={36}
                className="h-full w-auto object-contain brightness-0 invert"
                priority
              />
            </div>
          </div>

          {/* Form Body */}
          <div className="flex-1 p-6 sm:p-8 md:p-9 flex flex-col justify-center">
            {/* Title */}
            <div className="text-center mb-7">
              <h1 className="text-xl sm:text-2xl font-bold tracking-[0.2em] text-[#1c355e] uppercase">
                SIGN IN
              </h1>
              <div className="w-10 h-[2.5px] bg-[#d97706] mx-auto mt-1.5 rounded-full" />
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-50/90 border-red-200 text-red-900 text-left shadow-2xs">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <AlertTitle className="text-xs font-bold text-red-800 tracking-wide">
                    ការចូលប្រើប្រាស់មិនជោគជ័យ (Sign-in Failed)
                  </AlertTitle>
                  <AlertDescription className="text-xs text-red-700/90 mt-0.5 leading-relaxed">
                    {error}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="User Name"
                  disabled={loading}
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-2xs"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <span
                  onClick={() =>
                    alert("សូមទាក់ទង Administrator ដើម្បីកំណត់លេខសម្ងាត់ឡើងវិញ (Please contact system administrator)")
                  }
                  className="text-[11px] text-[#2563eb] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </span>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#1c4484] hover:bg-[#153468] active:scale-[0.99] text-white font-semibold text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{loading ? "Signing in..." : "Sign in"}</span>
              </button>

              {/* Footer notice */}
              <div className="pt-2 text-center text-xs text-slate-500">
                Don&apos;t have an account yet?{" "}
                <span
                  onClick={() =>
                    alert("សូមទាក់ទង Administrator ដើម្បីបង្កើតគណនីថ្មី (Contact administrator to create account)")
                  }
                  className="text-[#2563eb] font-medium hover:underline cursor-pointer"
                >
                  Create an account
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* ── RIGHT PANE: Luxury Automotive Interior Showcase ── */}
        <div
          className="md:col-span-7 relative hidden md:block bg-cover bg-center overflow-hidden"
          style={{
            backgroundImage: "url('/images/mhero_interior_luxury.jpg')",
          }}
        >
          {/* Subtle gradient shadow over image for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

          {/* Bottom Left Branding on the Car Image */}
          <div className="absolute bottom-8 left-8 z-10 text-white select-none">
            <h2 className="text-3xl font-black tracking-wider uppercase font-sans drop-shadow-md">
              MHERO
            </h2>
            <p className="text-sm font-medium tracking-wide text-slate-200 mt-1 drop-shadow-sm">
              Engineered for the future
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
