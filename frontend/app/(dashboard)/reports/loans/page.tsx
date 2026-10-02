"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  CreditCard,
  Download,
  Search,
  RefreshCw,
  ChevronRight,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/table-pagination";
import { salesService, CustomerPaymentRecord } from "@/lib/api";
import { exportToCsv } from "@/lib/export-csv";

export default function LoansReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 font-sans">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-[#1c3d73]" />
          <p className="text-sm font-medium">កំពុងផ្ទុកទិន្នន័យ (Loading Loans Report)...</p>
        </div>
      }
    >
      <LoansReportContent />
    </Suspense>
  );
}

function LoansReportContent() {
  const [loans, setLoans] = useState<CustomerPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await salesService.getLoans();
      setLoans(data || []);
    } catch (err) {
      console.error("Failed to load loans report:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return loans.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const codeMatch = (item.loanCode || "").toLowerCase().includes(q);
        const receiptMatch = (item.receiptNo || "").toLowerCase().includes(q);
        const nameMatch = (item.customerName || "").toLowerCase().includes(q);
        const phoneMatch = (item.customerPhone || "").toLowerCase().includes(q);
        const carMatch = `${item.brand || ""} ${item.model || ""} ${item.vin || ""}`.toLowerCase().includes(q);
        if (!codeMatch && !receiptMatch && !nameMatch && !phoneMatch && !carMatch) return false;
      }
      return true;
    });
  }, [loans, searchQuery]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "Loan Code",
      "Receipt No",
      "Customer",
      "Phone",
      "Car (VIN)",
      "Sold Price ($)",
      "Total Due ($)",
      "Total Paid ($)",
      "Balance ($)",
      "Monthly Pay ($)",
    ];
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
  };

  const paginatedLoans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLoans.slice(start, start + pageSize);
  }, [filteredLoans, currentPage, pageSize]);

  // KPIs
  const totalPaidAmount = useMemo(
    () => filteredLoans.reduce((s, i) => s + (Number(i.totalPaid) || 0), 0),
    [filteredLoans]
  );
  const totalBalanceAmount = useMemo(
    () => filteredLoans.reduce((s, i) => s + (Number(i.balance) || 0), 0),
    [filteredLoans]
  );
  const totalDueAmount = useMemo(
    () => filteredLoans.reduce((s, i) => s + (Number(i.totalDue) || 0), 0),
    [filteredLoans]
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
            <span className="text-[#1c3d73] font-semibold">របាយការណ៍បង់រំលស់ (Loan Repayments)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1c3d73] flex items-center justify-center shadow-xs">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                របាយការណ៍បង់រំលស់ (Loan Repayments)
              </h1>
              <p className="text-xs text-slate-500">
                តាមដានកិច្ចសន្យាកម្ចីអតិថិជន ប្រាក់ដែលបានប្រមូលរួច និងប្រាក់កម្ចីនៅសល់
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
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-[#1c3d73]" />
              <span>ស្វែងរកកិច្ចសន្យា ឬអតិថិជន (Search Loan, Customer, VIN)</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="ស្វែងរកតាមលេខកូដកម្ចី, វិក្កយបត្រ, ឈ្មោះអតិថិជន, លេខទូរស័ព្ទ, ឡាន, លេខ VIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-slate-200 text-slate-800 text-xs h-9.5 rounded-xl focus-visible:ring-2 focus-visible:ring-[#1c3d73]/20 focus-visible:border-[#1c3d73] transition-all"
              />
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
                កិច្ចសន្យាកម្ចី (Loan Accounts)
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1c3d73] flex items-center justify-center">
                <UserCheck className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-slate-900">
              {filteredLoans.length}{" "}
              <span className="text-xs font-sans font-medium text-slate-500">កិច្ចសន្យា</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              តម្លៃដើមត្រូវទារសរុប ${totalDueAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ប្រមូលបានសរុប (Collected Amount)
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-emerald-600">
              ${totalPaidAmount.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ទឹកប្រាក់ដែលបានបង់រួចរាល់ពីអតិថិជន</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <CardHeader className="p-4 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ប្រាក់កម្ចីនៅសល់ (Remaining Loan Balance)
              </CardTitle>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <CreditCard className="h-3.5 w-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-bold font-mono text-amber-600">
              ${totalBalanceAmount.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">ប្រាក់ជំពាក់ត្រូវបង់បន្តតាមកាលវិភាគ</p>
          </CardContent>
        </Card>
      </div>

      {/* ── 4. Main Data Table ── */}
      <Card className="bg-white border-slate-200/80 shadow-xs overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px] whitespace-nowrap">
            <thead className="bg-[#0f172a] text-white uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Loan Code</th>
                <th className="px-4 py-3.5">Receipt No</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Car / VIN</th>
                <th className="px-4 py-3.5 text-right">Sold Price ($)</th>
                <th className="px-4 py-3.5 text-right">Total Due ($)</th>
                <th className="px-4 py-3.5 text-right">Total Paid ($)</th>
                <th className="px-4 py-3.5 text-right">Balance ($)</th>
                <th className="px-4 py-3.5 text-right">Monthly Pay ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLoans.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-[#1c3d73] font-semibold">{item.loanCode}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono">{item.receiptNo}</td>
                  <td className="px-4 py-3 text-slate-900 font-semibold">
                    <div>{item.customerName}</div>
                    {item.customerPhone && (
                      <div className="text-[11px] font-normal text-slate-500">{item.customerPhone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="font-medium">{item.brand} {item.model}</div>
                    <div className="text-[11px] font-mono text-slate-400">{item.vin}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                    ${(Number(item.soldPrice) || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                    ${(Number(item.totalDue) || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-emerald-600">
                    ${(Number(item.totalPaid) || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-amber-600">
                    ${(Number(item.balance) || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-[#1c3d73] font-semibold">
                    ${(Number(item.monthlyPay) || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredLoans.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">មិនមានទិន្នន័យកម្ចី/ការបង់ប្រាក់ស្របតាមការស្វែងរកឡើយ (No loans found)</p>
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
          totalItems={filteredLoans.length}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
