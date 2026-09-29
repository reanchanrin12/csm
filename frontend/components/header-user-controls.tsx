"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Car, Mail, User, Users, Settings, Power, LogOut } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function HeaderUserControls() {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
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

        {/* System Users Direct Menu Button (Admin / Super Admin) */}
        {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
          <Link
            href="/settings?tab=users"
            className="flex items-center gap-1.5 px-2 py-0.5 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/50 rounded transition-colors border-r border-slate-700/50"
            title="គ្រប់គ្រង System Users"
          >
            <Users className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold tracking-wide">Users</span>
          </Link>
        )}

        {/* User Profile Info */}
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 text-slate-200 border-r border-slate-700/50 select-none"
          title={`ចូលប្រើប្រាស់ជា: ${user?.role || "User"}`}
        >
          <User className="h-3.5 w-3.5 text-slate-400" />
          {user ? (
            <span className="text-[11px] font-bold uppercase tracking-wide">
              {user.username}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Profile</span>
          )}
        </div>

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
          onClick={() => setShowLogoutConfirm(true)}
          title="ចាកចេញពីប្រព័ន្ធ (Logout)"
          className="bg-[#dc2626] hover:bg-[#b91c1c] active:scale-95 text-white p-1 rounded-xs ml-1 cursor-pointer transition-colors flex items-center justify-center shadow-xs"
        >
          <Power className="h-3 w-3 stroke-[2.5]" />
        </button>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="ចាកចេញពីប្រព័ន្ធ (Logout)"
        description="តើអ្នកពិតជាចង់ចាកចេញពីប្រព័ន្ធមែនទេ? អ្នកនឹងត្រូវបញ្ចូលពាក្យសម្ងាត់ម្ដងទៀតដើម្បីចូលប្រើប្រាស់។"
        confirmText="ចាកចេញ (Logout)"
        cancelText="បោះបង់ (Cancel)"
        variant="destructive"
        icon={
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-500 border border-red-500/25">
            <LogOut className="h-6 w-6" />
          </div>
        }
        onConfirm={handleLogout}
      />
    </>
  );
}
