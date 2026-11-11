"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TableProperties, RotateCcw, Car, Eye, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { VehicleSummary } from "@csm/contracts";
import { vehicleService } from "@/lib/api";
import { TablePagination } from "@/components/ui/table-pagination";

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters matching exact screenshot: Brand, Model, Vin number, Year, Body color, Car Instock
  const [filterBrand, setFilterBrand] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterVin, setFilterVin] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [filterStockStatus, setFilterStockStatus] = useState<"ALL" | "IN_STOCK" | "SOLD">("ALL");

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
      if (filterBrand.trim() && !v.brand.toLowerCase().includes(filterBrand.toLowerCase())) {
        return false;
      }
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
      if (
        filterColor.trim() &&
        !v.exteriorColor.toLowerCase().includes(filterColor.toLowerCase())
      ) {
        return false;
      }
      if (filterStockStatus === "IN_STOCK" && v.status !== "IN_STOCK") {
        return false;
      }
      if (filterStockStatus === "SOLD" && v.status !== "SOLD") {
        return false;
      }
      return true;
    });
  }, [vehicles, filterBrand, filterModel, filterVin, filterYear, filterColor, filterStockStatus]);

  // Table pagination state (configurable limit per page: 10, 25, 50, 100, or All)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterBrand, filterModel, filterVin, filterYear, filterColor, filterStockStatus, pageSize]);

  const paginatedVehicles = useMemo(() => {
    if (pageSize === -1) return filteredVehicles;
    const start = (currentPage - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, currentPage, pageSize]);

  const formatMoney = (val?: number | null) => {
    const num = Number(val || 0);
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.slice(0, 10);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return dateStr.slice(0, 10);
    }
  };

  // Export CSV handler
  const handleExportCsv = () => {
    const headers = [
      "#No",
      "Brand",
      "Model",
      "Vin Number",
      "Year",
      "Color",
      "Branch",
      "Cost",
      "Total Cost",
      "PurchaseDate",
    ];

    const rows = filteredVehicles.map((v, idx) => [
      idx + 1,
      v.brand,
      v.model,
      v.vin,
      v.madeYear,
      v.exteriorColor,
      v.branchName || "PHNOM PENH",
      formatMoney(v.purchaseCost),
      formatMoney(v.totalLandedCost),
      formatDate(v.purchasingDate || v.createdAt),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `car_purchased_list_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isFiltered = Boolean(
    filterBrand || filterModel || filterVin || filterYear || filterColor || filterStockStatus !== "ALL"
  );

  return (
    <div className="bg-white min-h-[calc(100vh-80px)] font-sans antialiased text-[#212529] pb-12">
      {/* 1. Breadcrumb bar (Exact Screenshot) */}
      <div className="flex items-center gap-1.5 bg-[#f0f3f6] px-3.5 py-2 rounded text-xs text-slate-600 border border-[#e2e8f0] w-fit mb-4">
        <TableProperties className="h-3.5 w-3.5 text-[#0066cc]" />
        <Link href="/" className="text-[#0066cc] hover:underline font-normal">
          Dashboard
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <span className="text-slate-500">Purchase manage</span>
      </div>

      {/* 2. Page Title */}
      <div className="mb-4">
        <h1 className="text-[24px] font-bold text-[#212529] tracking-tight">
          Car purchased list
        </h1>
      </div>

      {/* 3. Filter Inputs & Export out Button (Exact Screenshot) */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-end gap-2.5 sm:gap-3.5 w-full lg:w-auto">
          {/* Brand */}
          <div className="w-full sm:w-36">
            <label className="text-[12px] font-semibold text-[#0066cc] mb-1 block">
              Brand
            </label>
            <input
              type="text"
              placeholder="Brand name"
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="h-8 text-xs border border-[#ced4da] rounded-[3px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
            />
          </div>

          {/* Model */}
          <div className="w-full sm:w-36">
            <label className="text-[12px] font-semibold text-[#0066cc] mb-1 block">
              Model
            </label>
            <input
              type="text"
              placeholder="Car model"
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="h-8 text-xs border border-[#ced4da] rounded-[3px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
            />
          </div>

          {/* Vin number */}
          <div className="w-full sm:w-36">
            <label className="text-[12px] font-semibold text-[#0066cc] mb-1 block">
              Vin number
            </label>
            <input
              type="text"
              placeholder="vin no"
              value={filterVin}
              onChange={(e) => setFilterVin(e.target.value)}
              className="h-8 text-xs border border-[#ced4da] rounded-[3px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
            />
          </div>

          {/* Year */}
          <div className="w-full sm:w-28">
            <label className="text-[12px] font-semibold text-[#0066cc] mb-1 block">
              Year
            </label>
            <input
              type="text"
              placeholder="Year"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="h-8 text-xs border border-[#ced4da] rounded-[3px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
            />
          </div>

          {/* Body color */}
          <div className="w-full sm:w-32">
            <label className="text-[12px] font-semibold text-[#0066cc] mb-1 block">
              Body color
            </label>
            <input
              type="text"
              placeholder="Color"
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className="h-8 text-xs border border-[#ced4da] rounded-[3px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
            />
          </div>

          {/* Car Instock */}
          <div className="w-full sm:w-36">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[12px] font-semibold text-[#0066cc]">Car Instock</span>
              <input
                type="checkbox"
                checked={filterStockStatus === "IN_STOCK"}
                onChange={(e) =>
                  setFilterStockStatus(e.target.checked ? "IN_STOCK" : "ALL")
                }
                className="h-3.5 w-3.5 rounded border-[#ced4da] text-[#0066cc] focus:ring-0 cursor-pointer"
              />
            </div>
            <select
              value={filterStockStatus}
              onChange={(e) =>
                setFilterStockStatus(e.target.value as "ALL" | "IN_STOCK" | "SOLD")
              }
              className="h-8 text-xs border border-[#ced4da] rounded-[3px] px-2 text-[#495057] w-full bg-white focus:border-[#80bdff] focus:outline-none cursor-pointer"
            >
              <option value="ALL">-- All --</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setFilterBrand("");
                setFilterModel("");
                setFilterVin("");
                setFilterYear("");
                setFilterColor("");
                setFilterStockStatus("ALL");
                setCurrentPage(1);
              }}
              className="h-8 px-2.5 text-xs text-[#6c757d] hover:text-[#212529] border border-dashed border-[#ced4da] rounded-[3px] flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset filters"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>

        {/* Export out button */}
        <div className="mt-2 sm:mt-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="bg-[#0066cc] hover:bg-[#0052a3] text-white text-xs font-normal px-4 py-2 rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            Export out
          </button>
        </div>
      </div>

      {/* 4. Subtitle & Show entries */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] text-[#6c757d]">costomize and view brand list</p>
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-7 px-2 border border-slate-300 rounded bg-white text-xs text-slate-700 focus:outline-none focus:border-[#337ab7] cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={-1}>All</option>
          </select>
          <span>entries</span>
        </div>
      </div>

      {/* 5. Car Purchased Table matching Screenshot + Edit Button */}
      {isLoading ? (
        <div className="space-y-2 py-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-16 text-xs text-[#6c757d] border border-dashed rounded">
          No vehicles found matching the filter criteria.
        </div>
      ) : (
        <div className="w-full overflow-x-auto border-t border-[#dee2e6]">
          <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-[#dee2e6] text-[#212529] font-bold bg-[#f8f9fa]">
                <th className="py-2.5 px-3 w-12">#No</th>
                <th className="py-2.5 px-3 w-20">Gallery</th>
                <th className="py-2.5 px-3">Brand</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Vin Number</th>
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3">Color</th>
                <th className="py-2.5 px-3">Branch</th>
                <th className="py-2.5 px-3 text-right">Cost</th>
                <th className="py-2.5 px-3 text-right">Total Cost</th>
                <th className="py-2.5 px-3">PurchaseDate</th>
                <th className="py-2.5 px-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVehicles.map((v, index) => (
                <tr
                  key={v.id}
                  className="border-b border-[#f1f3f5] hover:bg-[#f8f9fa] transition-colors"
                >
                  <td className="py-3 px-3 text-[#6c757d] font-bold">
                    {pageSize === -1 ? index + 1 : (currentPage - 1) * pageSize + index + 1}
                  </td>
                  <td className="py-2 px-3">
                    <Link
                      href={`/inventory/${v.id}`}
                      className="h-10 w-16 rounded overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 block hover:opacity-85 transition-opacity"
                    >
                      {v.coverImageUrl ? (
                        <img
                          src={v.coverImageUrl}
                          alt={v.model}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Car className="h-5 w-5 text-slate-400" />
                      )}
                    </Link>
                  </td>
                  <td className="py-3 px-3 font-semibold text-[#212529] uppercase">{v.brand}</td>
                  <td className="py-3 px-3 font-medium text-[#212529] uppercase">
                    <Link
                      href={`/inventory/${v.id}`}
                      className="hover:text-[#0066cc] hover:underline"
                    >
                      {v.model}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-[#495057] font-mono text-[11px] uppercase tracking-wider">
                    {v.vin}
                  </td>
                  <td className="py-3 px-3 text-[#495057]">{v.madeYear}</td>
                  <td className="py-3 px-3 text-[#495057] uppercase">{v.exteriorColor}</td>
                  <td className="py-3 px-3 text-[#495057] uppercase">
                    {v.branchName || "PHNOM PENH"}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-[#212529]">
                    {formatMoney(v.purchaseCost)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#212529]">
                    {formatMoney(v.totalLandedCost)}
                  </td>
                  <td className="py-3 px-3 text-[#495057]">
                    {formatDate(v.purchasingDate || v.createdAt)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* 1. EDIT BUTTON requested by user */}
                      <Link
                        href={`/inventory/new?edit=${v.id}`}
                        className="h-7 w-7 rounded border border-[#ced4da] hover:border-[#0066cc] hover:bg-[#e7f1ff] text-[#495057] hover:text-[#0066cc] inline-flex items-center justify-center transition-colors shadow-2xs"
                        title="Edit car (កែសម្រួលរថយន្ត)"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Link>

                      {/* 2. VIEW DETAIL BUTTON (Eye icon) */}
                      <Link
                        href={`/inventory/${v.id}`}
                        className="h-7 w-7 rounded border border-[#ced4da] hover:border-[#0066cc] hover:bg-[#e7f1ff] text-[#495057] hover:text-[#0066cc] inline-flex items-center justify-center transition-colors shadow-2xs"
                        title="View car detail (មើលលម្អិត)"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </div>
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
