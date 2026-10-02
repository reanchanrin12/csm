"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { isRouteAllowed } from "@/lib/rbac";
import type { UserRole } from "@csm/contracts";
import {
  PieChart,
  Calculator,
  Settings,
  Car,
  ShoppingCart,
  DollarSign,
  Calendar,
  Truck,
  ArrowRightLeft,
  Wrench,
  Users,
  CreditCard,
  FileText,
  Ship,
  Receipt,
  ChevronDown,
  Package,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavSubItem {
  name: string;
  href: string;
  roles?: UserRole[];
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  subItems?: NavSubItem[];
  roles?: UserRole[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const csmNavSections: NavSection[] = [
  {
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: PieChart,
      },
      {
        name: "Calculator",
        href: "/calculator",
        icon: Calculator,
        roles: ["SUPER_ADMIN", "ADMIN", "SALE", "ACCOUNTANT"],
      },
      {
        name: "General setting",
        icon: Settings,
        subItems: [
          { name: "Car brand", href: "/settings?tab=brands" },
          { name: "Country", href: "/settings?tab=countries" },
          { name: "Company Profile", href: "/settings?tab=profile" },
          { name: "Branch", href: "/settings?tab=branches" },
          { name: "Supplier & Customer", href: "/settings?tab=suppliers" },
        ],
      },
      {
        name: "Buying",
        icon: Car,
        roles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER"],
        subItems: [
          { name: "Car Purchasing", href: "/inventory/new" },
          { name: "Manage purchased car", href: "/inventory" },
        ],
      },
      {
        name: "Selling",
        icon: ShoppingCart,
        roles: ["SUPER_ADMIN", "ADMIN", "SALE", "ACCOUNTANT"],
        subItems: [
          { name: "New Sell", href: "/sales/new", roles: ["SUPER_ADMIN", "ADMIN", "SALE"] },
          { name: "Manage Sold Cars", href: "/sales" },
        ],
      },
      {
        name: "Payment & Expend",
        icon: DollarSign,
        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],
        subItems: [
          { name: "Customer payment", href: "/finance?tab=customer" },
          { name: "Supplier payment", href: "/finance?tab=supplier" },
          { name: "Repair payment", href: "/finance?tab=repair" },
          { name: "Other Expense", href: "/finance?tab=expenses" },
        ],
      },
      {
        name: "Schedule",
        href: "/schedule",
        icon: Calendar,
        roles: ["SUPER_ADMIN", "ADMIN", "SALE", "ACCOUNTANT"],
      },
      {
        name: "Tax & Clearance Fee",
        icon: Receipt,
        roles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER", "ACCOUNTANT"],
        subItems: [{ name: "Add new clearance", href: "/logistics?tab=clearance" }],
      },
      {
        name: "Shipping Fee",
        icon: Ship,
        roles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER", "ACCOUNTANT"],
        subItems: [{ name: "Add new shipping", href: "/logistics?tab=shipping" }],
      },
      {
        name: "Tracking Shipping",
        href: "/logistics",
        icon: Truck,
        roles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER", "ACCOUNTANT"],
      },
      {
        name: "Car Transfer",
        href: "/transfers",
        icon: ArrowRightLeft,
        roles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER", "SALE"],
      },
      {
        name: "Repair",
        href: "/finance?tab=repair",
        icon: Wrench,
        roles: ["SUPER_ADMIN", "ADMIN", "TECHNICIAN", "STOCK_CONTROLLER", "ACCOUNTANT"],
      },
      {
        name: "Employee",
        href: "/employees",
        icon: Users,
        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],
      },
      {
        name: "Bank loan & Payment",
        icon: CreditCard,
        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],
        subItems: [
          { name: "Bank Loan List", href: "/finance?tab=bank-loans" },
          { name: "Loan Repayments Report", href: "/reports/loans" },
        ],
      },
    ],
  },
  {
    title: "REPORTS",
    items: [
      {
        name: "Sales Reports",
        href: "/reports/sales",
        icon: TrendingUp,
        roles: ["SUPER_ADMIN", "ADMIN", "SALE", "ACCOUNTANT"],
      },
      {
        name: "Expense Reports",
        href: "/reports/expenses",
        icon: Receipt,
        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],
      },
      {
        name: "Stock / Purchased",
        href: "/reports/inventory",
        icon: Package,
        roles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER", "ACCOUNTANT"],
      },
      {
        name: "Logistics & Costs",
        href: "/reports/logistics",
        icon: Truck,
        roles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER", "ACCOUNTANT"],
      },
      {
        name: "Loan Repayments",
        href: "/reports/loans",
        icon: CreditCard,
        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],
      },
      {
        name: "Parts & Repairs",
        href: "/reports/repairs",
        icon: Wrench,
        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "TECHNICIAN", "STOCK_CONTROLLER"],
      },
    ],
  },
];

export interface SidebarNavProps {
  onNavigate?: (() => void) | undefined;
}

function SidebarNavContent({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const currentTab = rawTab || (pathname === "/finance" ? "customer" : null);

  const { user } = useAuth();
  const currentRole = user?.role || "SALE";

  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>({
    REPORTS: true,
  });

  const activeItemRef = React.useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    // Automatically scroll active navigation item into view so REPORTS never gets cut off
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [pathname, searchParams]);

  const toggleSection = (title: string) => {
    setSectionsOpen((prev) => ({
      ...prev,
      [title]: prev[title] === false ? true : false,
    }));
  };

  const isRoleAllowed = (allowedRoles?: UserRole[], href?: string) => {
    // 1. Centralized route permission check to auto-hide restricted links
    if (href && !isRouteAllowed(href, currentRole)) return false;
    // 2. Custom component roles check
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (currentRole === "SUPER_ADMIN") return true;
    return allowedRoles.includes(currentRole);
  };

  // Filter sections by current user role (memoized to prevent re-creation on every render)
  const visibleSections = useMemo(() => {
    return csmNavSections
      .map((section) => {
        const filteredItems = section.items
          .filter((item) => isRoleAllowed(item.roles, item.href))
          .map((item) => {
            if (!item.subItems) return item;
            const filteredSubs = item.subItems.filter((sub) => isRoleAllowed(sub.roles, sub.href));
            return { ...item, subItems: filteredSubs };
          })
          .filter((item) => !item.subItems || item.subItems.length > 0);

        return {
          ...section,
          items: filteredItems,
        };
      })
      .filter((section) => section.items.length > 0);
  }, [currentRole]);

  // Auto-expand menu on load / navigation (with change guard to avoid infinite render loop)
  useEffect(() => {
    setOpenItems((prev) => {
      let hasChanges = false;
      const next = { ...prev };

      visibleSections.forEach((section) => {
        section.items.forEach((item) => {
          if (item.subItems) {
            const isChildActive = item.subItems.some((sub) => {
              const [path, query] = sub.href.split("?");
              if (pathname !== path) return false;
              if (!query) return true;
              const subParams = new URLSearchParams(query);
              return Array.from(subParams.entries()).every(
                ([key, val]) => searchParams.get(key) === val
              );
            });

            if (isChildActive && !next[item.name]) {
              next[item.name] = true;
              hasChanges = true;
            }
          }
        });
      });

      return hasChanges ? next : prev;
    });
  }, [pathname, searchParams, visibleSections]);

  const isMatchHref = (href: string) => {
    const [path, query] = href.split("?");
    if (pathname !== path) return false;
    if (!query) return !rawTab;
    const subParams = new URLSearchParams(query);
    return Array.from(subParams.entries()).every(
      ([key, val]) => searchParams.get(key) === val
    );
  };

  const toggleItem = (name: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Welcome Banner matching CSM 1.0 */}
      <div className="px-4 py-3 border-b border-[#162035] shrink-0 bg-[#0a101d]">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-white tracking-tight">
            WINWAY Showroom
          </h2>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">Car Showroom Management System v1.0</p>
      </div>

      <nav className="flex-1 px-2.5 py-2.5 pb-40 space-y-1 overflow-y-auto text-[13px] select-none text-slate-300 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-700/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
        {visibleSections.map((section, sectionIdx) => {
          const isSectionOpen = section.title ? sectionsOpen[section.title] !== false : true;

          return (
            <div key={section.title || sectionIdx} className="space-y-0.5">
              {section.title && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.title!)}
                  className="w-full flex items-center justify-between px-3 pt-3.5 pb-1.5 border-t border-[#162035] mt-2 group cursor-pointer text-left"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-sky-400 transition-colors">
                    {section.title}
                  </p>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-slate-500 transition-transform duration-200",
                      isSectionOpen ? "rotate-0" : "-rotate-90"
                    )}
                  />
                </button>
              )}

              {isSectionOpen &&
                section.items.map((item) => {
                  const Icon = item.icon;
                  const hasSub = !!item.subItems && item.subItems.length > 0;
                  const isOpen = !!openItems[item.name];

                  // Check if top-level item is active
                  const isActive = item.href ? isMatchHref(item.href) : false;

                  // Check if any sub-item is currently active
                  const hasActiveChild =
                    hasSub &&
                    item.subItems!.some((sub) => isMatchHref(sub.href));

                  if (hasSub) {
                    return (
                      <div key={item.name} className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => toggleItem(item.name)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] transition-all cursor-pointer",
                            hasActiveChild
                              ? "text-white bg-[#131d31] font-medium"
                              : "text-slate-300 hover:text-white hover:bg-slate-800/40"
                          )}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-colors",
                                hasActiveChild ? "text-sky-400" : "text-slate-400"
                              )}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0",
                              isOpen && "rotate-180"
                            )}
                          />
                        </button>

                        {/* Dropdown submenu */}
                        {isOpen && (
                          <div className="pl-3 pr-1 py-1 space-y-0.5 border-l border-slate-700/60 ml-4.5 my-0.5">
                            {item.subItems!.map((sub) => {
                              const isSubActive = isMatchHref(sub.href);

                              return (
                                <Link
                                  key={sub.name}
                                  ref={isSubActive ? activeItemRef : undefined}
                                  href={sub.href}
                                  onClick={() => onNavigate?.()}
                                  className={cn(
                                    "flex items-center px-2.5 py-1.5 rounded-lg text-[12px] transition-all truncate",
                                    isSubActive
                                      ? "bg-sky-500/15 text-sky-300 font-semibold shadow-xs"
                                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full mr-2.5 shrink-0 transition-all",
                                      isSubActive ? "bg-sky-400 ring-2 ring-sky-400/30" : "bg-slate-600"
                                    )}
                                  />
                                  <span className="truncate">{sub.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Standalone Link (like Calculator, Dashboard, Schedule, or Reports items)
                  return (
                    <Link
                      key={item.name}
                      ref={isActive ? activeItemRef : undefined}
                      href={item.href || "#"}
                      title={item.name}
                      onClick={() => onNavigate?.()}
                      className={cn(
                        "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-150",
                        isActive
                          ? "bg-gradient-to-r from-sky-500/15 via-blue-600/10 to-transparent text-sky-400 font-semibold border-l-[3px] border-sky-400 pl-[9px] shadow-[0_0_12px_rgba(56,189,248,0.08)]"
                          : "border-l-[3px] border-transparent text-slate-300 hover:text-white hover:bg-slate-800/40"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-sky-400" : "text-slate-400"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </nav>
  </div>
);
}

export function SidebarNav({ onNavigate }: SidebarNavProps = {}) {
  return (
    <React.Suspense
      fallback={
        <div className="p-3 text-slate-500 text-xs">Loading navigation...</div>
      }
    >
      <SidebarNavContent onNavigate={onNavigate} />
    </React.Suspense>
  );
}
