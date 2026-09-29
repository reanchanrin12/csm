import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#070c18] flex flex-col items-center justify-center p-6 text-center">
      {/* VOYAH Logo & Orbital Spinner */}
      <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-blue-500 animate-spin" />
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white animate-pulse"
        >
          <path d="M4 4l8 16L20 4M8 4l4 8 4-8" />
        </svg>
      </div>

      <div className="text-xs font-black tracking-[0.25em] text-cyan-400 uppercase mb-2">
        VOYAH &amp; MHERO
      </div>
      <div className="text-xs text-slate-400 font-medium">
        កំពុងដំណើរការប្រព័ន្ធ...
      </div>
    </div>
  );
}
