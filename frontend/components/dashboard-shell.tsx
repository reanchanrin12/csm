"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { HeaderUserControls } from "@/components/header-user-controls";
import { RouteGuard } from "@/components/route-guard";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f2f5] font-sans antialiased">
      {/* 1. Full-Width Top Navbar */}
      <header className="h-[56px] w-full bg-[#070c18] border-b border-[#162138] flex items-center justify-between px-3 sm:px-5 sticky top-0 z-40 shadow-md relative overflow-hidden print:hidden">
        {/* Cockpit ambient lighting overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030611] via-[#0c162e] to-[#040816] pointer-events-none" />
        <div className="absolute inset-y-0 left-36 w-96 bg-blue-600/10 blur-2xl pointer-events-none" />
        <div className="absolute inset-y-0 right-72 w-80 bg-cyan-600/10 blur-2xl pointer-events-none" />

        {/* Left: Mobile Hamburger Toggle + Brand Logo */}
        <div className="relative z-10 flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded transition-colors cursor-pointer focus:outline-none"
            aria-label="Open Mobile Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            href="/"
            className="flex items-center gap-2.5 py-1 hover:opacity-90 transition-opacity"
            title="WINWAY Dashboard"
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
        </div>

        {/* Right: Quick Action Controls Pill */}
        <HeaderUserControls />
      </header>

      {/* Mobile Slide-over Drawer / Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Sidebar */}
          <div className="relative w-[270px] max-w-[85vw] bg-[#0c1322] border-r border-[#1a233a] flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="h-[56px] px-4 border-b border-[#1a233a] flex items-center justify-between bg-[#070c18]">
              <span className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                CSM Menu
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto">
              <SidebarNav onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Body: Desktop Sidebar + Right Content Area */}
      <div className="flex flex-1 min-h-[calc(100vh-56px)] print:min-h-0 print:block">
        {/* Desktop Sidebar (hidden on phone, visible on md and up) */}
        <aside className="hidden md:flex w-[220px] lg:w-[240px] bg-[#0c1322] border-r border-[#1a233a] flex-col shrink-0 sticky top-[56px] h-[calc(100vh-56px)] z-30 print:hidden">
          <SidebarNav />
        </aside>

        {/* Right Main Content protected by RouteGuard */}
        <main className="flex-1 bg-white p-3 sm:p-5 md:p-6 overflow-y-auto print:p-0 print:m-0 print:bg-white print:overflow-visible">
          <RouteGuard>{children}</RouteGuard>
        </main>
      </div>
    </div>
  );
}
