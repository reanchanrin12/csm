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
      <div className="relative z-10 flex items-center bg-white border border-slate-300 rounded shadow-xs overflow-hidden text-slate-700 divide-x divide-slate-200">
        {/* Car Count */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-slate-700 text-xs font-semibold select-none"
          title="Active Vehicles"
        >
          <Car className="h-3.5 w-3.5 text-slate-600" />
          <span>0</span>
        </div>

        {/* Mail Count */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-slate-700 text-xs font-semibold select-none"
          title="Notifications & Messages"
        >
          <Mail className="h-3.5 w-3.5 text-slate-600" />
          <span>0</span>
        </div>

        {/* System Users Direct Menu Button (Admin / Super Admin) */}
        {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
          <Link
            href="/settings?tab=users"
            className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-slate-50 text-xs font-semibold transition-colors"
            title="Manage System Users"
          >
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Users</span>
          </Link>
        )}

        {/* User Profile Info */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 text-slate-800 text-xs font-semibold select-none"
          title={`Logged in as: ${user?.role || "User"}`}
        >
          <User className="h-3.5 w-3.5 text-slate-600" />
          <span className="truncate max-w-[65px] sm:max-w-[100px]">{user?.username || "Admin"}</span>
        </div>

        {/* Settings */}
        <Link
          href="/settings"
          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          title="Settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </Link>

        {/* Power / Logout Button (Red button on the far right) */}
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          title="Logout"
          className="bg-[#d9534f] hover:bg-[#c9302c] active:bg-[#ac2925] text-white px-2.5 py-1.5 cursor-pointer transition-colors flex items-center justify-center"
        >
          <Power className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Sign Out (Logout)"
        description="Are you sure you want to sign out from the system? You will need your credentials to log in again."
        confirmText="Sign Out"
        cancelText="Cancel"
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
