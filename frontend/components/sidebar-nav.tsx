"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
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
          { name: "Loan Repayment", href: "/schedule" },
        ],
      },
    ],
  },
  {
    title: "REPORTS",
    items: [
      {
        name: "Sales Reports",
        icon: FileText,
        roles: ["SUPER_ADMIN", "ADMIN", "SALE", "ACCOUNTANT"],
        subItems: [
          { name: "Sale Details", href: "/reports?tab=sales&view=details" },
          { name: "Sale Summary", href: "/reports?tab=sales&view=summary" },
        ],
      },
      {
        name: "Expense Reports",
        icon: FileText,
        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],
        subItems: [
          { name: "Expense Details", href: "/reports?tab=expenses&view=details" },
          { name: "Expense Summary", href: "/reports?tab=expenses&view=summary" },
        ],
      },
      {
        name: "Stock / Purchased Reports",
        icon: FileText,
        roles: ["SUPER_ADMIN", "ADMIN", "STOCK_CONTROLLER", "ACCOUNTANT"],
        subItems: [
          { name: "Stock List", href: "/reports?tab=inventory&view=stock" },
          { name: "Purchased Report", href: "/reports?tab=inventory&view=purchased" },
        ],
      },
      {
        name: "Other Reports",
        icon: FileText,
        roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"],
        subItems: [
          { name: "Arrears Payment", href: "/reports?tab=loans&view=arrears" },
          { name: "History Payment", href: "/reports?tab=loans&view=history" },
          { name: "Bank Payment", href: "/reports?tab=loans&view=bank" },
          { name: "Shipping", href: "/reports?tab=logistics&category=TRANSPORT" },
          { name: "Tax & Clearance", href: "/reports?tab=logistics&category=TAX" },
          { name: "Repair", href: "/reports?tab=logistics&category=REPAIR" },
          { name: "Other expenses", href: "/reports?tab=expenses" },
        ],
      },
    ],
  },
];

function SidebarNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const currentTab = rawTab || (pathname === "/finance" ? "customer" : null);

  const { user } = useAuth();
  const currentRole = user?.role || "SALE";

  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const isRoleAllowed = (allowedRoles?: UserRole[]) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (currentRole === "SUPER_ADMIN") return true;
    return allowedRoles.includes(currentRole);
  };

  // Filter sections by current user role (memoized to prevent re-creation on every render)
  const visibleSections = useMemo(() => {
    return csmNavSections
      .map((section) => {
        const filteredItems = section.items
          .filter((item) => isRoleAllowed(item.roles))
          .map((item) => {
            if (!item.subItems) return item;
            const filteredSubs = item.subItems.filter((sub) => isRoleAllowed(sub.roles));
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
    <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto text-[13px] select-none text-slate-300">
      {visibleSections.map((section, sectionIdx) => (
        <div key={section.title || sectionIdx} className="space-y-0.5">
          {section.title && (
            <div className="px-3 pt-4 pb-1.5 border-t border-[#1a233a] mt-2">
              <p className="text-[12px] font-bold uppercase tracking-wider text-slate-100">
                {section.title}
              </p>
            </div>
          )}

          {section.items.map((item) => {
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
                      "w-full flex items-center justify-between px-3 py-2 rounded text-[13px] transition-colors cursor-pointer",
                      hasActiveChild
                        ? "text-white bg-[#141e33] font-medium"
                        : "text-slate-300 hover:text-white hover:bg-[#121a2d]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          hasActiveChild ? "text-[#38bdf8]" : "text-slate-400"
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
                    <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-[#1a233a] ml-4">
                      {item.subItems!.map((sub) => {
                        const isSubActive = isMatchHref(sub.href);

                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className={cn(
                              "block px-2.5 py-1.5 rounded-[2px] text-[12px] transition-colors truncate",
                              isSubActive
                                ? "border border-[#55647e] text-white bg-[#060b17] font-medium"
                                : "border border-transparent text-slate-400 hover:text-white hover:bg-[#11192b]"
                            )}
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Standalone Link (like Calculator, Dashboard, Schedule)
            return (
              <Link
                key={item.name}
                href={item.href || "#"}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded text-[13px] transition-all",
                  isActive
                    ? "border border-[#38bdf8] text-white font-medium bg-[#142036] shadow-sm"
                    : "border border-transparent text-slate-300 hover:text-white hover:bg-[#121a2d]"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-[#38bdf8]" : "text-slate-400"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function SidebarNav() {
  return (
    <React.Suspense
      fallback={
        <div className="p-3 text-slate-500 text-xs">Loading navigation...</div>
      }
    >
      <SidebarNavContent />
    </React.Suspense>
  );
}
