import React from "react";
import Image from "next/image";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      {/* Brand Icon & Spinner Container */}
      <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
        {/* Soft glowing ambient ring */}
        <div className="absolute inset-0 rounded-full bg-orange-100/70 animate-ping opacity-30" />
        
        {/* Smooth spinner ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 border-t-orange-500 border-r-[#1a233a] animate-spin" />
        
        {/* WINWAY Logo */}
        <div className="h-12 w-12 rounded-full bg-white shadow-md flex items-center justify-center p-1.5 overflow-hidden border border-slate-100">
          <Image
            src="/images/WINWAY.png"
            alt="WINWAY"
            width={44}
            height={44}
            className="h-full w-full object-contain"
            priority
          />
        </div>
      </div>

      {/* Brand Name */}
      <div className="text-sm font-black tracking-[0.25em] text-[#1a233a] uppercase mb-1.5">
        WINWAY AUTO
      </div>

      {/* English Status */}
      <h2 className="text-base font-semibold text-slate-800 mb-1">
        Loading data, please wait...
      </h2>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
        Preparing and loading your showroom information
      </p>

      {/* Subtle Progress Bar */}
      <div className="w-48 h-1 bg-slate-200 rounded-full mt-5 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-orange-500 to-[#1a233a] rounded-full w-2/3 animate-[pulse_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
