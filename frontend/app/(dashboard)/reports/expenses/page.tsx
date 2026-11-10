"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  TableProperties,
  Filter,
  Search,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { expenseService } from "@/lib/api";
import type { OperatingExpenseItem } from "@csm/contracts";

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
  const searchParams = useSearchParams();
  const paramView = searchParams.get("view"); // "details" | "summary"
  const isSummary = paramView === "summary";

  const [expenses, setExpenses] = useState<OperatingExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [dateFrom, setDateFrom] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [expenseType, setExpenseType] = useState("All");

  // Applied filter state after user clicks Search
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [appliedType, setAppliedType] = useState("All");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await expenseService.list();
      setExpenses(res?.expenses || []);
    } catch (err) {
      console.error("Failed to load expense report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
    setAppliedType(expenseType);
  };

  // Distinct types for dropdown
  const expenseTypeOptions = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.expenseTo) set.add(e.expenseTo);
    });
    return ["All", ...Array.from(set)];
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const itemDate = item.expenseDate
        ? item.expenseDate.slice(0, 10)
        : item.createdAt
        ? item.createdAt.slice(0, 10)
        : "";
      if (appliedFrom && itemDate && itemDate < appliedFrom) return false;
      if (appliedTo && itemDate && itemDate > appliedTo) return false;
      if (appliedType !== "All" && item.expenseTo !== appliedType) return false;
      return true;
    });
  }, [expenses, appliedFrom, appliedTo, appliedType]);

  const formatMoney = (val?: number | null) => {
    const num = Number(val || 0);
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Grouping for Summary View
  const summaryRows = useMemo(() => {
    const map = new Map<string, { count: number; totalAmount: number }>();
    filteredExpenses.forEach((e) => {
      const cat = e.expenseTo || "OTHER";
      const existing = map.get(cat) || { count: 0, totalAmount: 0 };
      existing.count += 1;
      existing.totalAmount += Number(e.amount || 0);
      map.set(cat, existing);
    });

    return Array.from(map.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      amount: data.totalAmount,
    }));
  }, [filteredExpenses]);

  // Totals
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  const handleExportCsv = () => {
    if (isSummary) {
      const headers = ["Expense Type", "Expense Count", "Expense Amount"];
      const rows = summaryRows.map((r) => [r.type, r.count, r.amount.toFixed(2)]);
      rows.push(["Total", filteredExpenses.length, totalAmount.toFixed(2)]);
      const csv =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csv);
      link.download = `expense_summary_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    } else {
      const headers = ["Expense Type", "Reference", "Date", "Amount", "Note", "By"];
      const rows = filteredExpenses.map((e) => [
        e.expenseTo || "OTHER",
        e.id.slice(0, 8).toUpperCase(),
        e.expenseDate ? e.expenseDate.slice(0, 10) : e.createdAt.slice(0, 10),
        Number(e.amount || 0).toFixed(2),
        `"${(e.details || "").replace(/"/g, '""')}"`,
        "admin",
      ]);
      rows.push(["Total", "", "", totalAmount.toFixed(2), "", ""]);
      const csv =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csv);
      link.download = `expense_details_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-80px)] font-sans antialiased text-[#212529] pb-12">
      {/* ── 1. Breadcrumbs (Exact Screenshots 3 & 4) ── */}
      <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f0f3f6] border border-[#e2e8f0] rounded text-xs text-slate-600 w-fit mb-4">
        <TableProperties className="h-3.5 w-3.5 text-[#0066cc]" />
        <Link href="/" className="text-[#0066cc] hover:underline font-normal">
          Dashboard
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <span className="text-slate-500">Report Expense Summary</span>
      </div>

      {/* ── 2. Filter Card (Exact Screenshots 3 & 4) ── */}
      <div className="border border-[#e2e8f0] rounded p-4 mb-4 bg-white shadow-2xs">
        <div className="text-[13px] font-bold text-[#333] flex items-center gap-1.5 mb-3">
          <Filter className="h-3.5 w-3.5 text-[#555]" />
          <span>Filter</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
            {/* Date from */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-600">Date from</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 px-2.5 text-xs border border-slate-300 rounded focus:border-[#337ab7] focus:outline-none w-[150px]"
              />
            </div>

            {/* Date to */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-600">Date to</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 px-2.5 text-xs border border-slate-300 rounded focus:border-[#337ab7] focus:outline-none w-[150px]"
              />
            </div>

            {/* Expense Types dropdown (Only in Expense Details / Screenshot 3) */}
            {!isSummary && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-600">Expense Types</label>
                <select
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value)}
                  className="h-8 px-2.5 text-xs border border-slate-300 rounded focus:border-[#337ab7] focus:outline-none bg-white min-w-[140px]"
                >
                  {expenseTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Red Search Button (Exact #d9534f) */}
            <button
              onClick={handleSearch}
              className="h-8 px-4 bg-[#d9534f] hover:bg-[#c9302c] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="h-3 w-3" />
              <span>Search</span>
            </button>
          </div>

          {/* Blue Export out Button (Exact #337ab7) */}
          <button
            onClick={handleExportCsv}
            className="h-8 px-4 bg-[#337ab7] hover:bg-[#286090] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer self-end ml-auto"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export out</span>
          </button>
        </div>
      </div>

      {/* ── 3. Table Presentation (Exact match) ── */}
      {isSummary ? (
        /* ================= EXPENSE SUMMARY VIEW (Screenshot 4) ================= */
        <div className="border border-[#1f385c] rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#1f385c] text-white uppercase text-[11px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3 border-r border-[#2d4d77]">Expense Type</th>
                  <th className="py-2.5 px-3 border-r border-[#2d4d77] text-center">Expense Count</th>
                  <th className="py-2.5 px-3 text-right">Expense Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      Loading expense summary...
                    </td>
                  </tr>
                ) : summaryRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      No expense data found
                    </td>
                  </tr>
                ) : (
                  summaryRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-800">
                        {row.type}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-center text-slate-700">
                        {row.count}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-slate-800">
                        {formatMoney(row.amount)}
                      </td>
                    </tr>
                  ))
                )}

                {/* Yellow Total Summary Row (Exact Screenshot 4) */}
                <tr className="bg-[#fff8db] border-t-2 border-[#f1e4b3] font-bold text-slate-800">
                  <td className="py-2 px-3 text-right pr-4">Total :</td>
                  <td className="py-2 px-3 text-center">{filteredExpenses.length}</td>
                  <td className="py-2 px-3 text-right">{formatMoney(totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= EXPENSE DETAILS VIEW (Screenshot 3) ================= */
        <div className="border border-[#1f385c] rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#1f385c] text-white uppercase text-[11px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3 border-r border-[#2d4d77]">Expense Type</th>
                  <th className="py-2.5 px-3 border-r border-[#2d4d77]">Reference</th>
                  <th className="py-2.5 px-3 border-r border-[#2d4d77]">Date</th>
                  <th className="py-2.5 px-3 border-r border-[#2d4d77] text-right">Amount</th>
                  <th className="py-2.5 px-3 border-r border-[#2d4d77]">Note</th>
                  <th className="py-2.5 px-3">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading expense details...
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No expense records found
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-800">
                        {exp.expenseTo || "OTHER"}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-600 font-mono text-[11px]">
                        {exp.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                        {exp.expenseDate
                          ? exp.expenseDate.slice(0, 10)
                          : exp.createdAt
                          ? exp.createdAt.slice(0, 10)
                          : "—"}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-right font-medium text-slate-800">
                        {formatMoney(exp.amount)}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 text-slate-600 max-w-[240px] truncate">
                        {exp.details || "—"}
                      </td>
                      <td className="py-2 px-3 text-slate-600">admin</td>
                    </tr>
                  ))
                )}

                {/* Yellow Total Summary Row (Exact Screenshot 3: Total : $0.00) */}
                <tr className="bg-[#fff8db] border-t-2 border-[#f1e4b3] font-bold text-slate-800">
                  <td colSpan={3} className="py-2 px-3 text-right pr-4">
                    Total :
                  </td>
                  <td className="py-2 px-3 text-right">{formatMoney(totalAmount)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
