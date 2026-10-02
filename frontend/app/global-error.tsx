"use client";

import React, { useEffect } from "react";
import { AlertCircle, RotateCcw, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Application Error logged:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f4f6f9] text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased select-none">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 text-center">
          
          {/* Friendly Alert Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-inner">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Temporary System Error
          </h2>
          
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
            We encountered an unexpected issue while loading the application. Your data is safe. Please click below to restart or reload the page.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0284c7] hover:bg-[#0369a1] shadow-sm transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Try Again</span>
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reload Page</span>
            </button>
          </div>

          {error.digest && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
              Ref Code: {error.digest}
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
