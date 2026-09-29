import React from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { HeaderUserControls } from "@/components/header-user-controls";
import { RouteGuard } from "@/components/route-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] font-sans antialiased">

      {/* 1. Full-Width Top Navbar with VOYAH Brand & Automotive Dark Header */}
      <header className="h-[52px] w-full bg-[#070c18] border-b border-[#162138] flex items-center justify-between px-5 sticky top-0 z-50 shadow-md relative overflow-hidden">
        {/* Cockpit ambient lighting overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030611] via-[#0c162e] to-[#040816] pointer-events-none" />
        <div className="absolute inset-y-0 left-36 w-96 bg-blue-600/10 blur-2xl pointer-events-none" />
        <div className="absolute inset-y-0 right-72 w-80 bg-cyan-600/10 blur-2xl pointer-events-none" />

        {/* Left: VOYAH Wings Logo & Brand */}
        <div className="relative z-10 flex items-center gap-2.5">
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-white shrink-0"
          >
            <path d="M4 4l8 16L20 4M8 4l4 8 4-8" />
          </svg>
          <span className="font-black text-xl tracking-[0.25em] text-white select-none">
            VOYAH
          </span>
        </div>

        {/* Right: Quick Action Controls Pill */}
        <HeaderUserControls />
      </header>

      {/* 2. Main Body: Left Sidebar + Right Content Area */}
      <div className="flex flex-1 min-h-[calc(100vh-52px)]">
        {/* Left Dark Sidebar matching CSM 1.0 */}
        <aside className="w-[220px] sm:w-[240px] bg-[#0c1322] border-r border-[#1a233a] flex flex-col shrink-0 sticky top-[52px] h-[calc(100vh-52px)] z-40">
          {/* 14 Menu List */}
          <SidebarNav />
        </aside>

        {/* Right Main Content protected by RouteGuard */}
        <main className="flex-1 bg-white p-5 sm:p-6 overflow-y-auto">
          <RouteGuard>{children}</RouteGuard>
        </main>
      </div>
    </div>
  );
}
