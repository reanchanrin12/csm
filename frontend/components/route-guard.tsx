"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AccessDenied } from "@/components/access-denied";
import { isRouteAllowed, ROUTE_ROLE_RULES } from "@/lib/rbac";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Match route against RBAC rules
  const matchedRule = ROUTE_ROLE_RULES.find((rule) => pathname.startsWith(rule.prefix));

  // 1. Open routes (Dashboard, Vehicles, Sales, Reports) render immediately
  if (!matchedRule) {
    return <>{children}</>;
  }

  // 2. Loading state for restricted routes
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-7 w-48 bg-slate-200 rounded-md" />
        <div className="h-4 w-72 bg-slate-100 rounded-md" />
        <div className="h-64 bg-slate-50 border border-slate-200/80 rounded-xl" />
      </div>
    );
  }

  // 3. Check role authorization using centralized RBAC
  if (user && !isRouteAllowed(pathname, user.role)) {
    return <AccessDenied userRole={user.role} />;
  }

  return <>{children}</>;
}
