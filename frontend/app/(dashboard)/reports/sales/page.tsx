"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Calendar,
  Search,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  Truck,
  Car,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { salesService } from "@/lib/api";
import { exportToCsv } from "@/lib/export-csv";
import {
  getTodayDateString,
  getStartOfMonthDateString,
  getEndOfMonthDateString,
} from "@/lib/date-utils";

interface SaleOrderReportItem {
  id: string;
  receiptNo: string;
  soldDate: string;
  soldPrice: number;
  purchaseCost: number;
  totalLandedCost: number;
  grossProfit: number;
  marginPercent: number;
  loanType: string;
  customerName: string;
  customerPhone?: string | null;
  sellerName?: string | null;
  vehicle: {
    vin: string;
    brand: string;
    model: string;
    madeYear?: number | null;
    branch?: string | null;
    coverImageUrl?: string | null;
  };
}

export default function SalesReportPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500 text-sm">កំពុងផ្ទុកទិន្នន័យ (Loading Sales Report)...</div>}>
      <SalesReportContent />
    </Suspense>
  );
}

function SalesReportContent() {
  const [sales, setSales] = useState<SaleOrderReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [datePreset, setDatePreset] = useState<"all" | "month" | "today">("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchSalesData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await salesService.list();
      const rawSales = (Array.isArray(data) ? data : []) as any[];

      const mapped: SaleOrderReportItem[] = rawSales.map((s) => {
        const soldPrice = Number(s.soldPrice || 0);
        const purchaseCost = Number(s.purchaseCost ?? s.vehicle?.purchaseCost ?? s.vehicle?.purchasedPrice ?? 0);
        const totalLandedCost = Number(s.totalLandedCost ?? purchaseCost);
        const grossProfit = Number(s.grossProfit ?? (soldPrice - totalLandedCost));
        const marginPercent =
          Number(
            s.marginPercent ?? (soldPrice > 0 ? (grossProfit / soldPrice) * 100 : 0)
          ) || 0;

        return {
          id: s.id,
          receiptNo: s.receiptNo || s.invoiceNumber || `REC-${s.id.slice(0, 6)}`,
          soldDate: s.soldDate || s.createdAt || "",
          soldPrice,
          purchaseCost,
          totalLandedCost,
          grossProfit,
          marginPercent,
          loanType: s.loanType || "FULL_PAYMENT",
          customerName: s.customerName || s.customer?.name || "អតិថិជនទូទៅ",
          customerPhone: s.customerPhone || s.customer?.phone,
          sellerName: s.sellerName || s.seller?.englishName || "N/A",
          vehicle: {
            vin: s.vehicle?.vin || "N/A",
            brand: s.vehicle?.brand || s.vehicle?.model?.brand?.name || "-",
            model: s.vehicle?.model || s.vehicle?.model?.name || "-",
            madeYear: s.vehicle?.madeYear,
            branch: s.vehicle?.branch || s.vehicle?.currentBranch?.name || "-",
            coverImageUrl: s.vehicle?.coverImageUrl || null,
          },
        };
      });

      setSales(mapped);
    } catch (err) {
      console.error("Failed to load sales report:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const handleDatePreset = (preset: "all" | "month" | "today") => {
    setDatePreset(preset);
    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const todayStr = getTodayDateString();
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "month") {
      setStartDate(getStartOfMonthDateString());
      setEndDate(getEndOfMonthDateString());
    }
    setCurrentPage(1);
  };

  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      if (startDate) {
        const itemDate = item.soldDate.slice(0, 10);
        if (itemDate < startDate) return false;
      }
      if (endDate) {
        const itemDate = item.soldDate.slice(0, 10);
        if (itemDate > endDate) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchReceipt = item.receiptNo.toLowerCase().includes(q);
        const matchCustomer = item.customerName.toLowerCase().includes(q);
        const matchVin = item.vehicle.vin.toLowerCase().includes(q);
        const matchModel = `${item.vehicle.brand} ${item.vehicle.model}`.toLowerCase().includes(q);
        if (!matchReceipt && !matchCustomer && !matchVin && !matchModel) return false;
      }
      return true;
    });
  }, [sales, startDate, endDate, searchQuery]);

  const totalRevenue = useMemo(() => filteredSales.reduce((s, i) => s + (i.soldPrice || 0), 0), [filteredSales]);
  const totalLandedCost = useMemo(() => filteredSales.reduce((s, i) => s + (i.totalLandedCost || 0), 0), [filteredSales]);
  const totalGrossProfit = useMemo(() => filteredSales.reduce((s, i) => s + (i.grossProfit || 0), 0), [filteredSales]);

  const handleExportCsv = () => {
    const headers = [
      "Receipt No",
      "Sold Date",
      "Customer",
      "Phone",
      "Vehicle",
      "VIN",
      "Sold Price ($)",
      "Total Landed Cost ($)",
      "Gross Profit ($)",
      "Margin (%)",
      "Loan Type",
      "Seller",
    ];

    const rows = filteredSales.map((item) => [
      item.receiptNo,
      item.soldDate ? item.soldDate.slice(0, 10) : "",
      item.customerName,
      item.customerPhone || "",
      `${item.vehicle.brand} ${item.vehicle.model} (${item.vehicle.madeYear || ""})`,
      item.vehicle.vin,
      item.soldPrice,
      item.totalLandedCost,
      item.grossProfit,
      item.marginPercent.toFixed(2),
      item.loanType,
      item.sellerName || "",
    ]);

    exportToCsv("CSM_Sales_Report", headers, rows);
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-12">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-800 transition-colors">
          ផ្ទាំងគ្រប់គ្រង (Dashboard)
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-400">របាយការណ៍ (Reports)</span>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-800 font-medium">របាយការណ៍លក់ (Sales Reports)</span>
      </div>

      {/* 2. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#1c3d73] to-[#2563eb] text-white flex items-center justify-center shadow-md shadow-blue-900/10">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              របាយការណ៍លក់រថយន្ត (Sales Reports)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              តាមដានចំណូលលក់ តម្លៃដើមសរុប (Landed Cost) និងប្រាក់ចំណេញដុល (Gross Profit)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSalesData(true)}
            disabled={refreshing || loading}
            className="h-9 px-3 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredSales.length === 0}
            className="h-9 px-3.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Excel (CSV)
          </Button>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5 items-end">
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
                className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-slate-200 text-slate-800 text-xs h-9.5 rounded-xl"
              />
            </div>

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
                className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-slate-200 text-slate-800 text-xs h-9.5 rounded-xl"
              />
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-[#1c3d73]" />
                <span>ស្វែងរក (Search Keyword)</span>
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="ស្វែងរកតាម VIN, រថយន្ត, វិក្កយបត្រ, អតិថិជន..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-slate-200 text-slate-800 text-xs h-9.5 pl-8 rounded-xl"
                />
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block">ជម្រើសកាលបរិច្ឆេទ</label>
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => handleDatePreset("all")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    datePreset === "all" ? "bg-[#1c3d73] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset("month")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    datePreset === "month" ? "bg-[#1c3d73] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset("today")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    datePreset === "today" ? "bg-[#1c3d73] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Today
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1c3d73]" />
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                រថយន្តបានលក់ (Cars Sold)
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1c3d73] flex items-center justify-center">
                <Car className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {filteredSales.length} <span className="text-xs font-sans font-medium text-slate-500">គ្រឿង</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ចំនួនរថយន្តបានលក់ក្នុងរយៈពេលនេះ</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ចំណូលសរុប (Total Revenue)
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-emerald-600">
              ${totalRevenue.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">តម្លៃលក់សរុបទាំងអស់ (Gross Revenue)</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ថ្លៃដើមសរុប (Total Landed Cost)
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Truck className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-rose-600">
              ${totalLandedCost.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ថ្លៃទិញចូល + ពន្ធ + ដឹកជញ្ជូន + ជួសជុល</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ចំណេញដុល (Gross Profit)
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-blue-600">
              ${totalGrossProfit.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ចំណូលដកថ្លៃដើមសរុប</p>
          </CardContent>
        </Card>
      </div>

      {/* 5. Data Table */}
      <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px] whitespace-nowrap">
            <thead className="bg-[#0f172a] text-white uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Receipt No</th>
                <th className="px-4 py-3.5">Sold Date</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Vehicle</th>
                <th className="px-4 py-3.5">VIN</th>
                <th className="px-4 py-3.5 text-right">Sold Price</th>
                <th className="px-4 py-3.5 text-right">Landed Cost</th>
                <th className="px-4 py-3.5 text-right">Gross Profit</th>
                <th className="px-4 py-3.5 text-right">Margin</th>
                <th className="px-4 py-3.5 text-center">Loan Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#1c3d73]">{item.receiptNo}</td>
                    <td className="px-4 py-3 text-slate-600">{item.soldDate ? item.soldDate.slice(0, 10) : "-"}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{item.customerName}</div>
                      {item.customerPhone && <div className="text-[11px] text-slate-400 font-mono">{item.customerPhone}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-12 rounded overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                          {item.vehicle.coverImageUrl ? (
                            <img
                              src={item.vehicle.coverImageUrl}
                              alt={item.vehicle.model}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Car className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{item.vehicle.brand} {item.vehicle.model}</div>
                          {item.vehicle.madeYear && (
                            <div className="text-[10px] text-slate-400 font-mono">Year {item.vehicle.madeYear}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{item.vehicle.vin}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                      ${item.soldPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-600">
                      ${item.totalLandedCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-emerald-600">
                      ${item.grossProfit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-blue-600 font-medium">
                      {item.marginPercent.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant="outline"
                        className={`rounded-lg px-2 py-0.5 font-semibold text-[10px] ${
                          item.loanType === "FULL_PAYMENT"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                        }`}
                      >
                        {item.loanType === "FULL_PAYMENT" ? "បង់ដាច់ (Full)" : "បង់រំលស់ (Loan)"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              {filteredSales.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">មិនមានទិន្នន័យការលក់ឡើយ (No sales records found)</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredSales.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredSales.length}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>
    </div>
  );
}
