"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, RefreshCw, ShieldAlert } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log safe error telemetry server/client-side
    console.error("Dashboard Server Error caught:", error);
  }, [error]);

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <div className="relative z-10 max-w-lg w-full bg-[#0B1528] border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center text-white backdrop-blur-xl">
        {/* Ambient Hazard Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Warning Icon with Pulse */}
        <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-red-500/10 border border-red-500/30 animate-ping opacity-75" />
          <div className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-tr from-red-950 to-red-900 border border-red-500/40 flex items-center justify-center text-red-400 shadow-lg shadow-red-950/50">
            <AlertTriangle className="h-7 w-7" />
          </div>
        </div>

        {/* Brand Tag */}
        <div className="text-[11px] font-black tracking-[0.25em] text-red-400 uppercase mb-2">
          VOYAH &amp; MHERO &bull; SERVER ERROR 500
        </div>

        {/* Header Message */}
        <h2 className="text-xl font-bold tracking-tight text-white mb-2">
          មានបញ្ហាបច្ចេកទេសលើម៉ាស៊ីនបម្រើ (Server Error)
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
          ប្រព័ន្ធមិនអាចដំណើរការសំណើរបស់អ្នកនៅពេលនេះបានទេ។ ទិន្នន័យរបស់អ្នកត្រូវបានការពារដោយសុវត្ថិភាព។ សូមព្យាយាមម្តងទៀត ឬទាក់ទងផ្នែកបច្ចេកទេសប្រសិនបើបញ្ហានៅតែបន្ត។
        </p>

        {/* Error Reference Code */}
        {error.digest && (
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-black/40 border border-white/10 text-[11px] font-mono text-slate-400">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
            <span>Ref Code: {error.digest}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>ព្យាយាមម្តងទៀត (Try Again)</span>
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>ផ្ទុកទំព័រឡើងវិញ (Reload)</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-transparent hover:bg-white/5 border border-white/10 transition-all"
          >
            <Home className="h-4 w-4" />
            <span>ទំព័រដើម (Dashboard)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
