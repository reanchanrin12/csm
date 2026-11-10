"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  TableProperties,
  Filter,
  Search,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { expenseService } from "@/lib/api";
import type { OperatingExpenseItem } from "@csm/contracts";

export default function OtherExpensesReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 font-sans">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-[#1c3d73]" />
          <p className="text-sm font-medium">កំពុងផ្ទុកទិន្នន័យ (Loading Other Expenses Report)...</p>
        </div>
      }
    >
      <OtherExpensesContent />
    </Suspense>
  );
}

function OtherExpensesContent() {
  const [expenses, setExpenses] = useState<OperatingExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await expenseService.list();
      setExpenses(res?.expenses || []);
    } catch (err) {
      console.error("Failed to load other expenses report:", err);
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
  };

  const formatMoney = (val?: number | null) => {
    const num = Number(val || 0);
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const filteredList = useMemo(() => {
    return expenses.filter((e) => {
      const d = e.expenseDate
        ? e.expenseDate.slice(0, 10)
        : e.createdAt
        ? e.createdAt.slice(0, 10)
        : "";
      if (appliedFrom && d && d < appliedFrom) return false;
      if (appliedTo && d && d > appliedTo) return false;
      return true;
    });
  }, [expenses, appliedFrom, appliedTo]);

  const handleExportCsv = () => {
    const headers = ["#No", "Date", "Expense On", "Amount Paid", "Detail"];
    const rows = filteredList.map((e, idx) => [
      idx + 1,
      e.expenseDate ? e.expenseDate.slice(0, 10) : e.createdAt.slice(0, 10),
      `"${(e.expenseTo || "General Expense").replace(/"/g, '""')}"`,
      Number(e.amount || 0).toFixed(2),
      `"${(e.details || "").replace(/"/g, '""')}"`,
    ]);
    const csv =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `other_expenses_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="bg-white min-h-[calc(100vh-80px)] font-sans antialiased text-[#212529] pb-12">
      {/* ── 1. Breadcrumb (Exact Screenshot 7) ── */}
      <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f0f3f6] border border-[#e2e8f0] rounded text-xs text-slate-600 w-fit mb-4">
        <TableProperties className="h-3.5 w-3.5 text-[#0066cc]" />
        <Link href="/" className="text-[#0066cc] hover:underline font-normal">
          Dashboard
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <span className="text-slate-500">Report expense</span>
      </div>

      {/* ── 2. Filter Card (Exact Screenshot 7) ── */}
      <div className="border border-[#e2e8f0] rounded p-4 mb-4 bg-white shadow-2xs">
        <div className="text-[13px] font-bold text-[#333] flex items-center gap-1.5 mb-3">
          <Filter className="h-3.5 w-3.5 text-[#555]" />
          <span>Filter expense</span>
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

            {/* Red Search Button */}
            <button
              onClick={handleSearch}
              className="h-8 px-4 bg-[#d9534f] hover:bg-[#c9302c] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="h-3 w-3" />
              <span>Search</span>
            </button>
          </div>

          {/* Blue Export out Button */}
          <button
            onClick={handleExportCsv}
            className="h-8 px-4 bg-[#337ab7] hover:bg-[#286090] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer self-end ml-auto"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export out</span>
          </button>
        </div>
      </div>

      {/* ── 3. Tab Header (Exact Screenshot 7) ── */}
      <div className="mb-4">
        <div className="inline-block px-4 py-2 border border-b-0 border-slate-300 rounded-t bg-white text-xs font-semibold text-slate-800">
          Expenses list
        </div>
        <div className="border-t border-slate-300 -mt-[1px]"></div>
      </div>

      {/* ── 4. Table (Exact Screenshot 7) ── */}
      <div className="border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-300 text-slate-700 font-semibold text-[11px] bg-slate-50">
                <th className="py-2.5 px-3">#No</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Expense On</th>
                <th className="py-2.5 px-3 text-right">Amount Paid</th>
                <th className="py-2.5 px-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No expense records found
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-600">{idx + 1}</td>
                    <td className="py-2 px-3 text-slate-600">
                      {item.expenseDate
                        ? item.expenseDate.slice(0, 10)
                        : item.createdAt
                        ? item.createdAt.slice(0, 10)
                        : "—"}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {item.expenseTo || "General Expense"}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-800">
                      {formatMoney(item.amount)}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{item.details || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
