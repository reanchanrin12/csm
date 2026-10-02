"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  Package,
  Download,
  Calendar,
  Search,
  RefreshCw,
  ChevronRight,
  Car,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { vehicleService } from "@/lib/api";
import { exportToCsv } from "@/lib/export-csv";

interface VehicleReportItem {
  id: string;
  vin: string;
  brand: string;
  model: string;
  madeYear?: number | null;
  exteriorColor?: string | null;
  purchasePrice?: number | null;
  purchaseCost?: number | null;
  totalLandedCost?: number | null;
  status: string;
  coverImageUrl?: string | null;
  branchName?: string | null;
  currentBranch?: { name: string } | null;
  purchaseDate?: string | null;
  supplierName?: string | null;
  supplier?: { nameEn: string } | null;
}

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
  const [vehicles, setVehicles] = useState<VehicleReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await vehicleService.list();
      setVehicles((data as unknown as VehicleReportItem[]) || []);
    } catch (err) {
      console.error("Failed to load inventory report:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Inventory
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((item) => {
      // Status filter
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;

      // Date filter (purchase date if available)
      if (startDate && item.purchaseDate && item.purchaseDate.slice(0, 10) < startDate) return false;
      if (endDate && item.purchaseDate && item.purchaseDate.slice(0, 10) > endDate) return false;

      // Search keyword
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const vinMatch = (item.vin || "").toLowerCase().includes(q);
        const brandMatch = (item.brand || "").toLowerCase().includes(q);
        const modelMatch = (item.model || "").toLowerCase().includes(q);
        const colorMatch = (item.exteriorColor || "").toLowerCase().includes(q);
        const branchMatch = (item.branchName || item.currentBranch?.name || "").toLowerCase().includes(q);
        if (!vinMatch && !brandMatch && !modelMatch && !colorMatch && !branchMatch) return false;
      }
      return true;
    });
  }, [vehicles, statusFilter, startDate, endDate, searchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, startDate, endDate, searchQuery]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "VIN",
      "Brand",
      "Model",
      "Year",
      "Color",
      "Purchase Cost ($)",
      "Status",
      "Branch",
    ];
    const rows = filteredVehicles.map((item) => [
      item.vin,
      item.brand,
      item.model,
      item.madeYear || "",
      item.exteriorColor || "",
      item.purchaseCost ?? item.purchasePrice ?? 0,
      item.status,
      item.branchName || item.currentBranch?.name || "",
    ]);
    exportToCsv("Stock_Inventory_Report", headers, rows);
  };

  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, currentPage, pageSize]);

  const totalStockAssetValue = useMemo(() => {
    return filteredVehicles.reduce(
      (sum, item) => sum + ((item.purchaseCost ?? item.purchasePrice) || 0),
      0
    );
  }, [filteredVehicles]);

  const inStockCount = useMemo(() => {
    return filteredVehicles.filter(
      (i) => i.status === "IN_STOCK" || i.status === "AVAILABLE"
    ).length;
  }, [filteredVehicles]);

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
            <span className="text-[#1c3d73] font-semibold">របាយការណ៍ស្តុករថយន្ត (Stock / Purchased)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1c3d73] flex items-center justify-center shadow-xs">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                របាយការណ៍ស្តុករថយន្ត (Stock / Purchased)
              </h1>
              <p className="text-xs text-slate-500">
                តាមដានចំនួនរថយន្តក្នុងស្តុក តម្លៃដើមទុន និងស្ថានភាពរថយន្តតាមសាខានីមួយៗ
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
            {/* Status Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-[#1c3d73]" />
                <span>ស្ថានភាព (Status)</span>
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-800 h-9.5 focus:outline-none focus:ring-2 focus:ring-[#1c3d73]/20 focus:border-[#1c3d73] transition-all cursor-pointer font-medium"
              >
                <option value="ALL">All Statuses (ទាំងអស់)</option>
                <option value="IN_STOCK">IN_STOCK (ក្នុងស្តុក)</option>
                <option value="AVAILABLE">AVAILABLE (ទំនេរសម្រាប់លក់)</option>
                <option value="RESERVED">RESERVED (បានកក់)</option>
                <option value="SOLD">SOLD (បានលក់រួច)</option>
              </select>
            </div>

            {/* Date From */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#1c3d73]" />
                <span>ចាប់ពីថ្ងៃទិញ (From)</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-slate-200 text-slate-800 text-xs h-9.5 rounded-xl focus-visible:ring-2 focus-visible:ring-[#1c3d73]/20 focus-visible:border-[#1c3d73] transition-all"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#1c3d73]" />
                <span>ដល់ថ្ងៃទិញ (To)</span>
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-slate-200 text-slate-800 text-xs h-9.5 rounded-xl focus-visible:ring-2 focus-visible:ring-[#1c3d73]/20 focus-visible:border-[#1c3d73] transition-all"
              />
            </div>

            {/* Search Input */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-[#1c3d73]" />
                <span>ស្វែងរក (Search VIN, Brand, Model...)</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="ស្វែងរកតាមលេខ VIN, ម៉ាក, ម៉ូដែល, ពណ៌, សាខា..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-slate-200 text-slate-800 text-xs h-9.5 rounded-xl focus-visible:ring-2 focus-visible:ring-[#1c3d73]/20 focus-visible:border-[#1c3d73] transition-all"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1c3d73]" />
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                រថយន្តសរុប (Total Vehicles)
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1c3d73] flex items-center justify-center">
                <Car className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {filteredVehicles.length}{" "}
              <span className="text-xs font-sans font-medium text-slate-500">គ្រឿង</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ចំនួនរថយន្តសរុបតាមលក្ខខណ្ឌចម្រាញ់</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                រថយន្តមានស្រាប់ (In Stock / Available)
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Package className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-emerald-600">
              {inStockCount}{" "}
              <span className="text-xs font-sans font-medium text-slate-500">គ្រឿង</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">រថយន្តទំនេរដែលមានស្រាប់សម្រាប់លក់</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                តម្លៃដើមទុនស្តុក (Total Stock Asset Value)
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Car className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-blue-600">
              ${totalStockAssetValue.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ទំហំដើមទុនរថយន្តសរុបបច្ចុប្បន្ន</p>
          </CardContent>
        </Card>
      </div>

      {/* ── 4. Main Data Table ── */}
      <Card className="bg-white border-slate-200/80 shadow-xs overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[750px] whitespace-nowrap">
            <thead className="bg-[#0f172a] text-white uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">VIN</th>
                <th className="px-4 py-3.5">Brand & Model</th>
                <th className="px-4 py-3.5">Year</th>
                <th className="px-4 py-3.5">Color</th>
                <th className="px-4 py-3.5 text-right">Purchase Price ($)</th>
                <th className="px-4 py-3.5">Branch</th>
                <th className="px-4 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedVehicles.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-[#1c3d73] font-semibold">{item.vin}</td>
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-12 rounded overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                        {item.coverImageUrl ? (
                          <img
                            src={item.coverImageUrl}
                            alt={item.model}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Car className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div className="font-semibold text-slate-900">
                        {item.brand} {item.model}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono">{item.madeYear || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{item.exteriorColor || "-"}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-emerald-600">
                    ${((item.purchaseCost ?? item.purchasePrice) || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {item.branchName || item.currentBranch?.name || "PHNOM PENH"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="outline"
                      className={`rounded-lg px-2.5 py-0.5 font-semibold text-[10px] ${
                        item.status === "IN_STOCK" || item.status === "AVAILABLE"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : item.status === "SOLD"
                          ? "border-slate-200 bg-slate-100 text-slate-700"
                          : item.status === "RESERVED"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {filteredVehicles.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">មិនមានទិន្នន័យរថយន្តស្របតាមការស្វែងរកឡើយ (No vehicles found)</p>
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
          totalItems={filteredVehicles.length}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
