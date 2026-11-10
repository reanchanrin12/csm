"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
  Layers,
  BarChart3,
  ListFilter,
  CheckCircle2,
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL query params: ?type=car|tuktuk|all & ?view=details|summary
  const paramType = searchParams.get("type"); // "car" | "tuktuk" | null
  const paramView = searchParams.get("view"); // "details" | "summary" | null

  const [sales, setSales] = useState<SaleOrderReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Category & View Mode
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<"ALL" | "CAR" | "TUKTUK">("ALL");
  const [activeView, setActiveView] = useState<"details" | "summary">("details");

  useEffect(() => {
    if (paramType === "tuktuk") {
      setVehicleTypeFilter("TUKTUK");
    } else if (paramType === "car") {
      setVehicleTypeFilter("CAR");
    } else {
      setVehicleTypeFilter("ALL");
    }

    if (paramView === "summary") {
      setActiveView("summary");
    } else {
      setActiveView("details");
    }
  }, [paramType, paramView]);

  // Date & Search Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [datePreset, setDatePreset] = useState<"all" | "month" | "today">("all");

  // Pagination for Details view
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

  // Helper to distinguish Tuk Tuk vs Car based on brand or model keywords
  const isTukTuk = (item: SaleOrderReportItem) => {
    const brand = (item.vehicle.brand || "").toLowerCase();
    const model = (item.vehicle.model || "").toLowerCase();
    return (
      brand.includes("tuk") ||
      model.includes("tuk") ||
      model.includes("e17") ||
      model.includes("tricycle") ||
      model.includes("kang") ||
      model.includes("golf") ||
      model.includes("cart")
    );
  };

  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      // 1. Vehicle category filter (Car vs Tuk Tuk vs All)
      if (vehicleTypeFilter === "CAR" && isTukTuk(item)) {
        return false;
      }
      if (vehicleTypeFilter === "TUKTUK" && !isTukTuk(item)) {
        return false;
      }

      // 2. Date filters
      if (startDate) {
        const itemDate = item.soldDate.slice(0, 10);
        if (itemDate < startDate) return false;
      }
      if (endDate) {
        const itemDate = item.soldDate.slice(0, 10);
        if (itemDate > endDate) return false;
      }

      // 3. Search query
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
  }, [sales, vehicleTypeFilter, startDate, endDate, searchQuery]);

  const totalRevenue = useMemo(() => filteredSales.reduce((s, i) => s + (i.soldPrice || 0), 0), [filteredSales]);
  const totalLandedCost = useMemo(() => filteredSales.reduce((s, i) => s + (i.totalLandedCost || 0), 0), [filteredSales]);
  const totalGrossProfit = useMemo(() => filteredSales.reduce((s, i) => s + (i.grossProfit || 0), 0), [filteredSales]);
  const avgMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  // Monthly summary aggregation
  const monthlySummary = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number; cost: number; profit: number }>();
    filteredSales.forEach((s) => {
      const month = s.soldDate ? s.soldDate.slice(0, 7) : "Unknown";
      const existing = map.get(month) || { count: 0, revenue: 0, cost: 0, profit: 0 };
      map.set(month, {
        count: existing.count + 1,
        revenue: existing.revenue + (s.soldPrice || 0),
        cost: existing.cost + (s.totalLandedCost || 0),
        profit: existing.profit + (s.grossProfit || 0),
      });
    });
    return Array.from(map.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [filteredSales]);

  // Model breakdown aggregation
  const modelSummary = useMemo(() => {
    const map = new Map<string, { brand: string; model: string; count: number; revenue: number; cost: number; profit: number }>();
    filteredSales.forEach((s) => {
      const key = `${s.vehicle.brand} ${s.vehicle.model}`.trim();
      const existing = map.get(key) || { brand: s.vehicle.brand, model: s.vehicle.model, count: 0, revenue: 0, cost: 0, profit: 0 };
      map.set(key, {
        brand: s.vehicle.brand,
        model: s.vehicle.model,
        count: existing.count + 1,
        revenue: existing.revenue + (s.soldPrice || 0),
        cost: existing.cost + (s.totalLandedCost || 0),
        profit: existing.profit + (s.grossProfit || 0),
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredSales]);

  const handleExportCsv = () => {
    if (activeView === "summary") {
      const headers = ["Month", "Units Sold", "Total Revenue ($)", "Total Landed Cost ($)", "Gross Profit ($)", "Profit/Unit ($)"];
      const rows = monthlySummary.map((m) => [
        m.month,
        m.count,
        m.revenue,
        m.cost,
        m.profit,
        m.count > 0 ? (m.profit / m.count).toFixed(2) : "0",
      ]);
      exportToCsv(`CSM_Sales_Summary_${vehicleTypeFilter}`, headers, rows);
    } else {
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
      exportToCsv(`CSM_Sales_Details_${vehicleTypeFilter}`, headers, rows);
    }
  };

  const getPageTitle = () => {
    if (vehicleTypeFilter === "CAR") {
      return activeView === "summary"
        ? "Car Sale Summary (របាយការណ៍សង្ខេបលក់រថយន្ត)"
        : "Car Sale Details (របាយការណ៍លម្អិតលក់រថយន្ត)";
    }
    if (vehicleTypeFilter === "TUKTUK") {
      return activeView === "summary"
        ? "Tuk Tuk Sale Summary (របាយការណ៍សង្ខេបលក់តុកតុក/កង់បី)"
        : "Tuk Tuk Sale Details (របាយការណ៍លម្អិតលក់តុកតុក/កង់បី)";
    }
    return activeView === "summary"
      ? "Sales Summary Report (របាយការណ៍សង្ខេបការលក់សរុប)"
      : "Sales Details Report (របាយការណ៍លម្អិតការលក់សរុប)";
  };

  const changeTab = (type: "ALL" | "CAR" | "TUKTUK", view: "details" | "summary") => {
    setVehicleTypeFilter(type);
    setActiveView(view);
    const typeParam = type === "ALL" ? "" : `type=${type.toLowerCase()}&`;
    router.push(`/reports/sales?${typeParam}view=${view}`);
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-12">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-800 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <Link href="/reports/sales" className="hover:text-slate-800 transition-colors">
          Reports
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-800 font-medium">
          {vehicleTypeFilter === "CAR"
            ? "Car Sales"
            : vehicleTypeFilter === "TUKTUK"
            ? "Tuk Tuk Sales"
            : "All Sales"}{" "}
          &gt; {activeView === "summary" ? "Sale summary" : "Sale details"}
        </span>
      </div>

      {/* 2. Top Header & Fast Switch Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#1c3d73] to-[#2563eb] text-white flex items-center justify-center shadow-md shadow-blue-900/10">
            {vehicleTypeFilter === "TUKTUK" ? (
              <Truck className="h-6 w-6" />
            ) : (
              <Car className="h-6 w-6" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {getPageTitle()}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              តាមដានចំណូលលក់ តម្លៃដើមសរុប (Landed Cost) និងប្រាក់ចំណេញដុល (Gross Profit)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSalesData(true)}
            disabled={refreshing || loading}
            className="h-9 px-3 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredSales.length === 0}
            className="h-9 px-3.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* 3. Category & View Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/80 p-2 rounded-2xl border border-slate-200/60">
        {/* Category Tabs: Car vs Tuk Tuk vs All */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => changeTab("CAR", activeView)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              vehicleTypeFilter === "CAR"
                ? "bg-[#1c3d73] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            <span>🚗 Car Sales</span>
          </button>

          <button
            type="button"
            onClick={() => changeTab("TUKTUK", activeView)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              vehicleTypeFilter === "TUKTUK"
                ? "bg-[#1c3d73] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>🛺 Tuk Tuk Sales</span>
          </button>

          <button
            type="button"
            onClick={() => changeTab("ALL", activeView)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              vehicleTypeFilter === "ALL"
                ? "bg-[#1c3d73] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Sales</span>
          </button>
        </div>

        {/* View Mode Tabs: Sale details vs Sale summary */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => changeTab(vehicleTypeFilter, "details")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeView === "details"
                ? "bg-blue-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            <span>Sale details (លម្អិត)</span>
          </button>

          <button
            type="button"
            onClick={() => changeTab(vehicleTypeFilter, "summary")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeView === "summary"
                ? "bg-blue-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Sale summary (សង្ខេប)</span>
          </button>
        </div>
      </div>

      {/* 4. Filter Bar */}
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
                  placeholder="ស្វែងរកតាម VIN, យានយន្ត, វិក្កយបត្រ, អតិថិជន..."
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
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    datePreset === "all" ? "bg-[#1c3d73] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset("month")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    datePreset === "month" ? "bg-[#1c3d73] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset("today")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
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

      {/* 5. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1c3d73]" />
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ចំនួនលក់ (Units Sold)
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1c3d73] flex items-center justify-center">
                {vehicleTypeFilter === "TUKTUK" ? <Truck className="h-3.5 w-3.5" /> : <Car className="h-3.5 w-3.5" />}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {filteredSales.length} <span className="text-xs font-sans font-medium text-slate-500">គ្រឿង</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ចំនួន{vehicleTypeFilter === "TUKTUK" ? "តុកតុក/កង់បី" : "រថយន្ត"}បានលក់
            </p>
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
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              ${totalLandedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              ${totalGrossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Margin: <span className="font-semibold text-blue-700">{avgMargin.toFixed(1)}%</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 6. View Mode Content: SALE DETAILS vs SALE SUMMARY */}
      {activeView === "summary" ? (
        /* ── SUMMARY VIEW (សង្ខេប) ── */
        <div className="space-y-5">
          {/* A. Monthly Breakdown Table */}
          <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="p-4.5 bg-slate-50/70 border-b border-slate-200/80">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#1c3d73]" />
                <span>សង្ខេបតាមខែ (Monthly Sales Summary)</span>
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#0f172a] text-white uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">ខែ (Month)</th>
                    <th className="px-4 py-3 text-center">ចំនួនលក់ (Units)</th>
                    <th className="px-4 py-3 text-right">ចំណូលសរុប (Revenue)</th>
                    <th className="px-4 py-3 text-right">ថ្លៃដើមសរុប (Landed Cost)</th>
                    <th className="px-4 py-3 text-right">ចំណេញដុល (Gross Profit)</th>
                    <th className="px-4 py-3 text-right">ចំណេញមធ្យម/គ្រឿង (Avg/Unit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlySummary.map((m) => {
                    const avgPerUnit = m.count > 0 ? m.profit / m.count : 0;
                    return (
                      <tr key={m.month} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-bold text-[#1c3d73]">{m.month}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                          {m.count}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                          ${m.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-600">
                          ${m.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-emerald-600">
                          ${m.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-blue-600">
                          ${avgPerUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                  {monthlySummary.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        មិនមានទិន្នន័យសង្ខេបសម្រាប់រយៈពេលនេះទេ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* B. Model / Brand Breakdown Table */}
          <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="p-4.5 bg-slate-50/70 border-b border-slate-200/80">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#1c3d73]" />
                <span>សង្ខេបតាមម៉ាក និងម៉ូដែល (Model & Brand Breakdown)</span>
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#0f172a] text-white uppercase text-[11px] font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">ម៉ាក (Brand)</th>
                    <th className="px-4 py-3">ម៉ូដែល (Model)</th>
                    <th className="px-4 py-3 text-center">ចំនួនលក់ (Units)</th>
                    <th className="px-4 py-3 text-right">ចំណូលសរុប (Revenue)</th>
                    <th className="px-4 py-3 text-right">ថ្លៃដើមសរុប (Cost)</th>
                    <th className="px-4 py-3 text-right">ចំណេញដុល (Gross Profit)</th>
                    <th className="px-4 py-3 text-right">Margin (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modelSummary.map((m, idx) => {
                    const margin = m.revenue > 0 ? (m.profit / m.revenue) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900 uppercase">{m.brand}</td>
                        <td className="px-4 py-3 font-medium text-slate-700 uppercase">{m.model}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">{m.count}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900">
                          ${m.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-600">
                          ${m.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-emerald-600">
                          ${m.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-blue-600 font-semibold">
                          {margin.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                  {modelSummary.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                        មិនមានទិន្នន័យម៉ូដែលឡើយ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        /* ── DETAILS VIEW (លម្អិត) ── */
        <Card className="bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px] whitespace-nowrap">
              <thead className="bg-[#0f172a] text-white uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 w-12">#No</th>
                  <th className="px-4 py-3.5">Receipt No</th>
                  <th className="px-4 py-3.5">Sold Date</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">
                    {vehicleTypeFilter === "TUKTUK" ? "Tuk Tuk" : "Vehicle"}
                  </th>
                  <th className="px-4 py-3.5">VIN / Chassis</th>
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
                  .map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-bold">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#1c3d73]">
                        <Link href={`/sales/${item.id}`} className="hover:underline">
                          {item.receiptNo}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.soldDate ? item.soldDate.slice(0, 10) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{item.customerName}</div>
                        {item.customerPhone && (
                          <div className="text-[11px] text-slate-400 font-mono">{item.customerPhone}</div>
                        )}
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
                            ) : vehicleTypeFilter === "TUKTUK" ? (
                              <Truck className="h-4 w-4 text-slate-400" />
                            ) : (
                              <Car className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {item.vehicle.brand} {item.vehicle.model}
                            </div>
                            {item.vehicle.madeYear && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                Year {item.vehicle.madeYear}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px] uppercase">
                        {item.vehicle.vin}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                        ${item.soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-rose-600">
                        ${item.totalLandedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-emerald-600">
                        ${item.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium">
                        មិនមានទិន្នន័យការលក់ {vehicleTypeFilter === "TUKTUK" ? "តុកតុក/កង់បី" : "រថយន្ត"} ឡើយ
                      </p>
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
      )}
    </div>
  );
}
