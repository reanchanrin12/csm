"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  Wrench,
  Download,
  Calendar,
  Search,
  RefreshCw,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { costService, PartsAndRepairsReportItem } from "@/lib/api";
import { exportToCsv } from "@/lib/export-csv";

export default function RepairsReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 font-sans">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-[#1c3d73]" />
          <p className="text-sm font-medium">កំពុងផ្ទុកទិន្នន័យ (Loading Parts & Repairs Report)...</p>
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
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState("ALL");
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
      const data = await costService.getPartsAndRepairs();
      setRecords(data || []);
    } catch (err) {
      console.error("Failed to load parts & repairs report:", err);
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
    const today = new Date();
    if (type === "all") {
      setStartDate("");
      setEndDate("");
    } else if (type === "today") {
      const formatted = today.toISOString().slice(0, 10);
      setStartDate(formatted);
      setEndDate(formatted);
    } else if (type === "this_month") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
      setStartDate(startOfMonth);
      setEndDate(endOfMonth);
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      // Type filter
      if (typeFilter !== "ALL" && item.costType !== typeFilter) return false;

      // Date filter
      if (startDate && item.billDate && item.billDate.slice(0, 10) < startDate) return false;
      if (endDate && item.billDate && item.billDate.slice(0, 10) > endDate) return false;

      // Search keyword
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noteMatch = (item.note || "").toLowerCase().includes(q);
        const vinMatch = (item.vehicleVin || "").toLowerCase().includes(q);
        const carMatch = (item.vehicleName || "").toLowerCase().includes(q);
        const supplierMatch = (item.supplierName || "").toLowerCase().includes(q);
        const billMatch = (item.billNumber || "").toLowerCase().includes(q);
        const branchMatch = (item.branchName || "").toLowerCase().includes(q);
        if (!noteMatch && !vinMatch && !carMatch && !supplierMatch && !billMatch && !branchMatch)
          return false;
      }
      return true;
    });
  }, [records, typeFilter, startDate, endDate, searchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, startDate, endDate, searchQuery]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "Bill Date",
      "Part / Repair Note",
      "Category",
      "Vehicle",
      "VIN",
      "Supplier / Garage",
      "Bill No",
      "Branch",
      "Amount ($)",
    ];
    const rows = filteredRecords.map((item) => [
      item.billDate ? item.billDate.slice(0, 10) : "",
      item.note || "-",
      item.costType,
      item.vehicleName,
      item.vehicleVin,
      item.supplierName,
      item.billNumber,
      item.branchName,
      item.amount,
    ]);
    exportToCsv("Parts_and_Repairs_Report", headers, rows);
  };

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // KPIs
  const totalCost = useMemo(
    () => filteredRecords.reduce((s, i) => s + (Number(i.amount) || 0), 0),
    [filteredRecords]
  );
  const repairCost = useMemo(
    () =>
      filteredRecords
        .filter((i) => i.costType === "REPAIR")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0),
    [filteredRecords]
  );
  const accessoryCost = useMemo(
    () =>
      filteredRecords
        .filter((i) => i.costType === "ACCESSORY")
        .reduce((s, i) => s + (Number(i.amount) || 0), 0),
    [filteredRecords]
  );

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
            <span className="text-[#1c3d73] font-semibold">របាយការណ៍គ្រឿងបន្លាស់ & ជួសជុល (Parts & Repairs)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1c3d73] flex items-center justify-center shadow-xs">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                របាយការណ៍គ្រឿងបន្លាស់ & ជួសជុល (Parts & Repairs)
              </h1>
              <p className="text-xs text-slate-500">
                តាមដានការចំណាយលើថ្លៃជាង ហ្គារ៉ាស គ្រឿងបន្លាស់ និងគ្រឿងតុបតែងបន្ថែមតាមរថយន្តនីមួយៗ
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5 items-end">
            {/* Type Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-[#1c3d73]" />
                <span>ប្រភេទ (Type)</span>
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-800 h-9.5 focus:outline-none focus:ring-2 focus:ring-[#1c3d73]/20 focus:border-[#1c3d73] transition-all cursor-pointer font-medium"
              >
                <option value="ALL">All Types (ទាំងអស់)</option>
                <option value="REPAIR">REPAIR (ការជួសជុល)</option>
                <option value="ACCESSORY">ACCESSORY (គ្រឿងតុបតែងបន្ថែម)</option>
              </select>
            </div>

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
            <div className="md:col-span-1 lg:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-[#1c3d73]" />
                <span>ស្វែងរក (Search VIN, Part, Garage)</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="ស្វែងរកតាមលេខ VIN, រថយន្ត, គ្រឿងបន្លាស់, ជាង/ហ្គារ៉ាស..."
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1c3d73]" />
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ប្រតិបត្តិការសរុប (Operations)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {filteredRecords.length}{" "}
              <span className="text-xs font-sans font-medium text-slate-500">លើក/មុខ</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ចំនួនបំពាក់គ្រឿងបន្លាស់ & ជួសជុល</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ចំណាយសរុប (Total Cost)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-rose-600">
              ${totalCost.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ទឹកប្រាក់ចំណាយសរុបលើគ្រឿងបន្លាស់ & ជួសជុល</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              ថ្លៃជួសជុល (Repair Costs)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-amber-600">
              ${repairCost.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ចំណាយលើថ្លៃជួសជុលសុទ្ធ</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              គ្រឿងតុបតែង (Accessory Costs)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-blue-600">
              ${accessoryCost.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ចំណាយលើគ្រឿងតុបតែងបន្ថែម</p>
          </CardContent>
        </Card>
      </div>

      {/* ── 4. Main Data Table ── */}
      <Card className="bg-white border-slate-200/80 shadow-xs overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px] whitespace-nowrap">
            <thead className="bg-[#0f172a] text-white uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">កាលបរិច្ឆេទ (Date)</th>
                <th className="px-4 py-3.5">ការជួសជុល / គ្រឿងបន្លាស់ (Description)</th>
                <th className="px-4 py-3.5">ប្រភេទ (Category)</th>
                <th className="px-4 py-3.5">រថយន្ត (Vehicle)</th>
                <th className="px-4 py-3.5">លេខ VIN</th>
                <th className="px-4 py-3.5">ហ្គារ៉ាស / អ្នកផ្គត់ផ្គង់ (Supplier)</th>
                <th className="px-4 py-3.5">វិក្កយបត្រ (Bill No)</th>
                <th className="px-4 py-3.5">សាខា (Branch)</th>
                <th className="px-4 py-3.5 text-right">តម្លៃ ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 text-slate-600 font-mono">
                    {item.billDate ? item.billDate.slice(0, 10) : "-"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {item.note || "សេវាជួសជុលទូទៅ"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`rounded-lg px-2.5 py-0.5 font-semibold text-[10px] ${
                        item.costType === "REPAIR"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                      }`}
                    >
                      {item.costType === "REPAIR" ? "REPAIR (ជួសជុល)" : "ACCESSORY (គ្រឿងតុបតែង)"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-medium">
                    {item.vehicleName}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#1c3d73] font-semibold">
                    {item.vehicleVin}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.supplierName}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono">
                    {item.billNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.branchName}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-rose-600">
                    ${(Number(item.amount) || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Wrench className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">មិនមានទិន្នន័យគ្រឿងបន្លាស់ ឬការជួសជុលឡើយ (No records found)</p>
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
          totalItems={filteredRecords.length}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
