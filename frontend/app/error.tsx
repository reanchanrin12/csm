"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, RefreshCw, ShieldAlert } from "lucide-react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root Application Error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#070c18] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      {/* Ambient Hazard Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-red-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 max-w-lg w-full flex flex-col items-center text-center">
        {/* VOYAH Wings Brand Emblem */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 p-0.5 flex items-center justify-center shadow-lg shadow-red-500/20">
            <div className="h-full w-full bg-[#070c18] rounded-[6px] flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-400"
              >
                <path d="M4 4l8 16L20 4M8 4l4 8 4-8" />
              </svg>
            </div>
          </div>
          <span className="font-black text-sm tracking-[0.25em] text-white">
            VOYAH &amp; MHERO
          </span>
        </div>

        {/* 500 Large Display */}
        <div className="relative mb-2">
          <span className="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-white via-slate-200 to-red-400/40 bg-clip-text text-transparent drop-shadow-2xl">
            500
          </span>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-red-500/10 border border-red-500/30 text-red-400 backdrop-blur-md">
            Internal Server Error
          </span>
        </div>

        {/* Khmer Message */}
        <h1 className="text-xl sm:text-2xl font-bold text-white mt-4 tracking-tight">
          មានបញ្ហាបច្ចេកទេសលើម៉ាស៊ីនបម្រើ
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
          ប្រព័ន្ធបានជួបប្រទះបញ្ហាមិនរំពឹងទុកមួយ។ ទិន្នន័យរបស់អ្នកមានសុវត្ថិភាព។ សូមចុច &ldquo;ព្យាយាមម្តងទៀត&rdquo; ឬត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង។
        </p>

        {/* Digest Code */}
        {error.digest && (
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-black/40 border border-white/10 text-[11px] font-mono text-slate-400">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
            <span>Ref Code: {error.digest}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-7 w-full">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>ព្យាយាមម្តងទៀត (Try Again)</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-[1.02]"
          >
            <Home className="h-4 w-4" />
            <span>ទំព័រដើម (Dashboard)</span>
          </Link>
        </div>

        {/* Footer Support Tag */}
        <div className="mt-12 text-[11px] text-slate-500">
          CSM System &copy; {new Date().getFullYear()} VOYAH &amp; MHERO CAMBODIA. All rights reserved.
        </div>
      </div>
    </div>
  );
}
