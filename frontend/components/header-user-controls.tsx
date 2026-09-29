"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Car, Mail, User, Settings, Power } from "lucide-react";

export function HeaderUserControls() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm("តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធ (Logout) មែនទេ?")) {
      await logout();
    }
  };

  return (
    <div className="relative z-10 flex items-center gap-1.5 bg-[#0b1325]/90 border border-slate-700/60 rounded px-2.5 py-1 shadow-inner">
      {/* Car Count */}
      <div className="flex items-center gap-1 px-2 py-0.5 text-slate-300 hover:text-white cursor-pointer transition-colors border-r border-slate-700/50">
        <Car className="h-3.5 w-3.5" />
        <span className="text-[11px] font-bold">0</span>
      </div>

      {/* Mail Count */}
      <div className="flex items-center gap-1 px-2 py-0.5 text-slate-300 hover:text-white cursor-pointer transition-colors border-r border-slate-700/50">
        <Mail className="h-3.5 w-3.5" />
        <span className="text-[11px] font-bold">0</span>
      </div>

      {/* User Profile Info */}
      <Link
        href="/settings?tab=users"
        className="flex items-center gap-1.5 px-2 py-0.5 text-slate-200 hover:text-cyan-400 cursor-pointer transition-colors border-r border-slate-700/50"
        title="គ្រប់គ្រងគណនី (System Users)"
      >
        <User className="h-3.5 w-3.5" />
        {user ? (
          <span className="text-[11px] font-bold uppercase tracking-wide">
            {user.username}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Profile</span>
        )}
      </Link>

      {/* Settings */}
      <Link
        href="/settings"
        className="px-2 py-0.5 text-slate-300 hover:text-white cursor-pointer transition-colors"
        title="Settings"
      >
        <Settings className="h-3.5 w-3.5" />
      </Link>

      {/* Power / Logout */}
      <button
        type="button"
        onClick={handleLogout}
        title="ចាកចេញពីប្រព័ន្ធ (Logout)"
        className="bg-[#dc2626] hover:bg-[#b91c1c] active:scale-95 text-white p-1 rounded-xs ml-1 cursor-pointer transition-colors flex items-center justify-center shadow-xs"
      >
        <Power className="h-3 w-3 stroke-[2.5]" />
      </button>
    </div>
  );
}
