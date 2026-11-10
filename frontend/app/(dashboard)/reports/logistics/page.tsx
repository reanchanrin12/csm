"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  TableProperties,
  Search,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import { costService } from "@/lib/api";

interface CostBillReportItem {
  id: string;
  billNumber?: string | null;
  invoiceNo?: string | null;
  category: string;
  billDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status?: string | null;
  supplierName?: string | null;
  supplier?: { nameEn: string } | null;
}

export default function LogisticsReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 font-sans">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-[#1c3d73]" />
          <p className="text-sm font-medium">កំពុងផ្ទុកទិន្នន័យ (Loading Logistics Report)...</p>
        </div>
      }
    >
      <LogisticsReportContent />
    </Suspense>
  );
}

function LogisticsReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") === "tax" ? "tax" : "shipping";
  const isTax = currentTab === "tax";

  const [costBills, setCostBills] = useState<CostBillReportItem[]>([]);
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
      const data = await costService.getBills();
      setCostBills((data as unknown as CostBillReportItem[]) || []);
    } catch (err) {
      console.error("Failed to load logistics bills:", err);
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

  // Filtered list based on active tab (Shipping vs Tax & Clearance)
  const filteredList = useMemo(() => {
    return costBills.filter((bill) => {
      // Tab categorization
      if (isTax) {
        if (bill.category !== "TAX" && bill.category !== "CLEARANCE") return false;
      } else {
        if (bill.category !== "TRANSPORT" && bill.category !== "CONTAINER" && bill.category !== "SHIPPING") {
          // If not tax/clearance/repair, default to shipping
          if (bill.category === "TAX" || bill.category === "CLEARANCE" || bill.category === "REPAIR") return false;
        }
      }

      // Date filter
      const bDate = bill.billDate ? bill.billDate.slice(0, 10) : "";
      if (appliedFrom && bDate && bDate < appliedFrom) return false;
      if (appliedTo && bDate && bDate > appliedTo) return false;

      // Supplier name filter
      if (filterSupplier.trim()) {
        const supName = bill.supplierName || bill.supplier?.nameEn || "";
        if (!supName.toLowerCase().includes(filterSupplier.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [costBills, isTax, appliedFrom, appliedTo, filterSupplier]);

  const handleExportCsv = () => {
    const headers = [
      "#",
      "Invoice No",
      "Paid amount",
      "Balance",
      "Total",
      "Transport date",
      "Supplier",
    ];
    const rows = filteredList.map((b, idx) => [
      idx + 1,
      b.invoiceNo || b.billNumber || b.id.slice(0, 8),
      (b.paidAmount || 0).toFixed(2),
      (b.balance || 0).toFixed(2),
      (b.totalAmount || 0).toFixed(2),
      b.billDate ? b.billDate.slice(0, 10) : "—",
      `"${(b.supplierName || b.supplier?.nameEn || "General Supplier").replace(/"/g, '""')}"`,
    ]);
    const csv =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `${isTax ? "tax_clearance_report" : "shipping_report"}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="bg-white min-h-[calc(100vh-80px)] font-sans antialiased text-[#212529] pb-12">
      {/* ── 1. Breadcrumbs (Exact Screenshots 4 & 5) ── */}
      <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f0f3f6] border border-[#e2e8f0] rounded text-xs text-slate-600 w-fit mb-4">
        <TableProperties className="h-3.5 w-3.5 text-[#0066cc]" />
        <Link href="/" className="text-[#0066cc] hover:underline font-normal">
          Dashboard
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <span className="text-slate-500">
          {isTax ? "Tax and Clearance" : "Shipping Info"}
        </span>
      </div>

      {/* ── 2. Tab Header (Exact Screenshots 4 & 5) ── */}
      <div className="mb-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push("/reports/logistics?tab=shipping")}
            className={`px-4 py-2 border border-b-0 rounded-t text-xs font-semibold cursor-pointer ${
              !isTax ? "border-slate-300 bg-white text-slate-800" : "border-transparent bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
          >
            Shipping
          </button>
          <button
            onClick={() => router.push("/reports/logistics?tab=tax")}
            className={`px-4 py-2 border border-b-0 rounded-t text-xs font-semibold cursor-pointer ${
              isTax ? "border-slate-300 bg-white text-slate-800" : "border-transparent bg-slate-100 text-slate-500 hover:text-slate-800"
            }`}
          >
            Tax & Clearance
          </button>
        </div>
        <div className="border-t border-slate-300 -mt-[1px]"></div>
      </div>

      {/* ── 3. Title (Exact Screenshots 4 & 5) ── */}
      <h1 className="text-lg font-normal text-[#333] mb-4">
        {isTax ? "Tax and Clearance report" : "Shipping list"}
      </h1>

      {/* ── 4. Filter Controls (Exact Screenshots 4 & 5) ── */}
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

        {/* Row 2: Repair supplier */}
        <div className="flex flex-col gap-1 max-w-xs">
          <label className="text-[11px] font-semibold text-slate-600">Repair supplier</label>
          <input
            type="text"
            placeholder="filter by supplier name"
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="h-8 px-2.5 text-xs border border-slate-300 rounded focus:border-[#337ab7] focus:outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ── 5. Subtitle & Export Button (Exact Screenshots 4 & 5) ── */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">
          {isTax ? "view transport was add" : "view shipping report"}
        </p>
        <button
          onClick={handleExportCsv}
          className="h-8 px-4 bg-[#337ab7] hover:bg-[#286090] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Export out</span>
        </button>
      </div>

      {/* ── 6. Table (Exact Screenshots 4 & 5) ── */}
      <div className="border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-300 text-slate-700 font-semibold text-[11px] bg-slate-50">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Invoice No</th>
                <th className="py-2.5 px-3 text-right">Paid amount</th>
                <th className="py-2.5 px-3 text-right">Balance</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3">Transport date</th>
                <th className="py-2.5 px-3">Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading records...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-600">{idx + 1}</td>
                    <td className="py-2 px-3 font-mono font-medium text-slate-800">
                      {item.invoiceNo || item.billNumber || item.id.slice(0, 8)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-800">
                      {formatMoney(item.paidAmount)}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-800">{formatMoney(item.balance)}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">{formatMoney(item.totalAmount)}</td>
                    <td className="py-2 px-3 text-slate-600">
                      {item.billDate ? item.billDate.slice(0, 10) : "—"}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-700">
                      {item.supplierName || item.supplier?.nameEn || "General Logistics"}
                    </td>
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
