"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useGlobalLoadingStore } from "@/lib/loading-store";

function RouteProgressTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // When path or search parameters finish changing, complete the progress bar
    setProgress(100);
    const timeout = setTimeout(() => {
      setNavigating(false);
      setProgress(0);
    }, 280);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  // Intercept navigation link clicks globally
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (
        target &&
        target.href &&
        target.target !== "_blank" &&
        !target.href.startsWith("mailto:") &&
        !target.href.startsWith("tel:") &&
        !target.href.startsWith("#")
      ) {
        const url = new URL(target.href);
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
          setNavigating(true);
          setProgress(30);
          setTimeout(() => setProgress(75), 100);
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => document.removeEventListener("click", handleAnchorClick, true);
  }, []);

  if (!navigating && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-500 shadow-[0_0_12px_rgba(56,189,248,0.8)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}

export function GlobalLoader() {
  const { isLoading, message, resetLoading } = useGlobalLoadingStore();
  const [mounted, setMounted] = useState(false);
  const [showDismiss, setShowDismiss] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a failsafe dismiss button if loading takes longer than 8 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isLoading) {
      timer = setTimeout(() => {
        setShowDismiss(true);
      }, 8000);
    } else {
      setShowDismiss(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  if (!mounted) return null;

  return (
    <>
      {/* Top route change progress bar */}
      <Suspense fallback={null}>
        <RouteProgressTracker />
      </Suspense>

      {/* Global Luxury Backdrop & Spinner */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/65 backdrop-blur-md transition-all duration-300 animate-in fade-in"
        >
          {/* Ambient Lighting Glow */}
          <div className="absolute w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute w-64 h-64 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Modal Container */}
          <div className="relative z-10 bg-[#0B1528]/95 border border-cyan-500/30 rounded-2xl p-7 shadow-2xl flex flex-col items-center text-center max-w-sm mx-4 backdrop-blur-xl">
            {/* Dual Orbital Spinner with VOYAH Wings Logo */}
            <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
              {/* Outer glowing spinning ring */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-blue-500 animate-spin" />
              {/* Middle reverse-spinning dashed ring */}
              <div
                className="absolute inset-1.5 rounded-full border-2 border-transparent border-b-cyan-300 border-l-indigo-400 animate-spin"
                style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
              />
              {/* Inner ambient ring */}
              <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-blue-900/60 to-cyan-900/40 border border-cyan-400/20 shadow-inner" />

              {/* VOYAH Wings Brand Icon in Center */}
              <svg
                viewBox="0 0 24 24"
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="relative z-10 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse"
              >
                <path d="M4 4l8 16L20 4M8 4l4 8 4-8" />
              </svg>
            </div>

            {/* Brand Title */}
            <div className="text-[11px] font-black tracking-[0.25em] text-cyan-400/90 uppercase mb-1">
              VOYAH &amp; MHERO
            </div>

            {/* Status Message */}
            <p className="text-sm font-semibold text-white tracking-wide">
              {message || "កំពុងដំណើរការ..."}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              សូមរង់ចាំបន្តិច ប្រព័ន្ធកំពុងដំណើរការទិន្នន័យ
            </p>

            {/* Pulsing Dots Indicator */}
            <div className="flex items-center gap-1.5 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
            </div>

            {/* Failsafe Dismiss if taking too long */}
            {showDismiss && (
              <button
                type="button"
                onClick={resetLoading}
                className="mt-5 px-3 py-1 text-[11px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 transition-colors cursor-pointer"
              >
                បិទផ្ទាំងនេះ (Dismiss)
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
