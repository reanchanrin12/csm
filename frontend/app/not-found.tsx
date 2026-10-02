"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TableProperties,
  ArrowLeft,
  Home,
  Car,
  DollarSign,
  FileText,
  Search,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

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
          <div className="bg-[#0284c7] text-white p-1 rounded-xs">
            <TableProperties className="h-3.5 w-3.5" />
          </div>
          <Link href="/" className="text-[#1c64f2] hover:underline font-medium">
            Dashboard
          </Link>
          <span className="text-slate-400">&gt;</span>
          <span className="text-slate-600">Page Not Found</span>
        </div>

        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-[22px] font-bold text-slate-800 tracking-tight leading-tight">
            Page Not Found
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            The requested page or link is not available
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded border border-slate-200 p-8 shadow-xs max-w-3xl text-center">
          {/* Soft Search Badge */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0284c7]">
            <Search className="h-8 w-8 text-[#0284c7]" />
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-[#f0f3f6] text-slate-600 mb-3 border border-slate-200">
            Status Code: 404
          </span>

          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            We couldn&apos;t find the page you&apos;re looking for
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed max-w-lg mx-auto">
            The page may have been moved, deleted, or the URL might be mistyped. Please verify the URL or use the quick links below.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-9 px-4 text-xs font-medium border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              <span>Go Back</span>
            </Button>

            <Button
              asChild
              className="h-9 px-5 text-xs font-medium text-white bg-[#0284c7] hover:bg-[#0369a1] cursor-pointer shadow-xs"
            >
              <Link href="/">
                <Home className="h-3.5 w-3.5 mr-1.5" />
                <span>Back to Dashboard</span>
              </Link>
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-left">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Quick Navigation Links
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/inventory"
                className="flex items-center gap-3 p-3 rounded bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 transition-colors group"
              >
                <div className="h-8 w-8 rounded bg-white border border-slate-200 flex items-center justify-center text-[#0284c7] shadow-xs">
                  <Car className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">Car Inventory</div>
                  <div className="text-[11px] text-slate-500">View cars in stock</div>
                </div>
              </Link>

              <Link
                href="/sales"
                className="flex items-center gap-3 p-3 rounded bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 transition-colors group"
              >
                <div className="h-8 w-8 rounded bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">Sales &amp; Loans</div>
                  <div className="text-[11px] text-slate-500">Orders, invoices and loan plans</div>
                </div>
              </Link>

              <Link
                href="/expenses"
                className="flex items-center gap-3 p-3 rounded bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 transition-colors group"
              >
                <div className="h-8 w-8 rounded bg-white border border-slate-200 flex items-center justify-center text-amber-600 shadow-xs">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">Operating Expenses</div>
                  <div className="text-[11px] text-slate-500">Track showroom and office expenses</div>
                </div>
              </Link>

              <Link
                href="/reports"
                className="flex items-center gap-3 p-3 rounded bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 transition-colors group"
              >
                <div className="h-8 w-8 rounded bg-white border border-slate-200 flex items-center justify-center text-[#1c64f2] shadow-xs">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800">Reports Hub</div>
                  <div className="text-[11px] text-slate-500">Analytics and CSV export</div>
                </div>
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            <span>If you need assistance, please contact your system administrator.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
