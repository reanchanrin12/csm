"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Search,
  Truck,
  RotateCw,
  Eye,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { costService } from "@/lib/api";

interface BillItem {
  id: string;
  billNumber: string;
  category: string;
  supplierName: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  billDate: string;
  description?: string;
  vehicles: {
    id?: string;
    vin: string;
    vehicleName: string;
    brand?: string;
    model?: string;
    madeYear?: number;
    color?: string;
    costType?: string;
    allocatedAmount: number;
  }[];
}

interface TrackingRow {
  billId: string;
  billNumber: string;
  supplierName: string;
  shippingDate: string;
  vin: string;
  brand: string;
  model: string;
  year: number | string;
  color: string;
  tranFee: number;
  containerFee: number;
  laborFee: number;
  totalFee: number;
}

function TrackingShippingContent() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await costService.getBills(undefined, undefined, undefined, "shipping");
      setBills((data as BillItem[]) ?? []);
    } catch (err: unknown) {
      console.error("Failed to load tracking data", err);
      setError("Unable to load shipping tracking data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Flatten bills into tracking rows per vehicle
  const trackingRows = useMemo(() => {
    const list: TrackingRow[] = [];
    for (const b of bills) {
      const vehicleMap = new Map<string, TrackingRow>();
      for (const v of b.vehicles) {
        const existing = vehicleMap.get(v.vin);
        const tran = v.costType === "TRANSPORT" ? v.allocatedAmount : (!v.costType && b.category === "TRANSPORT" ? v.allocatedAmount : 0);
        const cont = v.costType === "CONTAINER" ? v.allocatedAmount : 0;
        const lab = v.costType === "LABOR" ? v.allocatedAmount : 0;

        if (!existing) {
          vehicleMap.set(v.vin, {
            billId: b.id,
            billNumber: b.billNumber,
            supplierName: b.supplierName || "-",
            shippingDate: b.billDate ? b.billDate.slice(0, 10) : "-",
            vin: v.vin,
            brand: v.brand || "",
            model: v.model || v.vehicleName || "",
            year: v.madeYear || "-",
            color: v.color || "-",
            tranFee: tran,
            containerFee: cont,
            laborFee: lab,
            totalFee: tran + cont + lab,
          });
        } else {
          existing.tranFee += tran;
          existing.containerFee += cont;
          existing.laborFee += lab;
          existing.totalFee = existing.tranFee + existing.containerFee + existing.laborFee;
        }
      }
      list.push(...Array.from(vehicleMap.values()));
    }
    return list;
  }, [bills]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!appliedSearch) return trackingRows;
    const q = appliedSearch.toLowerCase();
    return trackingRows.filter(
      (r) =>
        r.vin.toLowerCase().includes(q) ||
        r.billNumber.toLowerCase().includes(q) ||
        r.brand.toLowerCase().includes(q) ||
        r.model.toLowerCase().includes(q) ||
        r.supplierName.toLowerCase().includes(q)
    );
  }, [trackingRows, appliedSearch]);

  const totalItems = filteredRows.length;
  const effectivePageSize = pageSize <= 0 ? Math.max(1, totalItems) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const paginatedRows = useMemo(() => {
    if (pageSize <= 0) return filteredRows;
    const start = (currentPage - 1) * effectivePageSize;
    return filteredRows.slice(start, start + effectivePageSize);
  }, [filteredRows, currentPage, effectivePageSize, pageSize]);

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1700px] mx-auto min-h-screen text-slate-800">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <LayoutGrid className="h-3.5 w-3.5 text-sky-500" />
        <Link href="/" className="text-sky-600 hover:underline">
          Dashboard
        </Link>
        <span>&gt;</span>
        <span className="text-slate-700">Tracking Shipping</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-[#2c3e50] tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-sky-500" />
            <span>Tracking Shipping</span>
          </h1>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="h-[30px] px-3 border border-[#dcdfe6] text-slate-600 hover:bg-slate-50 rounded-[2px] text-xs font-medium cursor-pointer flex items-center gap-1.5"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[2px] border border-[#e4e7ed] p-5 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setAppliedSearch(searchTerm);
                  setCurrentPage(1);
                }
              }}
              placeholder="Search by VIN, Bill Number, Model or Logistic..."
              className="flex-1 h-[32px] px-3 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
            />
            <button
              type="button"
              onClick={() => {
                setAppliedSearch(searchTerm);
                setCurrentPage(1);
              }}
              className="h-[32px] px-4 bg-[#409eff] hover:bg-[#337ecc] text-white rounded-[2px] text-xs font-semibold cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Total Tracked Vehicles: <span className="font-bold text-slate-800">{totalItems}</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-[#e4e7ed] rounded-[2px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f5f7fa] text-slate-700 font-semibold border-b border-[#e4e7ed]">
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3">VIN Number</th>
                <th className="p-3">Brand</th>
                <th className="p-3">Model</th>
                <th className="p-3">Color</th>
                <th className="p-3">Bill No</th>
                <th className="p-3">Logistic Company</th>
                <th className="p-3 text-center">Shipping Date</th>
                <th className="p-3 text-right">Shipping Cost</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center">
                    <Skeleton className="h-5 w-48 mx-auto" />
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="p-8 text-center text-slate-400 italic text-xs"
                  >
                    No tracked vehicles found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const rowNo =
                    pageSize <= 0 ? idx + 1 : (currentPage - 1) * effectivePageSize + idx + 1;
                  return (
                    <tr
                      key={`${row.billId}-${row.vin}-${idx}`}
                      className="border-b border-[#e4e7ed] hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="p-3 text-center font-mono text-slate-500">
                        {rowNo}
                      </td>
                      <td className="p-3 font-mono font-semibold text-sky-700">
                        {row.vin}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {row.brand}
                      </td>
                      <td className="p-3 text-slate-700">{row.model}</td>
                      <td className="p-3 text-slate-600">{row.color}</td>
                      <td className="p-3 font-mono text-slate-800">
                        {row.billNumber}
                      </td>
                      <td className="p-3 text-slate-700 uppercase">
                        {row.supplierName}
                      </td>
                      <td className="p-3 text-center text-slate-600 font-mono">
                        {row.shippingDate}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        ${row.totalFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Delivered</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-2">
          <div className="flex items-center gap-2">
            <span>
              Showing {totalItems === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1} to{" "}
              {pageSize <= 0 ? totalItems : Math.min(currentPage * effectivePageSize, totalItems)} of{" "}
              {totalItems} vehicles
            </span>
            <div className="flex items-center gap-1.5 ml-3">
              <span className="text-[11px] text-slate-500">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-[26px] px-2 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-700 focus:outline-none focus:border-[#409eff]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>All</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1 || pageSize <= 0}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-[28px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              &lt; Previous
            </button>
            <span className="h-[28px] px-3 bg-[#409eff] text-white rounded-[2px] text-xs font-semibold flex items-center justify-center">
              {currentPage}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages || pageSize <= 0}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-[28px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackingShippingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading tracking...</div>}>
      <TrackingShippingContent />
    </Suspense>
  );
}

