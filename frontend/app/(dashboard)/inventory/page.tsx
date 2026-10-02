"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { LayoutGrid, Download, RotateCcw, Car } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { VehicleSummary } from "@csm/contracts";
import { vehicleService } from "@/lib/api";
import { TablePagination } from "@/components/ui/table-pagination";

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters matching exact screenshot: Model, Vin number, Year
  const [filterModel, setFilterModel] = useState("");
  const [filterVin, setFilterVin] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const data = (await vehicleService.list()) as VehicleSummary[];
      setVehicles(data);
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (filterModel.trim() && !v.model.toLowerCase().includes(filterModel.toLowerCase())) {
        return false;
      }
      if (
        filterVin.trim() &&
        !v.vin.toLowerCase().includes(filterVin.toLowerCase()) &&
        !(v.engineNumber && v.engineNumber.toLowerCase().includes(filterVin.toLowerCase()))
      ) {
        return false;
      }
      if (filterYear.trim() && String(v.madeYear) !== filterYear.trim()) {
        return false;
      }
      return true;
    });
  }, [vehicles, filterModel, filterVin, filterYear]);

  // Table pagination state (10 items per page limit to prevent slow rendering)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterModel, filterVin, filterYear]);

  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, currentPage, pageSize]);

  const formatMoney = (val?: number | null) => {
    const num = Number(val || 0);
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Export CSV handler
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
      v.exteriorColor,
      v.madeYear,
      v.engineNumber || "",
      formatMoney(v.purchaseCost),
      v.branchName || "PHNOM PENH",
      formatMoney(v.clearanceCost),
      formatMoney(v.taxCost),
      formatMoney(v.transportCost),
      formatMoney(v.containerCost),
      formatMoney(v.laborCost),
      formatMoney(v.repairCost),
      formatMoney(v.totalLandedCost),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `car_in_stock_list_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white min-h-[calc(100vh-80px)] font-sans antialiased text-[#212529] pb-12">
      {/* 1. Breadcrumb bar (Exact Screenshot) */}
      <div className="flex items-center gap-1.5 bg-[#f0f3f6] px-3.5 py-2 rounded text-xs text-slate-600 border border-[#e2e8f0] w-fit mb-5">
        <LayoutGrid className="h-3.5 w-3.5 text-[#0066cc]" />
        <Link href="/" className="text-[#0066cc] hover:underline font-normal">
          Dashboard
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <span className="text-slate-500">Car list instock</span>
      </div>

      {/* 2. Page Title */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-[#212529] tracking-tight">
          Car in stock list
        </h1>
      </div>

      {/* 3. Filter Inputs & Export out Button (Exact Screenshot) */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-end gap-3 sm:gap-5 w-full sm:w-auto">
          {/* Model */}
          <div className="w-full sm:w-56">
            <label className="text-[12px] font-semibold text-[#0066cc] mb-1.5 block">
              Model
            </label>
            <input
              type="text"
              placeholder="Car model"
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-3 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
            />
          </div>

          {/* Vin number (placeholder: Engine) */}
          <div className="w-full sm:w-56">
            <label className="text-[12px] font-semibold text-[#0066cc] mb-1.5 block">
              Vin number
            </label>
            <input
              type="text"
              placeholder="Engine"
              value={filterVin}
              onChange={(e) => setFilterVin(e.target.value)}
              className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-3 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
            />
          </div>

          {/* Year */}
          <div className="w-full sm:w-56">
            <label className="text-[12px] font-semibold text-[#0066cc] mb-1.5 block">
              Year
            </label>
            <input
              type="text"
              placeholder="Year"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-3 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
            />
          </div>

          {(filterModel || filterVin || filterYear) && (
            <button
              type="button"
              onClick={() => {
                setFilterModel("");
                setFilterVin("");
                setFilterYear("");
                setCurrentPage(1);
              }}
              className="h-8 px-3 text-xs text-[#6c757d] hover:text-[#212529] border border-dashed border-[#ced4da] rounded-[4px] flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset filters"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>

        {/* Export out button */}
        <div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="bg-[#0066cc] hover:bg-[#0052a3] text-white text-xs font-normal px-4 py-2 rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            Export out
          </button>
        </div>
      </div>

      {/* 4. Subtitle */}
      <div className="mb-2">
        <p className="text-[12px] text-[#6c757d]">customize and view brand list</p>
      </div>

      {/* 5. 16-Column Table */}
      {isLoading ? (
        <div className="space-y-2 py-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-16 text-xs text-[#6c757d] border border-dashed rounded">
          No vehicles in stock found matching the filter criteria.
        </div>
      ) : (
        <div className="w-full overflow-x-auto border-t border-[#dee2e6]">
          <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-[#dee2e6] text-[#212529] font-bold bg-[#f8f9fa]">
                <th className="py-2.5 px-3">#No</th>
                <th className="py-2.5 px-3">Photo</th>
                <th className="py-2.5 px-3">Brand</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Vin Number</th>
                <th className="py-2.5 px-3">Color</th>
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3">Engine</th>
                <th className="py-2.5 px-3 text-right">Cost</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3 text-right">Clearance</th>
                <th className="py-2.5 px-3 text-right">Tax</th>
                <th className="py-2.5 px-3 text-right">Transport</th>
                <th className="py-2.5 px-3 text-right">Container</th>
                <th className="py-2.5 px-3 text-right">Labor</th>
                <th className="py-2.5 px-3 text-right">Repair</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVehicles.map((v, index) => (
                <tr
                  key={v.id}
                  className="border-b border-[#f1f3f5] hover:bg-[#f8f9fa] transition-colors"
                >
                  <td className="py-3 px-3 text-[#6c757d] font-bold">
                    {(currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="py-2 px-3">
                    <div className="h-10 w-14 rounded overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                      {v.coverImageUrl ? (
                        <img
                          src={v.coverImageUrl}
                          alt={v.model}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Car className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#212529] uppercase">{v.brand}</td>
                  <td className="py-3 px-3 font-medium text-[#212529] uppercase">{v.model}</td>
                  <td className="py-3 px-3 text-[#495057] font-mono text-[11px] uppercase tracking-wider">
                    {v.vin}
                  </td>
                  <td className="py-3 px-3 text-[#495057] uppercase">{v.exteriorColor}</td>
                  <td className="py-3 px-3 text-[#495057]">{v.madeYear}</td>
                  <td className="py-3 px-3 text-[#495057] font-mono text-[11px]">
                    {v.engineNumber || "—"}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-[#212529]">
                    {formatMoney(v.purchaseCost)}
                  </td>
                  <td className="py-3 px-3 text-[#495057] uppercase">
                    {v.branchName || "PHNOM PENH"}
                  </td>
                  <td className="py-3 px-3 text-right text-[#495057]">
                    {formatMoney(v.clearanceCost)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#495057]">
                    {formatMoney(v.taxCost)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#495057]">
                    {formatMoney(v.transportCost)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#495057]">
                    {formatMoney(v.containerCost)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#495057]">
                    {formatMoney(v.laborCost)}
                  </td>
                  <td className="py-3 px-3 text-right text-[#495057]">
                    {formatMoney(v.repairCost)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#212529]">
                    {formatMoney(v.totalLandedCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <TablePagination
            currentPage={currentPage}
            totalItems={filteredVehicles.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
