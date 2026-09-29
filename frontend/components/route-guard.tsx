"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import type { UserRole } from "@csm/contracts";

const routeRoleMap: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/settings", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/users", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/employees", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/finance", roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"] },
  { prefix: "/logistics", roles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER"] },
  { prefix: "/transfers", roles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER"] },
];

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>កំពុងផ្ទៀងផ្ទាត់សិទ្ធិ (Checking permissions)...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Super Admin bypass
  if (user.role === "SUPER_ADMIN") {
    return <>{children}</>;
  }

  // Check matching prefix
  const matchedRule = routeRoleMap.find((rule) => pathname.startsWith(rule.prefix));
  if (matchedRule && !matchedRule.roles.includes(user.role)) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 text-center shadow-xs">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-3">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            មិនមានសិទ្ធិចូលទំព័រនេះទេ (Access Denied)
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            គណនីរបស់អ្នកមានតួនាទី <strong className="text-slate-800 uppercase">{user.role}</strong> ដែលមិនមានការអនុញ្ញាតឱ្យបើកមើលផ្នែកនេះឡើយ។ សូមទាក់ទង Administrator។
          </p>
          <div className="mt-5">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>ត្រឡប់ទៅ Dashboard វិញ</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
