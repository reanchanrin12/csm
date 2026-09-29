"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  LayoutGrid,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  X,
  RotateCcw,
  FileText,
  DollarSign,
  Calendar,
  Search,
  ExternalLink,
} from "lucide-react";
import { TablePagination } from "@/components/ui/table-pagination";
import { salesService, type CustomerPaymentRecord, type LoanScheduleItem } from "@/lib/api";

export function BankLoanListView() {
  const [records, setRecords] = useState<CustomerPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [codeFilter, setCodeFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Schedule modal
  const [selectedRecord, setSelectedRecord] = useState<CustomerPaymentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payingScheduleId, setPayingScheduleId] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const fetchBankLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesService.getLoans();
      // Cleanly filter strictly for BANK_LOAN items
      const bankLoans = (data || []).filter((r) => r.loanType === "BANK_LOAN");
      setRecords(bankLoans);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load bank loan records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankLoans();
  }, []);

  const handleResetFilters = () => {
    setCodeFilter("");
    setCustomerFilter("");
    setBrandFilter("");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const codeMatch =
        !codeFilter.trim() ||
        r.loanCode.toLowerCase().includes(codeFilter.trim().toLowerCase()) ||
        r.receiptNo.toLowerCase().includes(codeFilter.trim().toLowerCase());

      const customerMatch =
        !customerFilter.trim() ||
        r.customerName.toLowerCase().includes(customerFilter.trim().toLowerCase()) ||
        (r.customerPhone && r.customerPhone.includes(customerFilter.trim()));

      const brandMatch =
        !brandFilter.trim() ||
        r.brand.toLowerCase().includes(brandFilter.trim().toLowerCase()) ||
        r.model.toLowerCase().includes(brandFilter.trim().toLowerCase()) ||
        r.vin.toLowerCase().includes(brandFilter.trim().toLowerCase());

      const isPaid = r.balance <= 0.01;
      const statusMatch =
        statusFilter === "ALL" ||
        (statusFilter === "PAID" && isPaid) ||
        (statusFilter === "PENDING" && !isPaid);

      return codeMatch && customerMatch && brandMatch && statusMatch;
    });
  }, [records, codeFilter, customerFilter, brandFilter, statusFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [codeFilter, customerFilter, brandFilter, statusFilter]);

  // Totals KPI
  const stats = useMemo(() => {
    const totalCount = records.length;
    const totalValue = records.reduce((sum, r) => sum + r.soldPrice, 0);
    const totalPaid = records.reduce((sum, r) => sum + r.totalPaid, 0);
    const totalBalance = records.reduce((sum, r) => sum + r.balance, 0);
    return { totalCount, totalValue, totalPaid, totalBalance };
  }, [records]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Pay single installment
  const handlePayInstallment = async (schedule: LoanScheduleItem) => {
    setPayingScheduleId(schedule.id);
    setPaySuccess(null);
    setPayError(null);
    try {
      await salesService.payInstallment(schedule.id, schedule.totalDue - schedule.paidAmount);
      setPaySuccess(`Installment #${schedule.installmentNo} paid successfully.`);
      await fetchBankLoans();
      if (selectedRecord) {
        const updated = await salesService.getLoans();
        const found = updated.find((r) => r.id === selectedRecord.id);
        if (found) setSelectedRecord(found);
      }
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setPayingScheduleId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <LayoutGrid className="h-3.5 w-3.5 text-blue-600" />
        <Link href="/" className="hover:text-blue-600 transition-colors">
          Dashboard
        </Link>
        <span>&gt;</span>
        <span className="text-slate-500">Bank loan &amp; Payment</span>
        <span>&gt;</span>
        <span className="text-slate-700 font-medium">Bank Loan List</span>
      </div>

      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Bank Loan List
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            បញ្ជីរថយន្តលក់តាមរយៈកម្ចីធនាគារ (Bank Loan) និងតាមដានការទូទាត់បង់រំលស់
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/schedule"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs transition-colors"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Repayment Schedule</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Bank Loans
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-800">{stats.totalCount}</span>
            <span className="text-[11px] text-slate-400">cases</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Loan Value
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-blue-600">
              ${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Amount Received
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-emerald-600">
              ${stats.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Remaining Balance
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-amber-600">
              ${stats.totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-lg p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Loan Code / Receipt
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search code or receipt..."
                value={codeFilter}
                onChange={(e) => setCodeFilter(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-500"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Customer Name / Phone
            </label>
            <input
              type="text"
              placeholder="Search customer..."
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full h-8 px-3 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Brand / Model / VIN
            </label>
            <input
              type="text"
              placeholder="Search vehicle..."
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full h-8 px-3 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "PAID" | "PENDING")}
              className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-500 text-slate-700"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">In Progress / Pending</option>
              <option value="PAID">Fully Paid</option>
            </select>
          </div>
        </div>

        {(codeFilter || customerFilter || brandFilter || statusFilter !== "ALL") && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between text-xs">
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchBankLoans}
              className="underline font-semibold ml-4 cursor-pointer"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-lg p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs">
                <TableRow>
                  <TableHead className="w-10 text-center font-bold">#</TableHead>
                  <TableHead className="font-bold">Loan Code</TableHead>
                  <TableHead className="font-bold">Receipt No</TableHead>
                  <TableHead className="font-bold">Customer</TableHead>
                  <TableHead className="font-bold">Car / VIN</TableHead>
                  <TableHead className="font-bold text-right">Sold Price</TableHead>
                  <TableHead className="font-bold text-right">Total Paid</TableHead>
                  <TableHead className="font-bold text-right">Balance</TableHead>
                  <TableHead className="font-bold text-center">Term</TableHead>
                  <TableHead className="font-bold text-center">Status</TableHead>
                  <TableHead className="w-24 text-center font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs divide-y divide-slate-100">
                {paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-slate-300" />
                        <span className="font-medium text-slate-600">No bank loan records found</span>
                        <span className="text-[11px] text-slate-400">
                          រថយន្តដែលលក់ក្រោមទម្រង់ BANK_LOAN នឹងបង្ហាញនៅទីនេះ
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((r, idx) => {
                    const isPaid = r.balance <= 0.01;
                    return (
                      <TableRow key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="text-center font-medium text-slate-500">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </TableCell>
                        <TableCell className="font-semibold text-blue-700">
                          {r.loanCode}
                        </TableCell>
                        <TableCell className="text-slate-700 font-mono text-[11px]">
                          {r.receiptNo || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-800">{r.customerName}</div>
                          {r.customerPhone && (
                            <div className="text-[11px] text-slate-400">{r.customerPhone}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-800">
                            {r.brand} {r.model}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">{r.vin}</div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-800">
                          ${r.soldPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          ${r.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">
                          ${r.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center text-slate-600">
                          {r.termMonths ? `${r.termMonths} mos` : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              PAID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              IN PROGRESS
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecord(r);
                              setIsModalOpen(true);
                              setPaySuccess(null);
                              setPayError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer"
                          >
                            <span>Schedule</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-3 border-t border-slate-100">
            <TablePagination
              currentPage={currentPage}
              totalItems={filteredRecords.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Loan Schedule Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0 rounded-lg">
          {selectedRecord && (
            <div>
              {/* Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-400" />
                    Bank Loan Schedule: {selectedRecord.loanCode}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Customer: {selectedRecord.customerName} | Vehicle: {selectedRecord.brand}{" "}
                    {selectedRecord.model} ({selectedRecord.vin})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Status messages */}
              <div className="p-4 space-y-4">
                {paySuccess && (
                  <div className="p-2.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{paySuccess}</span>
                  </div>
                )}
                {payError && (
                  <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{payError}</span>
                  </div>
                )}

                {/* Summary Grid */}
                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Sold Price</span>
                    <span className="font-bold text-slate-800">
                      ${selectedRecord.soldPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Total Paid</span>
                    <span className="font-bold text-emerald-600">
                      ${selectedRecord.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Balance</span>
                    <span className="font-bold text-amber-600">
                      ${selectedRecord.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Term</span>
                    <span className="font-bold text-slate-800">
                      {selectedRecord.termMonths} Months
                    </span>
                  </div>
                </div>

                {/* Schedule Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Installment Schedules</h4>
                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3 font-semibold w-12 text-center">#</th>
                          <th className="py-2 px-3 font-semibold">Due Date</th>
                          <th className="py-2 px-3 font-semibold text-right">Principal</th>
                          <th className="py-2 px-3 font-semibold text-right">Interest</th>
                          <th className="py-2 px-3 font-semibold text-right">Total Due</th>
                          <th className="py-2 px-3 font-semibold text-right">Paid</th>
                          <th className="py-2 px-3 font-semibold text-center">Status</th>
                          <th className="py-2 px-3 font-semibold text-center w-20">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {!selectedRecord.schedules || selectedRecord.schedules.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-4 text-center text-slate-400">
                              No schedule records generated for this loan
                            </td>
                          </tr>
                        ) : (
                          selectedRecord.schedules.map((s) => {
                            const isPaid = s.status === "PAID" || s.paidAmount >= s.totalDue;
                            return (
                              <tr key={s.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 text-center font-medium text-slate-500">
                                  {s.installmentNo}
                                </td>
                                <td className="py-2 px-3 text-slate-700">
                                  {s.dueDate ? new Date(s.dueDate).toLocaleDateString() : "—"}
                                </td>
                                <td className="py-2 px-3 text-right text-slate-600">
                                  ${s.principal.toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right text-slate-600">
                                  ${s.interest.toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right font-semibold text-slate-800">
                                  ${s.totalDue.toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right font-semibold text-emerald-600">
                                  ${s.paidAmount.toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {isPaid ? (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      PAID
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      {s.status}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {!isPaid && (
                                    <button
                                      type="button"
                                      disabled={payingScheduleId === s.id}
                                      onClick={() => handlePayInstallment(s)}
                                      className="px-2 py-0.5 text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
                                    >
                                      {payingScheduleId === s.id ? "Paying..." : "Pay"}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer action */}
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
