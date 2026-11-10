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
import { vehicleService } from "@/lib/api";
import type { VehicleSummary } from "@csm/contracts";

export default function InventoryReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 font-sans">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-[#1c3d73]" />
          <p className="text-sm font-medium">កំពុងផ្ទុកទិន្នន័យ (Loading Stock Report)...</p>
        </div>
      }
    >
      <InventoryReportContent />
    </Suspense>
  );
}

function InventoryReportContent() {
  const searchParams = useSearchParams();
  const paramView = searchParams.get("view"); // "stock" | "purchased"
  const isPurchased = paramView === "purchased";

  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterModel, setFilterModel] = useState("");
  const [filterVin, setFilterVin] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // Date filters (for Purchased Report / Screenshot 6)
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
      const data = await vehicleService.list();
      setVehicles((data as unknown as VehicleSummary[]) || []);
    } catch (err) {
      console.error("Failed to load inventory report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDateSearch = () => {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
  };

  const formatMoney = (val?: number | null) => {
    const num = Number(val || 0);
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Filtered dataset
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // 1. In stock vs all purchased
      if (!isPurchased) {
        // Stock List: only IN_STOCK or IN_TRANSIT
        if (v.status === "SOLD") return false;
      }

      // 2. Purchased Date filter (when applied on purchased report)
      if (isPurchased && (appliedFrom || appliedTo)) {
        const pDate = v.purchasingDate
          ? v.purchasingDate.slice(0, 10)
          : v.createdAt
          ? v.createdAt.slice(0, 10)
          : "";
        if (appliedFrom && pDate && pDate < appliedFrom) return false;
        if (appliedTo && pDate && pDate > appliedTo) return false;
      }

      // 3. Model filter
      if (
        filterModel.trim() &&
        !v.model.toLowerCase().includes(filterModel.trim().toLowerCase()) &&
        !v.brand.toLowerCase().includes(filterModel.trim().toLowerCase())
      ) {
        return false;
      }

      // 4. Vin / Engine filter
      if (filterVin.trim()) {
        const query = filterVin.trim().toLowerCase();
        const matchesVin = v.vin.toLowerCase().includes(query);
        const matchesEngine = v.engineNumber?.toLowerCase().includes(query);
        if (!matchesVin && !matchesEngine) return false;
      }

      // 5. Year filter
      if (filterYear.trim()) {
        if (!String(v.madeYear).includes(filterYear.trim())) return false;
      }

      return true;
    });
  }, [vehicles, isPurchased, appliedFrom, appliedTo, filterModel, filterVin, filterYear]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "#No",
      "Brand",
      "Model",
      "Vin Number",
      "Color",
      "Year",
      "Engine",
      "Cost",
      "Location",
      "Clearance",
      "Tax",
      "Transport",
      "Container",
      "Labor",
      "Repair",
      "Total",
    ];

    const rows = filteredVehicles.map((v, idx) => [
      idx + 1,
      v.brand,
      v.model,
      v.vin,
      v.exteriorColor || "",
      v.madeYear || "",
      v.engineNumber || "N/A",
      (v.purchaseCost || 0).toFixed(2),
      v.branchName || "PHNOM PENH",
      (v.clearanceCost || 0).toFixed(2),
      (v.taxCost || 0).toFixed(2),
      (v.transportCost || 0).toFixed(2),
      (v.containerCost || 0).toFixed(2),
      (v.laborCost || 0).toFixed(2),
      (v.repairCost || 0).toFixed(2),
      (v.totalLandedCost || 0).toFixed(2),
    ]);

    const csv =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `${
      isPurchased ? "car_purchased_report" : "car_instock_report"
    }_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="bg-white min-h-[calc(100vh-80px)] font-sans antialiased text-[#212529] pb-12">
      {/* ── 1. Breadcrumbs (Exact Screenshots 5 & 6) ── */}
      <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f0f3f6] border border-[#e2e8f0] rounded text-xs text-slate-600 w-fit mb-4">
        <TableProperties className="h-3.5 w-3.5 text-[#0066cc]" />
        <Link href="/" className="text-[#0066cc] hover:underline font-normal">
          Dashboard
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <span className="text-slate-500">
          {isPurchased ? "Car list detial" : "Car list instock"}
        </span>
      </div>

      {/* ── 2. Page Title (Exact Screenshots 5 & 6) ── */}
      <h1 className="text-xl font-normal text-[#333] mb-4">
        {isPurchased ? "Car list" : "Car in stock list"}
      </h1>

      {/* ── 3. Top Filter: "Filter expense" card (Only on Purchased Report / Screenshot 6) ── */}
      {isPurchased && (
        <div className="border border-[#e2e8f0] rounded p-4 mb-4 bg-white shadow-2xs">
          <div className="text-[13px] font-bold text-[#333] flex items-center gap-1.5 mb-3">
            <Filter className="h-3.5 w-3.5 text-[#555]" />
            <span>Filter expense</span>
          </div>

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

            {/* Red Search Button (Exact #d9534f) */}
            <button
              onClick={handleDateSearch}
              className="h-8 px-4 bg-[#d9534f] hover:bg-[#c9302c] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="h-3 w-3" />
              <span>Search</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 4. Secondary Filter: Model / Vin / Year + Export Out (Screenshots 5 & 6) ── */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Model */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#337ab7]">Model</label>
            <input
              type="text"
              placeholder="Car model"
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="h-8 px-2.5 text-xs border border-slate-300 rounded focus:border-[#337ab7] focus:outline-none w-[160px] sm:w-[180px] bg-white placeholder:text-slate-400"
            />
          </div>

          {/* Vin number */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#337ab7]">Vin number</label>
            <input
              type="text"
              placeholder="Engine"
              value={filterVin}
              onChange={(e) => setFilterVin(e.target.value)}
              className="h-8 px-2.5 text-xs border border-slate-300 rounded focus:border-[#337ab7] focus:outline-none w-[160px] sm:w-[180px] bg-white placeholder:text-slate-400"
            />
          </div>

          {/* Year */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#337ab7]">Year</label>
            <input
              type="text"
              placeholder="Year"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="h-8 px-2.5 text-xs border border-slate-300 rounded focus:border-[#337ab7] focus:outline-none w-[120px] bg-white placeholder:text-slate-400"
            />
          </div>
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

      {/* ── 5. Subtitle (Exact Screenshots 5 & 6) ── */}
      <p className="text-xs text-slate-500 mb-2">costomize and view brand list</p>

      {/* ── 6. 16-Column Dark Blue Table (Exact Screenshots 5 & 6) ── */}
      <div className="border border-[#1f385c] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#1f385c] text-white uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-2.5 px-2.5 border-r border-[#2d4d77] text-center w-10">#No</th>
                <th className="py-2.5 px-3 border-r border-[#2d4d77]">Brand</th>
                <th className="py-2.5 px-3 border-r border-[#2d4d77]">Model</th>
                <th className="py-2.5 px-3 border-r border-[#2d4d77]">Vin Number</th>
                <th className="py-2.5 px-3 border-r border-[#2d4d77]">Color</th>
                <th className="py-2.5 px-2.5 border-r border-[#2d4d77] text-center">Year</th>
                <th className="py-2.5 px-3 border-r border-[#2d4d77]">Engine</th>
                <th className="py-2.5 px-3 border-r border-[#2d4d77] text-right">Cost</th>
                <th className="py-2.5 px-3 border-r border-[#2d4d77]">Location</th>
                <th className="py-2.5 px-3 border-r border-[#2d4d77] text-right">Clearance</th>
                <th className="py-2.5 px-3 border-r border-[#2d4d77] text-right">Tax</th>
                <th className="py-2.5 px-3 border-r border-[#2d4d77] text-right">Transport</th>
                <th className="py-2.5 px-3 border-r border-[#2d4d77] text-right">Container</th>
                <th className="py-2.5 px-3 border-r border-[#2d4d77] text-right">Labor</th>
                <th className="py-2.5 px-3 border-r border-[#2d4d77] text-right">Repair</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-slate-500">
                    Loading inventory records...
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-slate-400">
                    No vehicles found
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2.5 border-r border-slate-200 text-center text-slate-600">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-800">
                      {v.brand}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                      {v.model}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-700">
                      {v.vin}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600 uppercase text-[11px]">
                      {v.exteriorColor || "—"}
                    </td>
                    <td className="py-2 px-2.5 border-r border-slate-200 text-center text-slate-700">
                      {v.madeYear || "—"}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600 text-[11px]">
                      {v.engineNumber || "N/A"}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right font-medium text-slate-800">
                      {formatMoney(v.purchaseCost)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600 uppercase text-[11px]">
                      {v.branchName || "PHNOM PENH"}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right text-slate-700">
                      {formatMoney(v.clearanceCost)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right text-slate-700">
                      {formatMoney(v.taxCost)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right text-slate-700">
                      {formatMoney(v.transportCost)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right text-slate-700">
                      {formatMoney(v.containerCost)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right text-slate-700">
                      {formatMoney(v.laborCost)}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-right text-slate-700">
                      {formatMoney(v.repairCost)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {formatMoney(v.totalLandedCost)}
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
