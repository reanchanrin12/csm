"use client";

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="km">
      <body className="min-h-screen bg-[#070c18] text-white flex flex-col items-center justify-center p-6 font-sans antialiased">
        <div className="relative z-10 max-w-md w-full bg-[#0B1528] border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div className="text-[11px] font-black tracking-[0.25em] text-red-400 uppercase mb-1">
            CRITICAL APPLICATION ERROR
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            ប្រព័ន្ធជួបប្រទះបញ្ហាបច្ចេកទេស
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            សូមអភ័យទោស ប្រព័ន្ធបានជួបប្រទះបញ្ហាមិនរំពឹងទុកមួយ។ សូមចុចប៊ូតុងខាងក្រោមដើម្បីព្យាយាមម្តងទៀត។
          </p>

          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>ព្យាយាមម្តងទៀត (Try Again)</span>
          </button>
        </div>
      </body>
    </html>
  );
}
