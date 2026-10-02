"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  Truck,
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
import { costService } from "@/lib/api";
import { exportToCsv } from "@/lib/export-csv";

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
  vehicles?: { vin: string; brand?: string | null; model?: string | null }[] | null;
  vehicle?: { vin: string; brand?: string | null; model?: string | null } | null;
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
  const [costBills, setCostBills] = useState<CostBillReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("ALL");
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
      const bills = await costService.getBills(
        selectedCategory !== "ALL" ? selectedCategory : undefined
      );
      setCostBills((bills as unknown as CostBillReportItem[]) || []);
    } catch (err) {
      console.error("Failed to load logistics report:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

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

  // Filtered Bills
  const filteredBills = useMemo(() => {
    return costBills.filter((item) => {
      // Date filter
      if (startDate && item.billDate && item.billDate.slice(0, 10) < startDate) return false;
      if (endDate && item.billDate && item.billDate.slice(0, 10) > endDate) return false;

      // Search keyword
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const invoiceMatch = (item.billNumber || item.invoiceNo || "").toLowerCase().includes(q);
        const supplierMatch = (item.supplierName || item.supplier?.nameEn || "").toLowerCase().includes(q);
        const vinMatch = (item.vehicles?.[0]?.vin || item.vehicle?.vin || "").toLowerCase().includes(q);
        const catMatch = (item.category || "").toLowerCase().includes(q);
        if (!invoiceMatch && !supplierMatch && !vinMatch && !catMatch) return false;
      }
      return true;
    });
  }, [costBills, startDate, endDate, searchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, startDate, endDate, searchQuery]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "Invoice No",
      "Category",
      "Bill Date",
      "Supplier",
      "Total ($)",
      "Paid ($)",
      "Balance ($)",
      "Status",
      "Vehicle VIN",
    ];
    const rows = filteredBills.map((item) => [
      item.billNumber || item.invoiceNo || "N/A",
      item.category,
      item.billDate ? item.billDate.slice(0, 10) : "",
      item.supplierName || item.supplier?.nameEn || "",
      item.totalAmount,
      item.paidAmount,
      item.balance,
      item.balance <= 0 ? "PAID" : "UNPAID",
      item.vehicles?.[0]?.vin || item.vehicle?.vin || "",
    ]);
    exportToCsv(`Logistics_${selectedCategory}_Report`, headers, rows);
  };

  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, currentPage, pageSize]);

  // KPI calculations
  const totalInvoiced = useMemo(
    () => filteredBills.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0),
    [filteredBills]
  );
  const totalPaid = useMemo(
    () => filteredBills.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0),
    [filteredBills]
  );
  const totalBalance = useMemo(
    () => filteredBills.reduce((s, i) => s + (Number(i.balance) || 0), 0),
    [filteredBills]
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
            <span className="text-[#1c3d73] font-semibold">របាយការណ៍ដឹកជញ្ជូន & ថ្លៃដើម (Logistics & Costs)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1c3d73] flex items-center justify-center shadow-xs">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                របាយការណ៍ដឹកជញ្ជូន & ថ្លៃដើមបន្ថែម (Logistics & Landed Costs)
              </h1>
              <p className="text-xs text-slate-500">
                តាមដានការចំណាយលើការដឹកជញ្ជូន ពន្ធគយ សេវាបោសសម្អាត និងវិក្កយបត្រអ្នកផ្គត់ផ្គង់
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
            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-[#1c3d73]" />
                <span>ប្រភេទថ្លៃដើម (Category)</span>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-800 h-9.5 focus:outline-none focus:ring-2 focus:ring-[#1c3d73]/20 focus:border-[#1c3d73] transition-all cursor-pointer font-medium"
              >
                <option value="ALL">All Categories (ទាំងអស់)</option>
                <option value="TRANSPORT">Shipping (TRANSPORT)</option>
                <option value="TAX">Tax (ពន្ធគយ)</option>
                <option value="CLEARANCE">Clearance (បោសសម្អាត)</option>
                <option value="REPAIR">Repair (ជួសជុល)</option>
                <option value="CONTAINER">Container (កុងតឺន័រ)</option>
                <option value="LABOR">Labor (កម្លាំងពលកម្ម)</option>
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
                <span>ស្វែងរក (Search Invoice, Supplier, VIN)</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="ស្វែងរកតាមលេខវិក្កយបត្រ, អ្នកផ្គត់ផ្គង់, VIN..."
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1c3d73]" />
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              វិក្កយបត្រសរុប (Total Invoiced)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-slate-900">
              ${totalInvoiced.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ទឹកប្រាក់វិក្កយបត្រថ្លៃដើមសរុបទាំងអស់</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              បានទូទាត់រួច (Paid Amount)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-emerald-600">
              ${totalPaid.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ទឹកប្រាក់ដែលបានបង់រួចរាល់</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className={`absolute top-0 left-0 right-0 h-1 ${totalBalance > 0 ? "bg-amber-500" : "bg-emerald-500"}`} />
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {totalBalance < 0 ? "ទឹកប្រាក់ទូទាត់លើស (Overpaid)" : "ជំពាក់នៅសល់ (Outstanding Balance)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div
              className={`text-2xl font-bold font-mono ${
                totalBalance > 0
                  ? "text-amber-600"
                  : totalBalance < 0
                  ? "text-blue-600"
                  : "text-slate-700"
              }`}
            >
              {totalBalance < 0
                ? `-$${Math.abs(totalBalance).toLocaleString()}`
                : `$${totalBalance.toLocaleString()}`}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {totalBalance < 0
                ? "ទឹកប្រាក់ទូទាត់លើស (Overpaid to supplier)"
                : totalBalance > 0
                ? "ទឹកប្រាក់ត្រូវទូទាត់បន្តទៅអ្នកផ្គត់ផ្គង់"
                : "ទូទាត់រួចរាល់ស្មើគ្នា (Fully settled)"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── 4. Main Data Table ── */}
      <Card className="bg-white border-slate-200/80 shadow-xs overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px] whitespace-nowrap">
            <thead className="bg-[#0f172a] text-white uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Invoice No</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Bill Date</th>
                <th className="px-4 py-3.5">Supplier</th>
                <th className="px-4 py-3.5">Vehicle VIN</th>
                <th className="px-4 py-3.5 text-right">Total ($)</th>
                <th className="px-4 py-3.5 text-right">Paid ($)</th>
                <th className="px-4 py-3.5 text-right">Balance ($)</th>
                <th className="px-4 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedBills.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#1c3d73]">
                    {item.billNumber || item.invoiceNo || "N/A"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-700 text-[10px] rounded-lg">
                      {item.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono">
                    {item.billDate ? item.billDate.slice(0, 10) : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-medium">
                    {item.supplierName || item.supplier?.nameEn || "-"}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                    {item.vehicles?.[0]?.vin || item.vehicle?.vin || "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                    ${(Number(item.totalAmount) || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-600">
                    ${(Number(item.paidAmount) || 0).toLocaleString()}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-semibold tabular-nums ${
                      (item.balance || 0) > 0
                        ? "text-amber-600"
                        : (item.balance || 0) < 0
                        ? "text-blue-600"
                        : "text-slate-400"
                    }`}
                  >
                    {(item.balance || 0) < 0
                      ? `-$${Math.abs(item.balance || 0).toLocaleString()}`
                      : `$${(item.balance || 0).toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="outline"
                      className={`rounded-lg px-2.5 py-0.5 font-semibold text-[10px] ${
                        (item.balance || 0) <= 0
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {(item.balance || 0) <= 0 ? "PAID" : "UNPAID"}
                    </Badge>
                  </td>
                </tr>
              ))}
              {filteredBills.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Truck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">មិនមានទិន្នន័យដឹកជញ្ជូន/ចំណាយស្របតាមការស្វែងរកឡើយ (No records found)</p>
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
          totalItems={filteredBills.length}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
