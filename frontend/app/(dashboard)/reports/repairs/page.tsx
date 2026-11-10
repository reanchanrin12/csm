"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  TableProperties,
  Search,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { costService, PartsAndRepairsReportItem } from "@/lib/api";

export default function RepairsReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 font-sans">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-[#1c3d73]" />
          <p className="text-sm font-medium">កំពុងផ្ទុកទិន្នន័យ (Loading Repair Report)...</p>
        </div>
      }
    >
      <RepairsReportContent />
    </Suspense>
  );
}

function RepairsReportContent() {
  const [records, setRecords] = useState<PartsAndRepairsReportItem[]>([]);
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
  const [filterSupplier, setFilterSupplier] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await costService.getPartsAndRepairs();
      setRecords(data || []);
    } catch (err) {
      console.error("Failed to load repair report:", err);
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
    return records.filter((r) => {
      const d = r.billDate ? r.billDate.slice(0, 10) : r.createdAt ? r.createdAt.slice(0, 10) : "";
      if (appliedFrom && d && d < appliedFrom) return false;
      if (appliedTo && d && d > appliedTo) return false;
      if (filterSupplier.trim()) {
        const supName = r.supplierName || "";
        if (!supName.toLowerCase().includes(filterSupplier.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [records, appliedFrom, appliedTo, filterSupplier]);

  const handleExportCsv = () => {
    const headers = [
      "#",
      "Brand",
      "Model",
      "Vin_Number",
      "Amount",
      "Payment",
      "Balance",
      "Repair_Date",
      "Supplier",
      "Note",
    ];
    const rows = filteredList.map((r, idx) => [
      idx + 1,
      r.vehicleName || "—",
      "—",
      r.vehicleVin || "—",
      (r.amount || 0).toFixed(2),
      (r.amount || 0).toFixed(2),
      "0.00",
      r.billDate ? r.billDate.slice(0, 10) : r.createdAt ? r.createdAt.slice(0, 10) : "—",
      `"${(r.supplierName || "Workshop").replace(/"/g, '""')}"`,
      `"${(r.note || "").replace(/"/g, '""')}"`,
    ]);
    const csv =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `repair_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="bg-white min-h-[calc(100vh-80px)] font-sans antialiased text-[#212529] pb-12">
      {/* ── 1. Breadcrumb (Exact Screenshot 6) ── */}
      <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f0f3f6] border border-[#e2e8f0] rounded text-xs text-slate-600 w-fit mb-4">
        <TableProperties className="h-3.5 w-3.5 text-[#0066cc]" />
        <Link href="/" className="text-[#0066cc] hover:underline font-normal">
          Dashboard
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <span className="text-slate-500">Report for repair</span>
      </div>

      {/* ── 2. Tab Header (Exact Screenshot 6) ── */}
      <div className="mb-4">
        <div className="inline-block px-4 py-2 border border-b-0 border-slate-300 rounded-t bg-white text-xs font-semibold text-slate-800">
          Car repaired
        </div>
        <div className="border-t border-slate-300 -mt-[1px]"></div>
      </div>

      {/* ── 3. Title (Exact Screenshot 6) ── */}
      <h1 className="text-lg font-normal text-[#333] mb-4">Car repaired list</h1>

      {/* ── 4. Filter Controls (Exact Screenshot 6) ── */}
      <div className="space-y-3 mb-4">
        {/* Row 1: Date from, Date to, Red Search */}
        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-600">Date from</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 px-2.5 text-xs border border-slate-300 rounded focus:border-[#337ab7] focus:outline-none w-[150px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-600">Date to</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 px-2.5 text-xs border border-slate-300 rounded focus:border-[#337ab7] focus:outline-none w-[150px]"
            />
          </div>

          <button
            onClick={handleSearch}
            className="h-8 px-4 bg-[#d9534f] hover:bg-[#c9302c] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Search className="h-3 w-3" />
            <span>Search</span>
          </button>
        </div>

        {/* Row 2: Spplier (spelled exactly as screenshot) */}
        <div className="flex flex-col gap-1 max-w-xs">
          <label className="text-[11px] font-semibold text-slate-600">Spplier</label>
          <input
            type="text"
            placeholder="filter by supplier name"
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="h-8 px-2.5 text-xs border border-slate-300 rounded focus:border-[#337ab7] focus:outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ── 5. Subtitle & Export Button (Exact Screenshot 6) ── */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">view report list</p>
        <button
          onClick={handleExportCsv}
          className="h-8 px-4 bg-[#337ab7] hover:bg-[#286090] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Export out</span>
        </button>
      </div>

      {/* ── 6. Table (Exact Screenshot 6) ── */}
      <div className="border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-300 text-slate-700 font-semibold text-[11px] bg-slate-50">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Brand</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Vin_Number</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-right">Payment</th>
                <th className="py-2.5 px-3 text-right">Balance</th>
                <th className="py-2.5 px-3">Repair_Date</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Loading repair records...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No repair records found
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-600">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{item.vehicleName || "—"}</td>
                    <td className="py-2 px-3 text-slate-700">—</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{item.vehicleVin || "—"}</td>
                    <td className="py-2 px-3 text-right font-medium text-slate-800">{formatMoney(item.amount)}</td>
                    <td className="py-2 px-3 text-right text-slate-800">{formatMoney(item.amount)}</td>
                    <td className="py-2 px-3 text-right text-slate-500">$0.00</td>
                    <td className="py-2 px-3 text-slate-600">
                      {item.billDate ? item.billDate.slice(0, 10) : item.createdAt ? item.createdAt.slice(0, 10) : "—"}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-700">{item.supplierName || "Workshop"}</td>
                    <td className="py-2 px-3 text-slate-500">{item.note || item.costType || "—"}</td>
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
