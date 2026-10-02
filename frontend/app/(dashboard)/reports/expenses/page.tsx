"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  DollarSign,
  Download,
  Calendar,
  Search,
  RefreshCw,
  ChevronRight,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/table-pagination";
import { expenseService } from "@/lib/api";
import type { OperatingExpenseItem } from "@csm/contracts";
import { exportToCsv } from "@/lib/export-csv";
import {
  getTodayDateString,
  getStartOfMonthDateString,
  getEndOfMonthDateString,
} from "@/lib/date-utils";

export default function ExpensesReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 font-sans">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-[#1c3d73]" />
          <p className="text-sm font-medium">កំពុងផ្ទុកទិន្នន័យ (Loading Expense Report)...</p>
        </div>
      }
    >
      <ExpensesReportContent />
    </Suspense>
  );
}

function ExpensesReportContent() {
  const [expenses, setExpenses] = useState<OperatingExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [datePreset, setDatePreset] = useState<"all" | "this_month" | "today">("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await expenseService.list();
      setExpenses(res?.expenses || []);
    } catch (err) {
      console.error("Failed to load expense report:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Preset Date Filter Helpers
  const handlePresetDate = (type: "today" | "this_month" | "all") => {
    setDatePreset(type);
    if (type === "all") {
      setStartDate("");
      setEndDate("");
    } else if (type === "today") {
      const formatted = getTodayDateString();
      setStartDate(formatted);
      setEndDate(formatted);
    } else if (type === "this_month") {
      setStartDate(getStartOfMonthDateString());
      setEndDate(getEndOfMonthDateString());
    }
  };

  // Filtered Data
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      if (startDate && item.expenseDate && item.expenseDate.slice(0, 10) < startDate) return false;
      if (endDate && item.expenseDate && item.expenseDate.slice(0, 10) > endDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const toMatch = (item.expenseTo || "").toLowerCase();
        const detailsMatch = (item.details || "").toLowerCase();
        const catMatch = ((item as { category?: string }).category || "").toLowerCase();
        if (!toMatch.includes(q) && !detailsMatch.includes(q) && !catMatch.includes(q)) return false;
      }
      return true;
    });
  }, [expenses, startDate, endDate, searchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, searchQuery]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ["Expense Date", "Expense To", "Amount ($)", "Details / Note"];
    const rows = filteredExpenses.map((item) => [
      item.expenseDate ? item.expenseDate.slice(0, 10) : "",
      item.expenseTo,
      item.amount,
      item.details || "",
    ]);
    exportToCsv("Expenses_Report", headers, rows);
  };

  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* ── 1. Breadcrumbs & Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Link href="/" className="hover:text-[#1c3d73] transition-colors">
              ផ្ទាំងដើម (Home)
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400">របាយការណ៍ (Reports)</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[#1c3d73] font-semibold">របាយការណ៍ចំណាយទូទៅ (Expense Reports)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1c3d73] flex items-center justify-center shadow-xs">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                របាយការណ៍ចំណាយទូទៅ (Operating Expenses)
              </h1>
              <p className="text-xs text-slate-500">
                តាមដានរាល់កំណត់ត្រាចំណាយប្រតិបត្តិការ ថ្លៃជួល និងចំណាយផ្សេងៗក្នុងក្រុមហ៊ុន
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="h-9 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin text-[#1c3d73]" : ""}`} />
            <span>ផ្ទុកឡើងវិញ</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportCsv}
            className="h-9 rounded-xl bg-[#1c3d73] hover:bg-[#152e57] text-white shadow-xs transition-all cursor-pointer font-medium"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <span>ទាញយក CSV</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Filter Bar ── */}
      <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5 items-end">
            {/* Date From */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#1c3d73]" />
                <span>ចាប់ពីថ្ងៃ (Date From)</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("all");
                }}
                className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-slate-200 text-slate-800 text-xs h-9.5 rounded-xl focus-visible:ring-2 focus-visible:ring-[#1c3d73]/20 focus-visible:border-[#1c3d73] transition-all"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#1c3d73]" />
                <span>ដល់ថ្ងៃ (Date To)</span>
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("all");
                }}
                className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-slate-200 text-slate-800 text-xs h-9.5 rounded-xl focus-visible:ring-2 focus-visible:ring-[#1c3d73]/20 focus-visible:border-[#1c3d73] transition-all"
              />
            </div>

            {/* Search Input */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-[#1c3d73]" />
                <span>ស្វែងរក (Search Note / Receiver)</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="ស្វែងរកតាមចំណាយលើ, ព័ត៌មានលម្អិត..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-slate-200 text-slate-800 text-xs h-9.5 rounded-xl focus-visible:ring-2 focus-visible:ring-[#1c3d73]/20 focus-visible:border-[#1c3d73] transition-all"
                />
              </div>
            </div>

            {/* Date Preset Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 block">ជម្រើសកាលបរិច្ឆេទ</label>
              <div className="flex gap-1.5 items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetDate("all")}
                  className={`h-9.5 text-xs px-3 rounded-xl border-slate-200 transition-all cursor-pointer font-semibold ${
                    datePreset === "all" && !startDate && !endDate
                      ? "bg-[#1c3d73] text-white border-transparent"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetDate("this_month")}
                  className={`h-9.5 text-xs px-3 rounded-xl border-slate-200 transition-all cursor-pointer font-semibold ${
                    datePreset === "this_month"
                      ? "bg-[#1c3d73] text-white border-transparent"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Month
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetDate("today")}
                  className={`h-9.5 text-xs px-3 rounded-xl border-slate-200 transition-all cursor-pointer font-semibold ${
                    datePreset === "today"
                      ? "bg-[#1c3d73] text-white border-transparent"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Today
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1c3d73]" />
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ចំនួនប្រតិបត្តិការចំណាយ (Expense Records)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {filteredExpenses.length}{" "}
              <span className="text-xs font-sans font-medium text-slate-500">ប្រតិបត្តិការ</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ចំនួនកំណត់ត្រាចំណាយទូទៅក្នុងរយៈពេលនេះ</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ចំណាយប្រតិបត្តិការសរុប (Total Operating Expenses)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-rose-600">
              ${totalExpenseAmount.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ទឹកប្រាក់ចំណាយប្រតិបត្តិការសរុបទាំងអស់</p>
          </CardContent>
        </Card>
      </div>

      {/* ── 4. Main Data Table ── */}
      <Card className="bg-white border-slate-200/80 shadow-xs overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px] whitespace-nowrap">
            <thead className="bg-[#0f172a] text-white uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Expense Date</th>
                <th className="px-4 py-3.5">Expense To (ចំណាយលើ)</th>
                <th className="px-4 py-3.5 text-right">Amount ($)</th>
                <th className="px-4 py-3.5">Details / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedExpenses.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 text-slate-600 font-mono">
                    {item.expenseDate ? item.expenseDate.slice(0, 10) : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-semibold">{item.expenseTo}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-rose-600">
                    ${Number(item.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.details || "-"}</td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">មិនមានទិន្នន័យចំណាយឡើយ (No expenses found)</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── 5. Pagination Bar ── */}
        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredExpenses.length}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
