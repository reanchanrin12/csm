"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TableProperties,
  Trophy,
  DollarSign,
  TrendingUp,
  Receipt,
  Car,
} from "lucide-react";
import { vehicleService, salesService, expenseService } from "@/lib/api";
import { getTodayDateString, getCurrentYearMonthString } from "@/lib/date-utils";

interface DashboardData {
  earnedToday: number;
  expenseToday: number;
  payoffIncome: number;
  loanIncome: number;
  monthExpenses: number;
  inStockCount: number;
  recentVehicles: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    earnedToday: 0,
    expenseToday: 0,
    payoffIncome: 0,
    loanIncome: 0,
    monthExpenses: 0,
    inStockCount: 0,
    recentVehicles: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [vehiclesData, salesData, expensesData] = await Promise.all([
          vehicleService.list().catch(() => []),
          salesService.list().catch(() => []),
          expenseService.list().catch(() => ({ expenses: [], totalExpense: 0 })),
        ]);

        const sales = (salesData || []) as any[];
        const vehicles = (vehiclesData || []) as any[];
        const expenses =
          expensesData && "expenses" in expensesData ? expensesData.expenses : [];

        const todayStr = getTodayDateString();

        // Earned today (Sales recorded today)
        const earnedToday = sales
          .filter((s: any) => s.soldDate && s.soldDate.startsWith(todayStr))
          .reduce((sum: number, s: any) => sum + Number(s.soldPrice || 0), 0);

        // Expense today (Expenses recorded today)
        const expenseToday = expenses
          .filter((e: any) => e.expenseDate && e.expenseDate.startsWith(todayStr))
          .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

        // Month totals
        const currentYearMonth = getCurrentYearMonthString();
        const monthSales = sales.filter(
          (s: any) => s.soldDate && s.soldDate.startsWith(currentYearMonth)
        );
        const payoffIncome = monthSales
          .filter((s: any) => s.loanType === "FULL_PAYMENT")
          .reduce((sum: number, s: any) => sum + Number(s.soldPrice || 0), 0);
        const loanIncome = monthSales
          .filter((s: any) => s.loanType !== "FULL_PAYMENT")
          .reduce((sum: number, s: any) => sum + Number(s.soldPrice || 0), 0);

        const monthExpenses = expenses
          .filter(
            (e: any) => e.expenseDate && e.expenseDate.startsWith(currentYearMonth)
          )
          .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

        const inStockVehicles = vehicles.filter(
          (v: any) => v.status === "IN_STOCK"
        );

        setData({
          earnedToday,
          expenseToday,
          payoffIncome,
          loanIncome,
          monthExpenses,
          inStockCount: inStockVehicles.length,
          recentVehicles: inStockVehicles.slice(0, 5),
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Max value for bar chart scaling
  const maxIncome = Math.max(data.payoffIncome, data.loanIncome, 50000);
  const payoffHeight = Math.max(
    8,
    Math.min(100, (data.payoffIncome / maxIncome) * 100)
  );
  const loanHeight = Math.max(
    8,
    Math.min(100, (data.loanIncome / maxIncome) * 100)
  );

  return (
    <div className="space-y-4 max-w-7xl">
      {/* 1. Breadcrumb matching CSM 1.0 */}
      <div className="flex items-center gap-2 px-3.5 py-2 bg-[#e9ecef] border border-slate-200/70 text-xs rounded text-slate-600">
        <div className="bg-[#0284c7] text-white p-1 rounded-xs">
          <TableProperties className="h-3.5 w-3.5" />
        </div>
        <Link href="/" className="text-[#1c64f2] hover:underline font-medium">
          Dashboard
        </Link>
        <span className="text-slate-400">&gt;</span>
        <span className="text-slate-600">Dashboard</span>
      </div>

      {/* 2. Page Title & Subtitle */}
      <div>
        <h1 className="text-[22px] font-bold text-slate-800 tracking-tight leading-tight">
          Dashboard Info
        </h1>
        <p className="text-[11px] text-slate-500 mt-0.5">view current data</p>
      </div>

      {/* 3. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left Side: 2 Charts Container (Expense for this month & Income for this month) */}
        <div className="lg:col-span-2 bg-white rounded border border-slate-200 p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full min-h-[300px]">
            {/* Chart 1: Expense for this month */}
            <div className="flex flex-col items-center justify-center p-4">
              <h3 className="text-xs font-semibold text-slate-700 mb-6 text-center">
                Expense for this month
              </h3>
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* Modern circular donut chart representation */}
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 36 36"
                >
                  <path
                    className="text-slate-100"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#ef4444]"
                    strokeDasharray={`${Math.min(
                      100,
                      (data.monthExpenses / 10000) * 100
                    )}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                {/* Center text in donut chart */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    TOTAL
                  </span>
                  <div className="flex items-center text-slate-800 font-bold text-lg mt-0.5">
                    <span className="text-sm mr-0.5">$</span>
                    {data.monthExpenses.toLocaleString()}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-6 text-center">
                Operational & Maintenance Costs
              </p>
            </div>

            {/* Chart 2: Income for this month (Bar Chart Payoff vs Loan) */}
            <div className="flex flex-col items-center justify-between p-4 h-full border-t md:border-t-0 md:border-l border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 mb-6 text-center">
                Income for this month
              </h3>

              {/* Bar visualization */}
              <div className="w-full max-w-[200px] h-48 flex items-end justify-center gap-8 pb-4 border-b border-slate-100">
                {/* Payoff Bar */}
                <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end group">
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${data.payoffIncome.toLocaleString()}
                  </span>
                  <div
                    className="w-10 bg-[#b45309] rounded-t-xs transition-all duration-500 shadow-xs"
                    style={{ height: `${payoffHeight}%` }}
                  />
                  <span className="text-[10px] text-slate-500 font-medium">
                    Payoff
                  </span>
                </div>

                {/* Loan Bar */}
                <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end group">
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${data.loanIncome.toLocaleString()}
                  </span>
                  <div
                    className="w-10 bg-[#eab308] rounded-t-xs transition-all duration-500 shadow-xs"
                    style={{ height: `${loanHeight}%` }}
                  />
                  <span className="text-[10px] text-slate-500 font-medium">
                    Loan
                  </span>
                </div>
              </div>

              {/* Legend & Details matching reference */}
              <div className="mt-4 flex flex-col items-center gap-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-[#b45309] rounded-xs" />
                    <span>Payoff: ${data.payoffIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-[#eab308] rounded-xs" />
                    <span>Loan: ${data.loanIncome.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: 2 Stat Action Cards */}
        <div className="flex flex-col gap-6">
          {/* Card 1: Green Stat Card (Earned today) */}
          <div className="bg-[#10b981] rounded text-white p-5 relative overflow-hidden flex flex-col justify-between shadow-xs min-h-[140px]">
            <div className="relative z-10">
              <div className="flex items-center text-3xl font-extrabold tracking-tight">
                <span className="text-xl font-normal mr-1">$</span>
                {data.earnedToday.toLocaleString("en-US")}
              </div>
              <p className="text-xs font-semibold text-emerald-100 mt-1">
                Earned today
              </p>
            </div>

            <div className="relative z-10 pt-4 border-t border-emerald-400/40">
              <Link
                href="/reports/sales"
                className="text-xs text-white hover:underline flex items-center gap-1"
              >
                View sales report &rarr;
              </Link>
            </div>

            {/* Trophy outline background icon */}
            <Trophy className="absolute -right-3 -bottom-3 w-28 h-28 text-white/15 pointer-events-none" />
          </div>

          {/* Card 2: Red Stat Card (Expense today) */}
          <div className="bg-[#ef4444] rounded text-white p-5 relative overflow-hidden flex flex-col justify-between shadow-xs min-h-[140px]">
            <div className="relative z-10">
              <div className="flex items-center text-3xl font-extrabold tracking-tight">
                <span className="text-xl font-normal mr-1">$</span>
                {data.expenseToday.toLocaleString("en-US")}
              </div>
              <p className="text-xs font-semibold text-red-100 mt-1">
                Expense today
              </p>
            </div>

            <div className="relative z-10 pt-4 border-t border-red-400/40">
              <Link
                href="/reports/expenses"
                className="text-xs text-white hover:underline flex items-center gap-1"
              >
                View expense report &rarr;
              </Link>
            </div>

            {/* Dollar outline background icon */}
            <DollarSign className="absolute -right-3 -bottom-3 w-28 h-28 text-white/15 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4. In-Stock Vehicles Quick Overview Table */}
      <div className="bg-white rounded border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              In-Stock Vehicles Overview
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Current inventory available for sale ({data.inStockCount} units in stock)
            </p>
          </div>
          <Link
            href="/inventory"
            className="text-xs text-[#0284c7] hover:underline font-medium"
          >
            View all inventory &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs border-collapse min-w-[700px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 text-slate-700 font-bold bg-slate-50/50">
                <th className="py-2.5 px-3">#No</th>
                <th className="py-2.5 px-3">Brand & Model</th>
                <th className="py-2.5 px-3">VIN</th>
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3">Color</th>
                <th className="py-2.5 px-3">Branch</th>
                <th className="py-2.5 px-3">Cost / Price</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    កំពុងផ្ទុកទិន្នន័យ (Loading inventory)...
                  </td>
                </tr>
              ) : data.recentVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    No vehicles currently in stock
                  </td>
                </tr>
              ) : (
                data.recentVehicles.map((car: any, idx: number) => {
                  const brandName =
                    car.model?.brand?.name || car.brand?.name || car.brand || "";
                  const modelName = car.model?.name || car.model || "";
                  const displayName = `${brandName} ${modelName}`.trim() || "Vehicle";
                  const year = car.madeYear || car.year || "—";
                  const color = car.exteriorColor || car.color || "—";
                  const branchName =
                    car.currentBranch?.name || car.branch?.name || "PHNOM PENH";
                  const price =
                    Number(car.inSalePrice || car.purchaseCost || car.price || 0);

                  return (
                    <tr
                      key={car.id || idx}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {displayName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {car.vin || "—"}
                      </td>
                      <td className="py-2.5 px-3">{year}</td>
                      <td className="py-2.5 px-3">{color}</td>
                      <td className="py-2.5 px-3">{branchName}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        ${price.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {car.status || "IN_STOCK"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
