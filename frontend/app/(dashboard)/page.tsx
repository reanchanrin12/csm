"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TableProperties,
  Trophy,
  DollarSign,
  TrendingUp,
  Car,
  ShoppingBag,
  Layers,
  ArrowUpRight,
  PieChart,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Building2,
} from "lucide-react";
import { vehicleService, salesService, expenseService } from "@/lib/api";
import { getTodayDateString, getCurrentYearMonthString } from "@/lib/date-utils";

interface BrandAnalysisItem {
  brand: string;
  inStockCount: number;
  inStockValue: number;
  soldCount: number;
  soldValue: number;
  totalUnits: number;
  sellThroughRate: number;
}

interface DashboardData {
  earnedToday: number;
  expenseToday: number;
  payoffIncome: number;
  loanIncome: number;
  monthExpenses: number;
  monthSalesCount: number;
  monthSalesTotal: number;
  inStockCount: number;
  inStockTotalValue: number;
  brandAnalysis: BrandAnalysisItem[];
  recentVehicles: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    earnedToday: 0,
    expenseToday: 0,
    payoffIncome: 0,
    loanIncome: 0,
    monthExpenses: 0,
    monthSalesCount: 0,
    monthSalesTotal: 0,
    inStockCount: 0,
    inStockTotalValue: 0,
    brandAnalysis: [],
    recentVehicles: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"brands" | "inventory">("brands");
  const [chartMetric, setChartMetric] = useState<"units" | "value">("units");

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

        // 1. Earned today (Sales recorded today)
        const earnedToday = sales
          .filter((s: any) => s.soldDate && s.soldDate.startsWith(todayStr))
          .reduce((sum: number, s: any) => sum + Number(s.soldPrice || 0), 0);

        // 2. Expense today (Expenses recorded today)
        const expenseToday = expenses
          .filter((e: any) => e.expenseDate && e.expenseDate.startsWith(todayStr))
          .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

        // 3. Month sales totals
        const currentYearMonth = getCurrentYearMonthString();
        const monthSales = sales.filter(
          (s: any) => s.soldDate && s.soldDate.startsWith(currentYearMonth)
        );

        const monthSalesCount = monthSales.length;
        const monthSalesTotal = monthSales.reduce(
          (sum: number, s: any) => sum + Number(s.soldPrice || 0),
          0
        );

        const payoffIncome = monthSales
          .filter((s: any) => s.loanType === "FULL_PAYMENT")
          .reduce((sum: number, s: any) => sum + Number(s.soldPrice || 0), 0);
        const loanIncome = monthSales
          .filter((s: any) => s.loanType !== "FULL_PAYMENT")
          .reduce((sum: number, s: any) => sum + Number(s.soldPrice || 0), 0);

        // 4. Monthly expenses
        const monthExpenses = expenses
          .filter(
            (e: any) => e.expenseDate && e.expenseDate.startsWith(currentYearMonth)
          )
          .reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

        // 5. In-Stock vehicles
        const inStockVehicles = vehicles.filter(
          (v: any) => v.status === "IN_STOCK"
        );
        const inStockCount = inStockVehicles.length;
        const inStockTotalValue = inStockVehicles.reduce(
          (sum: number, v: any) =>
            sum + Number(v.inSalePrice || v.purchaseCost || v.price || 0),
          0
        );

        // 6. Aggregate Brand Analysis (Sales vs Stock)
        const brandMap = new Map<
          string,
          {
            inStockCount: number;
            inStockValue: number;
            soldCount: number;
            soldValue: number;
          }
        >();

        for (const v of inStockVehicles) {
          const rawBrand =
            v.model?.brand?.name || v.brand?.name || v.brand || "OTHER";
          const brandName = String(rawBrand).trim().toUpperCase();
          const val = Number(v.inSalePrice || v.purchaseCost || v.price || 0);
          const current = brandMap.get(brandName) || {
            inStockCount: 0,
            inStockValue: 0,
            soldCount: 0,
            soldValue: 0,
          };
          current.inStockCount += 1;
          current.inStockValue += val;
          brandMap.set(brandName, current);
        }

        for (const s of monthSales) {
          const rawBrand =
            s.vehicle?.brand?.name ||
            s.vehicle?.brand ||
            s.brand ||
            s.vehicle?.model?.brand?.name ||
            "OTHER";
          const brandName = String(rawBrand).trim().toUpperCase();
          const val = Number(s.soldPrice || 0);
          const current = brandMap.get(brandName) || {
            inStockCount: 0,
            inStockValue: 0,
            soldCount: 0,
            soldValue: 0,
          };
          current.soldCount += 1;
          current.soldValue += val;
          brandMap.set(brandName, current);
        }

        const brandAnalysis: BrandAnalysisItem[] = Array.from(
          brandMap.entries()
        )
          .map(([brand, item]) => {
            const totalUnits = item.inStockCount + item.soldCount;
            const sellThroughRate =
              totalUnits > 0
                ? Math.round((item.soldCount / totalUnits) * 100)
                : 0;
            return {
              brand,
              ...item,
              totalUnits,
              sellThroughRate,
            };
          })
          .sort(
            (a, b) =>
              b.soldCount + b.inStockCount - (a.soldCount + a.inStockCount)
          );

        setData({
          earnedToday,
          expenseToday,
          payoffIncome,
          loanIncome,
          monthExpenses,
          monthSalesCount,
          monthSalesTotal,
          inStockCount,
          inStockTotalValue,
          brandAnalysis,
          recentVehicles: inStockVehicles.slice(0, 8),
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Total Handled Vehicles (Sold this month + In-Stock)
  const totalHandledUnits = data.monthSalesCount + data.inStockCount;
  const sellThroughRate =
    totalHandledUnits > 0
      ? Math.round((data.monthSalesCount / totalHandledUnits) * 100)
      : 0;
  const stockRatio = totalHandledUnits > 0 ? 100 - sellThroughRate : 0;

  // Donut circumference for stroke-dasharray (Radius = 15.9155 -> Circ = 100)
  const soldStroke = sellThroughRate;
  const stockStroke = stockRatio;

  // Bar chart scale calculation
  const maxUnits = Math.max(data.monthSalesCount, data.inStockCount, 1);
  const soldUnitsHeight = Math.max(
    10,
    Math.round((data.monthSalesCount / maxUnits) * 100)
  );
  const stockUnitsHeight = Math.max(
    10,
    Math.round((data.inStockCount / maxUnits) * 100)
  );

  const maxValue = Math.max(
    data.monthSalesTotal,
    data.inStockTotalValue,
    10000
  );
  const soldValueHeight = Math.max(
    10,
    Math.round((data.monthSalesTotal / maxValue) * 100)
  );
  const stockValueHeight = Math.max(
    10,
    Math.round((data.inStockTotalValue / maxValue) * 100)
  );

  // Income scaling for secondary breakdown
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
    <div className="space-y-5 max-w-7xl pb-10">
      {/* 1. Breadcrumb matching CSM 1.0 */}
      <div className="flex items-center gap-2 px-3.5 py-2 bg-[#e9ecef] border border-slate-200/70 text-xs rounded text-slate-600">
        <div className="bg-[#0284c7] text-white p-1 rounded-xs">
          <TableProperties className="h-3.5 w-3.5" />
        </div>
        <Link href="/" className="text-[#1c64f2] hover:underline font-medium">
          Dashboard
        </Link>
        <span className="text-slate-400">&gt;</span>
        <span className="text-slate-600">Dashboard Info</span>
      </div>

      {/* 2. Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-[22px] font-bold text-slate-800 tracking-tight leading-tight">
            Dashboard Info
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            ទិដ្ឋភាពទូទៅនៃការលក់ ស្តុករថយន្ត និងចំណូលចំណាយ (Current sales, inventory & finance overview)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live System
          </span>
        </div>
      </div>

      {/* 3. Top KPI Summary 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cars Sold This Month */}
        <div className="bg-gradient-to-br from-[#1c64f2] to-[#1e40af] rounded-lg text-white p-4 relative overflow-hidden flex flex-col justify-between shadow-xs min-h-[140px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between text-blue-100">
              <span className="text-[11px] font-medium uppercase tracking-wider">
                ការលក់ខែនេះ (This Month)
              </span>
              <ShoppingBag className="w-4 h-4 opacity-80" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">
                {data.monthSalesCount}
              </span>
              <span className="text-sm font-medium text-blue-200">គ្រឿង (Units)</span>
            </div>
            <p className="text-xs font-semibold text-blue-100 mt-1">
              ${data.monthSalesTotal.toLocaleString()}
            </p>
          </div>

          <div className="relative z-10 pt-3 mt-2 border-t border-blue-400/30 flex items-center justify-between">
            <Link
              href="/reports/sales"
              className="text-[11px] text-white hover:underline flex items-center gap-1"
            >
              របាយការណ៍លក់ &rarr;
            </Link>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
              លក់ចេញ {sellThroughRate}%
            </span>
          </div>
          <TrendingUp className="absolute -right-3 -bottom-3 w-24 h-24 text-white/10 pointer-events-none" />
        </div>

        {/* Card 2: Cars In Stock */}
        <div className="bg-gradient-to-br from-[#0284c7] to-[#0369a1] rounded-lg text-white p-4 relative overflow-hidden flex flex-col justify-between shadow-xs min-h-[140px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between text-sky-100">
              <span className="text-[11px] font-medium uppercase tracking-wider">
                សល់ក្នុងស្តុក (In-Stock)
              </span>
              <Car className="w-4 h-4 opacity-80" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">
                {data.inStockCount}
              </span>
              <span className="text-sm font-medium text-sky-200">គ្រឿង (Units)</span>
            </div>
            <p className="text-xs font-semibold text-sky-100 mt-1">
              ${data.inStockTotalValue.toLocaleString()}
            </p>
          </div>

          <div className="relative z-10 pt-3 mt-2 border-t border-sky-400/30 flex items-center justify-between">
            <Link
              href="/inventory"
              className="text-[11px] text-white hover:underline flex items-center gap-1"
            >
              មើលបញ្ជីស្តុក &rarr;
            </Link>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">
              ស្តុក {stockRatio}%
            </span>
          </div>
          <Car className="absolute -right-3 -bottom-3 w-24 h-24 text-white/10 pointer-events-none" />
        </div>

        {/* Card 3: Earned Today */}
        <div className="bg-[#10b981] rounded-lg text-white p-4 relative overflow-hidden flex flex-col justify-between shadow-xs min-h-[140px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between text-emerald-100">
              <span className="text-[11px] font-medium uppercase tracking-wider">
                ចំណូលថ្ងៃនេះ (Earned Today)
              </span>
              <Trophy className="w-4 h-4 opacity-80" />
            </div>
            <div className="mt-2 flex items-center text-3xl font-extrabold tracking-tight">
              <span className="text-xl font-normal mr-1">$</span>
              {data.earnedToday.toLocaleString("en-US")}
            </div>
            <p className="text-xs font-medium text-emerald-100 mt-1">
              Sales recorded today
            </p>
          </div>

          <div className="relative z-10 pt-3 mt-2 border-t border-emerald-400/40">
            <Link
              href="/reports/sales"
              className="text-[11px] text-white hover:underline flex items-center gap-1"
            >
              View sales report &rarr;
            </Link>
          </div>
          <Trophy className="absolute -right-3 -bottom-3 w-24 h-24 text-white/15 pointer-events-none" />
        </div>

        {/* Card 4: Expense Today */}
        <div className="bg-[#ef4444] rounded-lg text-white p-4 relative overflow-hidden flex flex-col justify-between shadow-xs min-h-[140px]">
          <div className="relative z-10">
            <div className="flex items-center justify-between text-red-100">
              <span className="text-[11px] font-medium uppercase tracking-wider">
                ចំណាយថ្ងៃនេះ (Expense Today)
              </span>
              <DollarSign className="w-4 h-4 opacity-80" />
            </div>
            <div className="mt-2 flex items-center text-3xl font-extrabold tracking-tight">
              <span className="text-xl font-normal mr-1">$</span>
              {data.expenseToday.toLocaleString("en-US")}
            </div>
            <p className="text-xs font-medium text-red-100 mt-1">
              Operating costs today
            </p>
          </div>

          <div className="relative z-10 pt-3 mt-2 border-t border-red-400/40">
            <Link
              href="/reports/expenses"
              className="text-[11px] text-white hover:underline flex items-center gap-1"
            >
              View expense report &rarr;
            </Link>
          </div>
          <DollarSign className="absolute -right-3 -bottom-3 w-24 h-24 text-white/15 pointer-events-none" />
        </div>
      </div>

      {/* 4. Sales This Month vs In-Stock Inventory Analytical Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Monthly Sales vs Stock Comparison Bar Graph */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#1c64f2]" />
                <h2 className="text-sm font-bold text-slate-800">
                  ក្រាបវិភាគការលក់ និងស្តុករថយន្ត (Sales vs In-Stock Graph)
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ប្រៀបធៀបចំនួនរថយន្តបានលក់ក្នុងខែនេះ ធៀបនឹងរថយន្តដែលនៅសល់ក្នុងស្តុក
              </p>
            </div>

            {/* Metric Switcher: Units vs Total $ */}
            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
              <button
                type="button"
                onClick={() => setChartMetric("units")}
                className={`px-2.5 py-1 rounded transition-all ${
                  chartMetric === "units"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                ចំនួនគ្រឿង (Units)
              </button>
              <button
                type="button"
                onClick={() => setChartMetric("value")}
                className={`px-2.5 py-1 rounded transition-all ${
                  chartMetric === "value"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                តម្លៃទឹកប្រាក់ (Value $)
              </button>
            </div>
          </div>

          {/* Chart Canvas Area */}
          <div className="py-6 px-2">
            {chartMetric === "units" ? (
              // Units Comparison
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-8 items-end h-48 max-w-md mx-auto w-full pt-4">
                  {/* Sold Bar */}
                  <div className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-xs font-bold text-[#1c64f2] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {data.monthSalesCount} គ្រឿង
                    </span>
                    <div
                      className="w-16 bg-gradient-to-t from-[#1c64f2] to-[#3b82f6] rounded-t-md transition-all duration-700 shadow-sm"
                      style={{ height: `${soldUnitsHeight}%` }}
                    />
                    <div className="text-center">
                      <span className="text-xs font-semibold text-slate-700 block">
                        លក់បានខែនេះ
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Cars Sold
                      </span>
                    </div>
                  </div>

                  {/* In-Stock Bar */}
                  <div className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-xs font-bold text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                      {data.inStockCount} គ្រឿង
                    </span>
                    <div
                      className="w-16 bg-gradient-to-t from-[#0284c7] to-[#38bdf8] rounded-t-md transition-all duration-700 shadow-sm"
                      style={{ height: `${stockUnitsHeight}%` }}
                    />
                    <div className="text-center">
                      <span className="text-xs font-semibold text-slate-700 block">
                        នៅសល់ក្នុងស្តុក
                      </span>
                      <span className="text-[10px] text-slate-400">
                        In-Stock Cars
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress ratio comparison */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-center text-xs mb-1.5 font-medium text-slate-700">
                    <span>សមាមាត្រក្នុងចំណោមរថយន្តសរុប {totalHandledUnits} គ្រឿង</span>
                    <span className="text-slate-500">
                      លក់ {sellThroughRate}% / ស្តុក {stockRatio}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-[#1c64f2] h-full transition-all duration-500"
                      style={{ width: `${sellThroughRate}%` }}
                      title={`Sold: ${data.monthSalesCount} units (${sellThroughRate}%)`}
                    />
                    <div
                      className="bg-[#0284c7] h-full transition-all duration-500"
                      style={{ width: `${stockRatio}%` }}
                      title={`In Stock: ${data.inStockCount} units (${stockRatio}%)`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Value $ Comparison
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-8 items-end h-48 max-w-md mx-auto w-full pt-4">
                  {/* Sold Value Bar */}
                  <div className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ${data.monthSalesTotal.toLocaleString()}
                    </span>
                    <div
                      className="w-16 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-700 shadow-sm"
                      style={{ height: `${soldValueHeight}%` }}
                    />
                    <div className="text-center">
                      <span className="text-xs font-semibold text-slate-700 block">
                        ចំណូលលក់ខែនេះ
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Sales Revenue
                      </span>
                    </div>
                  </div>

                  {/* Stock Value Bar */}
                  <div className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      ${data.inStockTotalValue.toLocaleString()}
                    </span>
                    <div
                      className="w-16 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-md transition-all duration-700 shadow-sm"
                      style={{ height: `${stockValueHeight}%` }}
                    />
                    <div className="text-center">
                      <span className="text-xs font-semibold text-slate-700 block">
                        តម្លៃទ្រព្យស្តុកសរុប
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Stock Asset Value
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 flex items-center justify-around text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">
                      ចំណូលលក់:{" "}
                      <strong className="text-slate-800">
                        ${data.monthSalesTotal.toLocaleString()}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-slate-600">
                      តម្លៃស្តុក:{" "}
                      <strong className="text-slate-800">
                        ${data.inStockTotalValue.toLocaleString()}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              ទិន្នន័យសម្រាប់ខែ: <strong>{getCurrentYearMonthString()}</strong>
            </span>
            <Link
              href="/reports/sales"
              className="text-[#1c64f2] hover:underline font-medium inline-flex items-center gap-1"
            >
              ពិនិត្យមើលលម្អិតបន្ថែម &rarr;
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Donut Ratio Chart (Sell-Through vs Stock Ratio) */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800">
                អត្រាលក់ចេញ (Sell-Through Rate)
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ភាគរយរថយន្តបានលក់ ធៀបនឹងស្តុកសរុប
            </p>
          </div>

          {/* Donut Chart Visual */}
          <div className="py-4 flex flex-col items-center justify-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 36 36"
              >
                {/* Background Track */}
                <path
                  className="text-slate-100"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* In Stock Segment (Sky Blue) */}
                <path
                  className="text-[#0284c7]"
                  strokeDasharray={`${stockStroke}, 100`}
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Sold Segment (Deep Blue) */}
                <path
                  className="text-[#1c64f2]"
                  strokeDasharray={`${soldStroke}, 100`}
                  strokeDashoffset={`-${stockStroke}`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              {/* Center Metrics in Donut */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  SOLD RATE
                </span>
                <span className="text-2xl font-bold text-slate-800">
                  {sellThroughRate}%
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {data.monthSalesCount} / {totalHandledUnits} គ្រឿង
                </span>
              </div>
            </div>

            {/* Legend Box */}
            <div className="w-full mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-blue-50/60 border border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1c64f2]" />
                  <span className="text-slate-700 font-medium">
                    លក់ចេញខែនេះ (Sold):
                  </span>
                </div>
                <span className="font-bold text-[#1c64f2]">
                  {data.monthSalesCount} គ្រឿង ({sellThroughRate}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-sky-50/60 border border-sky-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                  <span className="text-slate-700 font-medium">
                    សល់ក្នុងស្តុក (In-Stock):
                  </span>
                </div>
                <span className="font-bold text-[#0284c7]">
                  {data.inStockCount} គ្រឿង ({stockRatio}%)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            សរុបរថយន្តគ្រប់គ្រងខែនេះ៖ <strong>{totalHandledUnits}</strong> គ្រឿង
          </div>
        </div>
      </div>

      {/* 5. Secondary Row: Monthly Operational Expense & Loan/Payoff Overview */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              ចំណាយប្រតិបត្តិការ និងការបង់ប្រាក់ប្រចាំខែ (Operational Expense & Monthly Cashflow)
            </h2>
            <p className="text-[11px] text-slate-400">
              សង្ខេបការចំណាយ និងទម្រង់ចំណូលបង់ផ្តាច់ / រំលស់
            </p>
          </div>
          <Link
            href="/reports/expenses"
            className="text-xs text-[#0284c7] hover:underline font-medium"
          >
            មើលរបាយការណ៍ចំណាយ &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Expense Donut */}
          <div className="flex items-center justify-center gap-6 p-2">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
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
                    (data.monthExpenses / Math.max(10000, data.monthExpenses)) *
                      100
                  )}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[9px] text-slate-400 font-semibold uppercase">
                  EXPENSE
                </span>
                <div className="text-slate-800 font-bold text-sm">
                  ${data.monthExpenses.toLocaleString()}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-800">
                ចំណាយប្រតិបត្តិការសរុប (Monthly Expenses)
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                ការចំណាយលើការថែទាំ ជួសជុល និងថ្លៃដើមប្រតិបត្តិការប្រចាំខែនេះ។
              </p>
              <span className="inline-block mt-2 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                ${data.monthExpenses.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Income Payoff vs Loan */}
          <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <h3 className="text-xs font-semibold text-slate-700 mb-3 text-center">
              ទម្រង់បង់ប្រាក់៖ បង់ផ្តាច់ (Payoff) vs រំលស់ (Loan)
            </h3>
            <div className="w-full max-w-[240px] h-28 flex items-end justify-center gap-10 pb-2 border-b border-slate-100">
              {/* Payoff Bar */}
              <div className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                <span className="text-[10px] text-slate-500 font-mono">
                  ${data.payoffIncome.toLocaleString()}
                </span>
                <div
                  className="w-10 bg-[#b45309] rounded-t-xs transition-all duration-500"
                  style={{ height: `${payoffHeight}%` }}
                />
                <span className="text-[10px] text-slate-600 font-medium">
                  Payoff
                </span>
              </div>

              {/* Loan Bar */}
              <div className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                <span className="text-[10px] text-slate-500 font-mono">
                  ${data.loanIncome.toLocaleString()}
                </span>
                <div
                  className="w-10 bg-[#eab308] rounded-t-xs transition-all duration-500"
                  style={{ height: `${loanHeight}%` }}
                />
                <span className="text-[10px] text-slate-600 font-medium">
                  Loan
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-600 mt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#b45309] rounded-xs" />
                Payoff: ${data.payoffIncome.toLocaleString()}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#eab308] rounded-xs" />
                Loan: ${data.loanIncome.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Analytical Summary Table: Brand Breakdown & In-Stock Vehicles */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header with Tabs */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              តារាងវិភាគទិន្នន័យ (Data Analysis & Inventory Overview)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {activeTab === "brands"
                ? "វិភាគការលក់ និងចំនួនរថយន្តសល់ក្នុងស្តុកតាមម៉ាកនីមួយៗ"
                : "បញ្ជីរថយន្តជាក់ស្តែងដែលកំពុងមានក្នុងស្តុក"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-slate-200/70 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("brands")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === "brands"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📊 វិភាគតាមម៉ាក (By Brand)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("inventory")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === "inventory"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🚗 រថយន្តក្នុងស្តុក ({data.inStockCount})
              </button>
            </div>

            <Link
              href={activeTab === "brands" ? "/reports/sales" : "/inventory"}
              className="text-xs text-[#0284c7] hover:underline font-medium ml-2 hidden sm:inline-block"
            >
              មើលលម្អិត &rarr;
            </Link>
          </div>
        </div>

        {/* Tab 1 Content: Brand Analysis Table */}
        {activeTab === "brands" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[750px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700 font-bold bg-slate-50">
                  <th className="py-3 px-3.5">#No</th>
                  <th className="py-3 px-3.5">ម៉ាករថយន្ត (Brand)</th>
                  <th className="py-3 px-3.5 text-center">សល់ក្នុងស្តុក (Stock)</th>
                  <th className="py-3 px-3.5 text-center">លក់បានខែនេះ (Sold)</th>
                  <th className="py-3 px-3.5 text-right">តម្លៃស្តុកសរុប (Stock Value)</th>
                  <th className="py-3 px-3.5 text-right">ចំណូលលក់ (Revenue)</th>
                  <th className="py-3 px-3.5 text-center">អត្រាលក់ចេញ (Sell-Through)</th>
                  <th className="py-3 px-3.5 text-right">ស្ថានភាពស្តុក (Status)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      កំពុងផ្ទុកទិន្នន័យវិភាគ (Loading analytics)...
                    </td>
                  </tr>
                ) : data.brandAnalysis.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      មិនទាន់មានទិន្នន័យរថយន្ត ឬការលក់ក្នុងខែនេះនៅឡើយទេ (No brand data available)
                    </td>
                  </tr>
                ) : (
                  data.brandAnalysis.map((item, idx) => {
                    const isHighSales = item.soldCount > 0;
                    const isOutOfStock = item.inStockCount === 0;

                    return (
                      <tr
                        key={item.brand}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3 px-3.5 font-medium text-slate-800">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          {item.brand}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-xs ${
                              item.inStockCount > 0
                                ? "bg-sky-50 text-sky-800 border border-sky-200"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {item.inStockCount} គ្រឿង
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-xs ${
                              item.soldCount > 0
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {item.soldCount} គ្រឿង
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-medium text-slate-800">
                          ${item.inStockValue.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-semibold text-emerald-700">
                          ${item.soldValue.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="bg-[#1c64f2] h-full"
                                style={{ width: `${item.sellThroughRate}%` }}
                              />
                            </div>
                            <span className="font-mono text-[11px] font-semibold text-slate-700">
                              {item.sellThroughRate}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              អស់ស្តុក (Out of Stock)
                            </span>
                          ) : isHighSales ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              លក់ដាច់ (High Demand)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                              មានក្នុងស្តុក (In Stock)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2 Content: Actual In-Stock Vehicles Table */}
        {activeTab === "inventory" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[750px] whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700 font-bold bg-slate-50">
                  <th className="py-3 px-3.5">#No</th>
                  <th className="py-3 px-3.5">Brand & Model</th>
                  <th className="py-3 px-3.5">VIN</th>
                  <th className="py-3 px-3.5">Year</th>
                  <th className="py-3 px-3.5">Color</th>
                  <th className="py-3 px-3.5">Branch</th>
                  <th className="py-3 px-3.5">Cost / Price</th>
                  <th className="py-3 px-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      កំពុងផ្ទុកទិន្នន័យ (Loading inventory)...
                    </td>
                  </tr>
                ) : data.recentVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No vehicles currently in stock
                    </td>
                  </tr>
                ) : (
                  data.recentVehicles.map((car: any, idx: number) => {
                    const brandName =
                      car.model?.brand?.name ||
                      car.brand?.name ||
                      car.brand ||
                      "";
                    const modelName = car.model?.name || car.model || "";
                    const displayName =
                      `${brandName} ${modelName}`.trim() || "Vehicle";
                    const year = car.madeYear || car.year || "—";
                    const color = car.exteriorColor || car.color || "—";
                    const branchName =
                      car.currentBranch?.name ||
                      car.branch?.name ||
                      "PHNOM PENH";
                    const price = Number(
                      car.inSalePrice || car.purchaseCost || car.price || 0
                    );

                    return (
                      <tr
                        key={car.id || idx}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3 px-3.5 font-medium text-slate-800">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-slate-900">
                          {displayName}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-slate-600">
                          {car.vin || "—"}
                        </td>
                        <td className="py-3 px-3.5">{year}</td>
                        <td className="py-3 px-3.5">{color}</td>
                        <td className="py-3 px-3.5">{branchName}</td>
                        <td className="py-3 px-3.5 font-semibold text-slate-800">
                          ${price.toLocaleString()}
                        </td>
                        <td className="py-3 px-3.5 text-right">
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
        )}
      </div>
    </div>
  );
}
