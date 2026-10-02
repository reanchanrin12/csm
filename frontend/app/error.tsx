"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  TableProperties,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  Home,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error logged:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] font-sans antialiased text-[#212529]">
      {/* 1. System Top Navbar matching Dashboard Header */}
      <header className="h-[56px] w-full bg-[#070c18] border-b border-[#162138] flex items-center justify-between px-3 sm:px-5 sticky top-0 z-40 shadow-md">
        <Link
          href="/"
          className="flex items-center gap-2.5 py-1 hover:opacity-90 transition-opacity"
          title="Go to Dashboard"
        >
          <Image
            src="/images/WINWAY.png"
            alt="WINWAY"
            width={160}
            height={36}
            className="h-8 sm:h-9 w-auto object-contain select-none drop-shadow-sm"
            priority
          />
          <span className="font-black text-sm sm:text-base tracking-[0.18em] text-white">
            WINWAY
          </span>
        </Link>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          Car Showroom Management (CSM)
        </span>
      </header>

      {/* 2. Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-4">
        {/* Breadcrumb bar */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-[#e9ecef] border border-slate-200/70 text-xs rounded text-slate-600 w-fit">
          <div className="bg-[#e02424] text-white p-1 rounded-xs">
            <AlertCircle className="h-3.5 w-3.5" />
          </div>
          <Link href="/" className="text-[#1c64f2] hover:underline font-medium">
            Dashboard
          </Link>
          <span className="text-slate-400">&gt;</span>
          <span className="text-slate-600">System Error</span>
        </div>

        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-[22px] font-bold text-slate-800 tracking-tight leading-tight">
            System Error
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Something went wrong while processing your request
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded border border-slate-200 p-8 shadow-xs max-w-3xl text-center">
          {/* Friendly Alert Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-amber-50 text-amber-800 mb-3 border border-amber-200/60">
            Temporary Issue
          </span>

          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Unable to process your request at this time
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed max-w-lg mx-auto">
            We encountered an unexpected issue while loading this page. <strong className="font-semibold text-slate-700">Your data remains safe and unaffected.</strong>
          </p>

          {/* Helpful User Guidance Box */}
          <div className="mt-6 p-4 rounded bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-2 max-w-lg mx-auto">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Recommended Actions:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 leading-normal">
              <li>Click <strong>&ldquo;Try Again&rdquo;</strong> to retry the request</li>
              <li>Check your internet or network connection</li>
              <li>Click <strong>&ldquo;Reload Page&rdquo;</strong> or return to <strong>&ldquo;Dashboard&rdquo;</strong></li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Button
              type="button"
              onClick={() => reset()}
              className="h-9 px-5 text-xs font-medium text-white bg-[#0284c7] hover:bg-[#0369a1] cursor-pointer shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              <span>Try Again</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
              className="h-9 px-4 text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              <span>Reload Page</span>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-9 px-4 text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Link href="/">
                <Home className="h-3.5 w-3.5 mr-1.5" />
                <span>Dashboard</span>
              </Link>
            </Button>
          </div>

          {/* Collapsible IT Details */}
          {error.digest && (
            <details className="mt-6 pt-4 border-t border-slate-100 text-left max-w-lg mx-auto group">
              <summary className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer select-none flex items-center justify-between">
                <span>Technical Reference for IT Support</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-2 p-2.5 rounded bg-slate-100 font-mono text-[11px] text-slate-600 break-all border border-slate-200">
                Error Digest: {error.digest}
              </div>
            </details>
          )}

          {/* Footer Support Info */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            <span>If this issue persists, please contact your system administrator.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
