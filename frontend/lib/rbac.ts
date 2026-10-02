import type { UserRole } from "@csm/contracts";

// ASSUMPTION: Unified RBAC permissions shared between Sidebar and RouteGuard to auto-hide restricted menus — confirm

export interface RouteRoleRule {
  prefix: string;
  allowedRoles: UserRole[];
}

export const ROUTE_ROLE_RULES: RouteRoleRule[] = [
  { prefix: "/settings", allowedRoles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/users", allowedRoles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/employees", allowedRoles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"] },
  { prefix: "/finance", allowedRoles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"] },
  { prefix: "/logistics", allowedRoles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER", "ACCOUNTANT"] },
  { prefix: "/transfers", allowedRoles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER", "SALE"] },
  { prefix: "/reports/sales", allowedRoles: ["SUPER_ADMIN", "ADMIN", "SALE", "ACCOUNTANT"] },
  { prefix: "/reports/expenses", allowedRoles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"] },
  { prefix: "/reports/inventory", allowedRoles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER", "ACCOUNTANT"] },
  { prefix: "/reports/logistics", allowedRoles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER", "ACCOUNTANT"] },
  { prefix: "/reports/loans", allowedRoles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"] },
  { prefix: "/reports/repairs", allowedRoles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TECHNICIAN", "STOCK_CONTROLLER"] },
];

/**
 * Validates if the given user role is permitted to access a given URL path
 */
export function isRouteAllowed(pathname: string, role?: UserRole | string | null): boolean {
  if (!role) return false;
  const normalizedRole = role.toUpperCase();
  if (normalizedRole === "SUPER_ADMIN") return true;

  const matchedRule = ROUTE_ROLE_RULES.find((rule) => pathname.startsWith(rule.prefix));
  if (!matchedRule) return true; // Standard dashboard routes are open to all authenticated users

  return matchedRule.allowedRoles.includes(normalizedRole as UserRole);
}
