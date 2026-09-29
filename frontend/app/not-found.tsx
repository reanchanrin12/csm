"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  ArrowLeft,
  Car,
  FileText,
  DollarSign,
  Search,
  Home,
  ShieldAlert,
} from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#070c18] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      {/* Ambient Cockpit Lighting Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 max-w-xl w-full flex flex-col items-center text-center">
        {/* VOYAH Wings Brand Emblem */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-700 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
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
                className="text-cyan-400"
              >
                <path d="M4 4l8 16L20 4M8 4l4 8 4-8" />
              </svg>
            </div>
          </div>
          <span className="font-black text-sm tracking-[0.25em] text-white">
            VOYAH &amp; MHERO
          </span>
        </div>

        {/* 404 Large Display */}
        <div className="relative mb-2">
          <span className="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-white via-slate-200 to-slate-600 bg-clip-text text-transparent drop-shadow-2xl">
            404
          </span>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 backdrop-blur-md">
            Page Not Found
          </span>
        </div>

        {/* Khmer & English Message */}
        <h1 className="text-xl sm:text-2xl font-bold text-white mt-4 tracking-tight">
          រកមិនឃើញទំព័រដែលអ្នកកំពុងស្វែងរកទេ
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
          ទំព័រនេះប្រហែលជាត្រូវបានផ្លាស់ប្តូរទីតាំង លុបចេញ ឬតំណភ្ជាប់មិនត្រឹមត្រូវ។ សូមពិនិត្យមើល URL ឡើងវិញ ឬត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង។
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-7 w-full">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>ថយក្រោយ (Go Back)</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            <Home className="h-4 w-4" />
            <span>ទំព័រដើម (Dashboard)</span>
          </Link>
        </div>

        {/* Quick Portal Jump Cards */}
        <div className="w-full mt-10 pt-6 border-t border-white/10">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
            ផ្លូវកាត់សំខាន់ៗ (Quick Links)
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
            <Link
              href="/inventory"
              className="p-3 rounded-lg bg-[#0e172a]/80 hover:bg-[#152342] border border-white/5 hover:border-cyan-500/30 transition-all group"
            >
              <Car className="h-4 w-4 text-cyan-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-semibold text-white">Inventory</div>
              <div className="text-[10px] text-slate-400">ឃ្លាំងរថយន្ត</div>
            </Link>

            <Link
              href="/sales"
              className="p-3 rounded-lg bg-[#0e172a]/80 hover:bg-[#152342] border border-white/5 hover:border-blue-500/30 transition-all group"
            >
              <DollarSign className="h-4 w-4 text-blue-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-semibold text-white">Sales &amp; Loans</div>
              <div className="text-[10px] text-slate-400">ការលក់ &amp; កម្ចី</div>
            </Link>

            <Link
              href="/finance"
              className="p-3 rounded-lg bg-[#0e172a]/80 hover:bg-[#152342] border border-white/5 hover:border-amber-500/30 transition-all group"
            >
              <DollarSign className="h-4 w-4 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-semibold text-white">Finance</div>
              <div className="text-[10px] text-slate-400">ហិរញ្ញវត្ថុ</div>
            </Link>

            <Link
              href="/reports"
              className="p-3 rounded-lg bg-[#0e172a]/80 hover:bg-[#152342] border border-white/5 hover:border-emerald-500/30 transition-all group"
            >
              <FileText className="h-4 w-4 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-semibold text-white">Reports</div>
              <div className="text-[10px] text-slate-400">របាយការណ៍</div>
            </Link>
          </div>
        </div>

        {/* Footer Support Tag */}
        <div className="mt-8 text-[11px] text-slate-500">
          CSM System &copy; {new Date().getFullYear()} VOYAH &amp; MHERO CAMBODIA. All rights reserved.
        </div>
      </div>
    </div>
  );
}
