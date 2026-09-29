"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileText,
  Download,
  Calendar,
  Search,
  DollarSign,
  TrendingUp,
  Package,
  Truck,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  salesService,
  expenseService,
  vehicleService,
  costService,
  CustomerPaymentRecord,
} from "@/lib/api";
import type { OperatingExpenseItem } from "@csm/contracts";
import { exportToCsv } from "@/lib/export-csv";

// ── Types ─────────────────────────────────────────────────────────────
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
  customerPhone?: string | null | undefined;
  sellerName?: string | null | undefined;
  vehicle: {
    vin: string;
    brand: string;
    model: string;
    madeYear?: number | null | undefined;
    branch?: string | null | undefined;
  };
}

type ExpenseReportItem = OperatingExpenseItem;

interface VehicleReportItem {
  id: string;
  vin: string;
  brand: string;
  model: string;
  madeYear?: number | null | undefined;
  exteriorColor?: string | null | undefined;
  purchasePrice?: number | null | undefined;
  purchaseCost?: number | null | undefined;
  totalLandedCost?: number | null | undefined;
  status: string;
  branchName?: string | null | undefined;
  currentBranch?: { name: string } | null | undefined;
  purchaseDate?: string | null | undefined;
  supplierName?: string | null | undefined;
  supplier?: { nameEn: string } | null | undefined;
}

interface CostBillReportItem {
  id: string;
  billNumber?: string | null | undefined;
  invoiceNo?: string | null | undefined;
  category: string;
  billDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status?: string | null | undefined;
  supplierName?: string | null | undefined;
  supplier?: { nameEn: string } | null | undefined;
  vehicles?: { vin: string; brand?: string | null | undefined; model?: string | null | undefined }[] | null | undefined;
  vehicle?: { vin: string; brand?: string | null | undefined; model?: string | null | undefined } | null | undefined;
}

function ReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const activeTab = searchParams.get("tab") || "sales";
  const activeView = searchParams.get("view") || "details";
  const categoryParam = searchParams.get("category") || "ALL";

  // Filter state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);

  // Pagination state (10 per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Data state
  const [loading, setLoading] = useState<boolean>(true);
  const [salesData, setSalesData] = useState<SaleOrderReportItem[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseReportItem[]>([]);
  const [vehicleData, setVehicleData] = useState<VehicleReportItem[]>([]);
  const [costBillsData, setCostBillsData] = useState<CostBillReportItem[]>([]);
  const [loansData, setLoansData] = useState<CustomerPaymentRecord[]>([]);

  // Update category when URL category changes
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, activeView, selectedCategory, startDate, endDate, searchQuery]);

  // Load Report Data
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "sales") {
        const sales = await salesService.list();
        setSalesData((sales as SaleOrderReportItem[]) || []);
      } else if (activeTab === "expenses") {
        const res = await expenseService.list();
        setExpenseData(res?.expenses || []);
      } else if (activeTab === "inventory") {
        const vehicles = await vehicleService.list();
        setVehicleData((vehicles as unknown as VehicleReportItem[]) || []);
      } else if (activeTab === "logistics") {
        const bills = await costService.getBills(
          selectedCategory !== "ALL" ? selectedCategory : undefined
        );
        setCostBillsData((bills as unknown as CostBillReportItem[]) || []);
      } else if (activeTab === "loans") {
        const loans = await salesService.getLoans();
        setLoansData(loans || []);
      }
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedCategory]);

  // Switch Tab
  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (tab === "sales") params.set("view", "details");
    else if (tab === "expenses") params.set("view", "details");
    else if (tab === "inventory") params.set("view", "stock");
    else if (tab === "logistics") params.set("category", "ALL");
    else if (tab === "loans") params.set("view", "arrears");
    router.push(`/reports?${params.toString()}`);
  };

  // Preset Date Filter Helpers
  const handlePresetDate = (type: "today" | "this_month" | "all") => {
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

  // ── FILTERED DATA CALCULATIONS ──────────────────────────────────────

  // 1. Sales Filtered
  const filteredSales = useMemo(() => {
    return salesData.filter((item) => {
      const itemDate = item.soldDate ? item.soldDate.slice(0, 10) : "";
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchReceipt = item.receiptNo?.toLowerCase().includes(q);
        const matchCust = item.customerName?.toLowerCase().includes(q);
        const matchVin = item.vehicle?.vin?.toLowerCase().includes(q);
        const matchBrand = item.vehicle?.brand?.toLowerCase().includes(q);
        const matchModel = item.vehicle?.model?.toLowerCase().includes(q);
        if (!matchReceipt && !matchCust && !matchVin && !matchBrand && !matchModel)
          return false;
      }
      return true;
    });
  }, [salesData, startDate, endDate, searchQuery]);

  // 2. Expenses Filtered
  const filteredExpenses = useMemo(() => {
    return expenseData.filter((item) => {
      const itemDate = item.expenseDate ? item.expenseDate.slice(0, 10) : "";
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTo = item.expenseTo?.toLowerCase().includes(q);
        const matchDetail = item.details?.toLowerCase().includes(q);
        if (!matchTo && !matchDetail) return false;
      }
      return true;
    });
  }, [expenseData, startDate, endDate, searchQuery]);

  // 3. Inventory Filtered
  const filteredInventory = useMemo(() => {
    return vehicleData.filter((item) => {
      if (activeView === "stock" && item.status !== "AVAILABLE" && item.status !== "REPAIRING") {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchVin = item.vin?.toLowerCase().includes(q);
        const matchBrand = item.brand?.toLowerCase().includes(q);
        const matchModel = item.model?.toLowerCase().includes(q);
        if (!matchVin && !matchBrand && !matchModel) return false;
      }
      return true;
    });
  }, [vehicleData, activeView, searchQuery]);

  // 4. Logistics & Costs Filtered
  const filteredCosts = useMemo(() => {
    return costBillsData.filter((item) => {
      const itemDate = item.billDate ? item.billDate.slice(0, 10) : "";
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchInv = (item.billNumber || item.invoiceNo)?.toLowerCase().includes(q);
        const matchSupp = (item.supplierName || item.supplier?.nameEn)?.toLowerCase().includes(q);
        const matchVin = (item.vehicles?.[0]?.vin || item.vehicle?.vin)?.toLowerCase().includes(q);
        if (!matchInv && !matchSupp && !matchVin) return false;
      }
      return true;
    });
  }, [costBillsData, startDate, endDate, selectedCategory, searchQuery]);

  // 5. Loans Filtered
  const filteredLoans = useMemo(() => {
    return loansData.filter((item) => {
      if (activeView === "arrears") {
        if (item.balance <= 0) return false;
      } else if (activeView === "bank") {
        if (item.loanType !== "BANK_LOAN") return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchCust = item.customerName?.toLowerCase().includes(q);
        const matchCode = item.loanCode?.toLowerCase().includes(q);
        const matchVin = item.vin?.toLowerCase().includes(q);
        if (!matchCust && !matchCode && !matchVin) return false;
      }
      return true;
    });
  }, [loansData, activeView, searchQuery]);

  // ── CSV EXPORT HANDLERS ─────────────────────────────────────────────
  const handleExport = () => {
    if (activeTab === "sales") {
      const headers = [
        "Receipt No",
        "Sold Date",
        "Customer",
        "Phone",
        "Vehicle",
        "VIN",
        "Sold Price ($)",
        "Purchase Cost ($)",
        "Landed Cost ($)",
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
        `${item.vehicle.brand} ${item.vehicle.model} ${item.vehicle.madeYear || ""}`,
        item.vehicle.vin,
        item.soldPrice,
        item.purchaseCost,
        item.totalLandedCost,
        item.grossProfit,
        `${item.marginPercent}%`,
        item.loanType,
        item.sellerName || "",
      ]);
      exportToCsv("Sales_Report", headers, rows);
    } else if (activeTab === "expenses") {
      const headers = ["Expense Date", "Expense To", "Amount ($)", "Details / Note"];
      const rows = filteredExpenses.map((item) => [
        item.expenseDate ? item.expenseDate.slice(0, 10) : "",
        item.expenseTo,
        item.amount,
        item.details || "",
      ]);
      exportToCsv("Expenses_Report", headers, rows);
    } else if (activeTab === "inventory") {
      const headers = ["VIN", "Brand", "Model", "Year", "Color", "Purchase Price ($)", "Status", "Branch"];
      const rows = filteredInventory.map((item) => [
        item.vin,
        item.brand,
        item.model,
        item.madeYear || "",
        item.exteriorColor || "",
        item.purchaseCost ?? item.purchasePrice ?? 0,
        item.status,
        item.branchName || item.currentBranch?.name || "",
      ]);
      exportToCsv("Inventory_Report", headers, rows);
    } else if (activeTab === "logistics") {
      const headers = ["Invoice No", "Category", "Bill Date", "Supplier", "Total ($)", "Paid ($)", "Balance ($)", "Status", "Vehicle VIN"];
      const rows = filteredCosts.map((item) => [
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
    } else if (activeTab === "loans") {
      const headers = ["Loan Code", "Receipt No", "Customer", "Phone", "Car (VIN)", "Sold Price ($)", "Total Due ($)", "Total Paid ($)", "Balance ($)", "Monthly Pay ($)"];
      const rows = filteredLoans.map((item) => [
        item.loanCode,
        item.receiptNo,
        item.customerName,
        item.customerPhone || "",
        `${item.brand} ${item.model} (${item.vin})`,
        item.soldPrice,
        item.totalDue,
        item.totalPaid,
        item.balance,
        item.monthlyPay,
      ]);
      exportToCsv("Loans_Repayment_Report", headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-sky-400" />
            CSM Reports Hub (របាយការណ៍សរុប)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            សេចក្តីសង្ខេបរបាយការណ៍លក់ ចំណាយ ស្តុក ការដឹកជញ្ជូន និងការបង់ប្រាក់
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={handleExport}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export Excel (CSV)
          </Button>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-[#0b1329] border border-slate-800 p-1 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="sales" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Sales Reports
          </TabsTrigger>
          <TabsTrigger value="expenses" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <DollarSign className="h-4 w-4 mr-1.5" />
            Expense Reports
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <Package className="h-4 w-4 mr-1.5" />
            Stock / Purchased
          </TabsTrigger>
          <TabsTrigger value="logistics" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <Truck className="h-4 w-4 mr-1.5" />
            Logistics & Costs
          </TabsTrigger>
          <TabsTrigger value="loans" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <CreditCard className="h-4 w-4 mr-1.5" />
            Loan Repayments
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── Filter Bar ── */}
      <Card className="bg-[#0b1329] border-slate-800">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 items-end">
            {/* Date From */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Date From (ចាប់ពីថ្ងៃ)
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-[#060b17] border-slate-700 text-white text-xs h-9"
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Date To (ដល់ថ្ងៃ)
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-[#060b17] border-slate-700 text-white text-xs h-9"
                />
              </div>
            </div>

            {/* Category / Sub-filter */}
            {activeTab === "logistics" && (
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Cost Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#060b17] border border-slate-700 rounded px-2 text-xs text-white h-9"
                >
                  <option value="ALL">All Categories</option>
                  <option value="TRANSPORT">Shipping (TRANSPORT)</option>
                  <option value="TAX">Tax</option>
                  <option value="CLEARANCE">Clearance</option>
                  <option value="REPAIR">Repair</option>
                  <option value="CONTAINER">Container</option>
                  <option value="LABOR">Labor</option>
                </select>
              </div>
            )}

            {/* Search Input */}
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Search Keyword
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="ស្វែងរកតាម VIN, អតិថិជន, វិក្កយបត្រ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-[#060b17] border-slate-700 text-white text-xs h-9"
                />
              </div>
            </div>

            {/* Date Preset Buttons */}
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetDate("all")}
                className="h-9 text-xs px-2.5 border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
              >
                All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetDate("this_month")}
                className="h-9 text-xs px-2.5 border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
              >
                This Month
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetDate("today")}
                className="h-9 text-xs px-2.5 border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
              >
                Today
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Summary Cards ── */}
      {activeTab === "sales" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#0b1329] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Total Cars Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{filteredSales.length} គ្រឿង</div>
            </CardContent>
          </Card>
          <Card className="bg-[#0b1329] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Total Revenue (ចំណូលសរុប)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                ${filteredSales.reduce((s, i) => s + (i.soldPrice || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0b1329] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Total Landed Cost (ថ្លៃដើមសរុប)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-400">
                ${filteredSales.reduce((s, i) => s + (i.totalLandedCost || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0b1329] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Gross Profit (ប្រាក់ចំណេញដុល)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-400">
                ${filteredSales.reduce((s, i) => s + (i.grossProfit || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "expenses" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-[#0b1329] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Total Expense Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{filteredExpenses.length} ប្រតិបត្តិការ</div>
            </CardContent>
          </Card>
          <Card className="bg-[#0b1329] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Total Operating Expenses (ចំណាយសរុប)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-400">
                ${filteredExpenses.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "inventory" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-[#0b1329] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Total Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{filteredInventory.length} គ្រឿង</div>
            </CardContent>
          </Card>
          <Card className="bg-[#0b1329] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Total Stock Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-400">
                ${filteredInventory.reduce((s, i) => s + (i.purchaseCost ?? i.purchasePrice ?? 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "logistics" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-[#0b1329] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Total Invoiced Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${filteredCosts.reduce((s, i) => s + (i.totalAmount || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0b1329] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Paid Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                ${filteredCosts.reduce((s, i) => s + (i.paidAmount || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0b1329] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">
                ${filteredCosts.reduce((s, i) => s + (i.balance || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "loans" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-[#0b1329] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Total Loan Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{filteredLoans.length} កិច្ចសន្យា</div>
            </CardContent>
          </Card>
          <Card className="bg-[#0b1329] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Collected Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                ${filteredLoans.reduce((s, i) => s + (i.totalPaid || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0b1329] border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">Remaining Loan Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">
                ${filteredLoans.reduce((s, i) => s + (i.balance || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Main Data Table ── */}
      <Card className="bg-[#0b1329] border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === "sales" && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#060b17] text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Sold Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">VIN</th>
                  <th className="px-4 py-3 text-right">Sold Price</th>
                  <th className="px-4 py-3 text-right">Landed Cost</th>
                  <th className="px-4 py-3 text-right">Gross Profit</th>
                  <th className="px-4 py-3 text-center">Margin</th>
                  <th className="px-4 py-3">Loan Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSales
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-medium text-sky-400">{item.receiptNo}</td>
                      <td className="px-4 py-2.5">{item.soldDate ? item.soldDate.slice(0, 10) : "-"}</td>
                      <td className="px-4 py-2.5 text-white">{item.customerName}</td>
                      <td className="px-4 py-2.5">
                        {item.vehicle?.brand} {item.vehicle?.model} {item.vehicle?.madeYear || ""}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">{item.vehicle?.vin}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-400">
                        ${item.soldPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-rose-400">
                        ${item.totalLandedCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-sky-400">
                        ${item.grossProfit.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge variant="outline" className="text-xs border-sky-800 text-sky-300">
                          {item.marginPercent}%
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[11px] text-slate-400">{item.loanType}</span>
                      </td>
                    </tr>
                  ))}
                {filteredSales.length === 0 && !loading && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                      មិនមានទិន្នន័យស្របតាមលក្ខខណ្ឌស្វែងរកឡើយ (No sales found)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === "expenses" && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#060b17] text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Expense Date</th>
                  <th className="px-4 py-3">Expense To (ចំណាយលើ)</th>
                  <th className="px-4 py-3 text-right">Amount ($)</th>
                  <th className="px-4 py-3">Details / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredExpenses
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-medium text-slate-300">
                        {item.expenseDate ? item.expenseDate.slice(0, 10) : "-"}
                      </td>
                      <td className="px-4 py-2.5 text-white font-medium">{item.expenseTo}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-rose-400">
                        ${item.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">{item.details || "-"}</td>
                    </tr>
                  ))}
                {filteredExpenses.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      មិនមានទិន្នន័យចំណាយឡើយ (No expenses found)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === "inventory" && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#060b17] text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">VIN</th>
                  <th className="px-4 py-3">Brand & Model</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Color</th>
                  <th className="px-4 py-3 text-right">Purchase Price</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInventory
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-mono text-sky-400">{item.vin}</td>
                      <td className="px-4 py-2.5 text-white font-medium">
                        {item.brand} {item.model}
                      </td>
                      <td className="px-4 py-2.5">{item.madeYear || "-"}</td>
                      <td className="px-4 py-2.5">{item.exteriorColor || "-"}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-400">
                        ${((item.purchaseCost ?? item.purchasePrice) || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300">
                        {item.branchName || item.currentBranch?.name || "PHNOM PENH"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge
                          variant="outline"
                          className={
                            item.status === "AVAILABLE"
                              ? "border-emerald-700 text-emerald-400"
                              : item.status === "SOLD"
                              ? "border-slate-700 text-slate-400"
                              : "border-amber-700 text-amber-400"
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                {filteredInventory.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      មិនមានទិន្នន័យរថយន្តឡើយ (No vehicles found)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === "logistics" && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#060b17] text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Invoice No</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Bill Date</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Vehicle VIN</th>
                  <th className="px-4 py-3 text-right">Total ($)</th>
                  <th className="px-4 py-3 text-right">Paid ($)</th>
                  <th className="px-4 py-3 text-right">Balance ($)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCosts
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-medium text-sky-400">
                        {item.billNumber || item.invoiceNo || "N/A"}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">{item.billDate ? item.billDate.slice(0, 10) : "-"}</td>
                      <td className="px-4 py-2.5 text-white">{item.supplierName || item.supplier?.nameEn || "-"}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-400 text-[11px]">
                        {item.vehicles?.[0]?.vin || item.vehicle?.vin || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-white">
                        ${(item.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-emerald-400">
                        ${(item.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-amber-400">
                        ${(item.balance || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge
                          variant="outline"
                          className={
                            item.balance <= 0
                              ? "border-emerald-700 text-emerald-400"
                              : "border-amber-700 text-amber-400"
                          }
                        >
                          {item.balance <= 0 ? "PAID" : "UNPAID"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                {filteredCosts.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      មិនមានទិន្នន័យដឹកជញ្ជូន/ចំណាយឡើយ (No logistics records found)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === "loans" && (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#060b17] text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Loan Code</th>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Car / VIN</th>
                  <th className="px-4 py-3 text-right">Sold Price</th>
                  <th className="px-4 py-3 text-right">Total Due</th>
                  <th className="px-4 py-3 text-right">Total Paid</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-right">Monthly Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLoans
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-mono text-sky-400">{item.loanCode}</td>
                      <td className="px-4 py-2.5 text-slate-400">{item.receiptNo}</td>
                      <td className="px-4 py-2.5 text-white font-medium">{item.customerName}</td>
                      <td className="px-4 py-2.5 text-slate-300">
                        {item.brand} {item.model}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-200">
                        ${(item.soldPrice || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-300">
                        ${(item.totalDue || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-400">
                        ${(item.totalPaid || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-amber-400">
                        ${(item.balance || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sky-400">
                        ${(item.monthlyPay || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                {filteredLoans.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      មិនមានទិន្នន័យកម្ចី/ការបង់ប្រាក់ឡើយ (No loan records found)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        <div className="p-3 border-t border-slate-800">
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={
              activeTab === "sales"
                ? filteredSales.length
                : activeTab === "expenses"
                ? filteredExpenses.length
                : activeTab === "inventory"
                ? filteredInventory.length
                : activeTab === "logistics"
                ? filteredCosts.length
                : filteredLoans.length
            }
            onPageChange={setCurrentPage}
          />
        </div>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400">
          កំពុងផ្ទុកទិន្នន័យរបាយការណ៍ (Loading Reports Hub...)...
        </div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
