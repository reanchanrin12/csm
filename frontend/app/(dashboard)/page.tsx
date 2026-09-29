import React from "react";
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

export const dynamic = "force-dynamic";

async function getDashboardData() {
  try {
    const [vehiclesData, salesData, expensesData] = await Promise.all([
      vehicleService.list().catch(() => []),
      salesService.list().catch(() => []),
      expenseService.list().catch(() => ({ expenses: [], totalExpense: 0 })),
    ]);

    const sales = (salesData || []) as any[];
    const vehicles = (vehiclesData || []) as any[];
    const expenses = expensesData && "expenses" in expensesData ? expensesData.expenses : [];

    const todayStr = new Date().toISOString().split("T")[0];

    // Earned today (Sales recorded today)
    const earnedToday = sales
      .filter((s: any) => s.soldDate && s.soldDate.startsWith(todayStr))
      .reduce((sum: number, s: any) => sum + Number(s.soldPrice || 0), 0);

    // Expense today (Expenses recorded today)
    const expenseToday = expenses
      .filter((e: any) => e.expenseDate && e.expenseDate.startsWith(todayStr))
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

    // Month totals
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const monthSales = sales.filter((s: any) => s.soldDate && s.soldDate.startsWith(currentYearMonth));
    const payoffIncome = monthSales
      .filter((s: any) => s.loanType === "FULL_PAYMENT")
      .reduce((sum: number, s: any) => sum + Number(s.soldPrice || 0), 0);
    const loanIncome = monthSales
      .filter((s: any) => s.loanType !== "FULL_PAYMENT")
      .reduce((sum: number, s: any) => sum + Number(s.soldPrice || 0), 0);

    const monthExpenses = expenses
      .filter((e: any) => e.expenseDate && e.expenseDate.startsWith(currentYearMonth))
      .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

    return {
      earnedToday,
      expenseToday,
      payoffIncome,
      loanIncome,
      monthExpenses,
      inStockCount: vehicles.filter((v: any) => v.status === "IN_STOCK").length,
    };
  } catch (error) {
    return {
      earnedToday: 0,
      expenseToday: 0,
      payoffIncome: 0,
      loanIncome: 0,
      monthExpenses: 0,
      inStockCount: 0,
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  // Max value for bar chart scaling
  const maxIncome = Math.max(data.payoffIncome, data.loanIncome, 50000);
  const payoffHeight = Math.max(8, Math.min(100, (data.payoffIncome / maxIncome) * 100));
  const loanHeight = Math.max(8, Math.min(100, (data.loanIncome / maxIncome) * 100));

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

      {/* 3. Main Dashboard Grid matching reference screenshot */}
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
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#e02424]"
                    strokeDasharray={`${data.monthExpenses > 0 ? "75, 100" : "0, 100"}`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">
                    Total
                  </span>
                  <span className="text-base font-bold text-slate-800">
                    ${data.monthExpenses.toLocaleString()}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4">
                Operational & Maintenance Costs
              </p>
            </div>

            {/* Chart 2: Income for this month (Payoff vs Loan bar chart matching screenshot) */}
            <div className="flex flex-col items-center justify-center p-4 border-t md:border-t-0 md:border-l border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 mb-6 text-center">
                Income for this month
              </h3>

              {/* Bar Chart Container */}
              <div className="w-full max-w-[240px] flex flex-col">
                {/* Chart Area with Gridlines */}
                <div className="h-48 border-b border-l border-slate-300 relative flex items-end justify-around px-4 pb-0.5 bg-gradient-to-t from-slate-50/50 to-transparent">
                  {/* Subtle Gridlines */}
                  <div className="absolute inset-x-0 top-0 border-b border-slate-100 pointer-events-none" />
                  <div className="absolute inset-x-0 top-1/4 border-b border-slate-100 pointer-events-none" />
                  <div className="absolute inset-x-0 top-2/4 border-b border-slate-100 pointer-events-none" />
                  <div className="absolute inset-x-0 top-3/4 border-b border-slate-100 pointer-events-none" />

                  {/* Left Bar: Payoff (Brown/Amber color matching screenshot) */}
                  <div className="flex flex-col items-center w-14 z-10">
                    <div
                      style={{ height: `${payoffHeight}%` }}
                      className="w-full bg-[#b45309] hover:bg-[#92400e] rounded-t-xs transition-all shadow-xs flex items-center justify-center"
                    />
                  </div>

                  {/* Right Bar: Loan (Yellow/Gold color matching screenshot) */}
                  <div className="flex flex-col items-center w-14 z-10">
                    <div
                      style={{ height: `${loanHeight}%` }}
                      className="w-full bg-[#eab308] hover:bg-[#ca8a04] rounded-t-xs transition-all shadow-xs flex items-center justify-center"
                    />
                  </div>
                </div>

                {/* X-Axis Labels */}
                <div className="flex justify-around text-[11px] text-slate-600 font-medium pt-2">
                  <span className="w-14 text-center">Payoff</span>
                  <span className="w-14 text-center">Loan</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-4">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#b45309]" />
                  Payoff: ${data.payoffIncome.toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-[#eab308]" />
                  Loan: ${data.loanIncome.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: 2 Big Colorful Status Cards (Green & Red) matching reference screenshot */}
        <div className="space-y-5 flex flex-col justify-center">
          {/* 1. Green Card ($ Earned today) */}
          <div className="bg-[#10b981] hover:bg-[#059669] rounded-md p-6 text-white shadow-sm relative overflow-hidden transition-all">
            {/* Watermark Trophy Icon in bottom right */}
            <Trophy className="absolute right-4 bottom-2 h-28 w-28 text-black/10 stroke-1 pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl font-extrabold tracking-tight">
                $ {data.earnedToday.toFixed(2)}
              </h2>
              <p className="text-sm font-semibold mt-1">Earned today</p>
              <Link
                href="/sales"
                className="inline-block text-[11px] text-white/80 hover:text-white underline mt-2"
              >
                See details in your profile
              </Link>
            </div>
          </div>

          {/* 2. Red Card ($ Expense today) */}
          <div className="bg-[#ef4444] hover:bg-[#dc2626] rounded-md p-6 text-white shadow-sm relative overflow-hidden transition-all">
            {/* Watermark Dollar Icon in bottom right */}
            <DollarSign className="absolute right-4 bottom-2 h-28 w-28 text-black/10 stroke-1 pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl font-extrabold tracking-tight">
                $ {data.expenseToday.toFixed(2)}
              </h2>
              <p className="text-sm font-semibold mt-1">Expense today</p>
              <Link
                href="/finance?tab=expenses"
                className="inline-block text-[11px] text-white/80 hover:text-white underline mt-2"
              >
                See details in your profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
