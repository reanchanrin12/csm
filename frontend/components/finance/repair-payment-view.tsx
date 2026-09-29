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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  LayoutGrid,
  Wrench,
  AlertCircle,
  CheckCircle2,
  X,
  RotateCcw,
  FileText,
  DollarSign,
  Calendar,
  Search,
  Check,
} from "lucide-react";
import { TablePagination } from "@/components/ui/table-pagination";
import { costService, type LandedCostBillRecord } from "@/lib/api";

export function RepairPaymentView() {
  const [bills, setBills] = useState<LandedCostBillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [billNoFilter, setBillNoFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [vinFilter, setVinFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Pay Modal
  const [selectedBill, setSelectedBill] = useState<LandedCostBillRecord | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const fetchRepairBills = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await costService.getBills("REPAIR");
      setBills(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load repair bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairBills();
  }, []);

  const handleResetFilters = () => {
    setBillNoFilter("");
    setSupplierFilter("");
    setVinFilter("");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const billNoMatch =
        !billNoFilter.trim() ||
        b.billNumber.toLowerCase().includes(billNoFilter.trim().toLowerCase());

      const supplierMatch =
        !supplierFilter.trim() ||
        b.supplierName.toLowerCase().includes(supplierFilter.trim().toLowerCase());

      const vinMatch =
        !vinFilter.trim() ||
        b.vehicles.some(
          (v) =>
            v.vin.toLowerCase().includes(vinFilter.trim().toLowerCase()) ||
            v.model.toLowerCase().includes(vinFilter.trim().toLowerCase()) ||
            v.brand.toLowerCase().includes(vinFilter.trim().toLowerCase())
        );

      const isPaid = b.balance <= 0.01;
      const statusMatch =
        statusFilter === "ALL" ||
        (statusFilter === "PAID" && isPaid) ||
        (statusFilter === "UNPAID" && !isPaid);

      return billNoMatch && supplierMatch && vinMatch && statusMatch;
    });
  }, [bills, billNoFilter, supplierFilter, vinFilter, statusFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [billNoFilter, supplierFilter, vinFilter, statusFilter]);

  // Totals KPI
  const stats = useMemo(() => {
    const totalCount = bills.length;
    const totalValue = bills.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalPaid = bills.reduce((sum, b) => sum + b.paidAmount, 0);
    const totalBalance = bills.reduce((sum, b) => sum + b.balance, 0);
    return { totalCount, totalValue, totalPaid, totalBalance };
  }, [bills]);

  // Paginated bills
  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBills.slice(start, start + pageSize);
  }, [filteredBills, currentPage, pageSize]);

  // Handle pay confirmation
  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    const amountToPay = typeof payAmount === "number" ? payAmount : 0;
    if (amountToPay <= 0) {
      setPayError("Please enter a valid amount greater than 0");
      return;
    }

    setSaving(true);
    setPayError(null);
    setPaySuccess(null);
    try {
      const newPaidAmount = selectedBill.paidAmount + amountToPay;
      await costService.updateBill(selectedBill.id, {
        paidAmount: newPaidAmount,
      });
      setPaySuccess(`Successfully recorded payment of $${amountToPay.toFixed(2)}`);
      await fetchRepairBills();
      setTimeout(() => {
        setIsPayOpen(false);
        setSelectedBill(null);
      }, 1200);
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSaving(false);
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
        <span className="text-slate-500">Finance</span>
        <span>&gt;</span>
        <span className="text-slate-700 font-medium">Repair Payment List</span>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Wrench className="h-5 w-5 text-amber-600" />
            Repair Payment List
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            បញ្ជីវិក្កយបត្រជួសជុល ថ្លៃជាង និងគ្រឿងបន្លាស់ (Repair Bills &amp; Landed Costs)
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Repair Invoices
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-800">{stats.totalCount}</span>
            <span className="text-[11px] text-slate-400">invoices</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Repair Amount
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-800">
              ${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Amount Paid
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

      {/* Filters */}
      <div className="bg-white border border-slate-200/80 rounded-lg p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Bill Number</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search bill no..."
                value={billNoFilter}
                onChange={(e) => setBillNoFilter(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded focus:outline-none focus:border-amber-500"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Garage / Supplier
            </label>
            <input
              type="text"
              placeholder="Search garage or supplier..."
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full h-8 px-3 text-xs border border-slate-200 rounded focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              VIN / Vehicle Model
            </label>
            <input
              type="text"
              placeholder="Search VIN or model..."
              value={vinFilter}
              onChange={(e) => setVinFilter(e.target.value)}
              className="w-full h-8 px-3 text-xs border border-slate-200 rounded focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "PAID" | "UNPAID")}
              className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:border-amber-500 text-slate-700"
            >
              <option value="ALL">All Status</option>
              <option value="UNPAID">Pending / Balance Due</option>
              <option value="PAID">Fully Paid</option>
            </select>
          </div>
        </div>

        {(billNoFilter || supplierFilter || vinFilter || statusFilter !== "ALL") && (
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
              onClick={fetchRepairBills}
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
                  <TableHead className="font-bold">Bill No</TableHead>
                  <TableHead className="font-bold">Garage / Supplier</TableHead>
                  <TableHead className="font-bold">Associated Vehicles</TableHead>
                  <TableHead className="font-bold">Bill Date</TableHead>
                  <TableHead className="font-bold text-right">Total Amount</TableHead>
                  <TableHead className="font-bold text-right">Paid Amount</TableHead>
                  <TableHead className="font-bold text-right">Balance</TableHead>
                  <TableHead className="font-bold text-center">Status</TableHead>
                  <TableHead className="font-bold">Note / Description</TableHead>
                  <TableHead className="w-24 text-center font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs divide-y divide-slate-100">
                {paginatedBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-slate-300" />
                        <span className="font-medium text-slate-600">No repair bills found</span>
                        <span className="text-[11px] text-slate-400">
                          វិក្កយបត្រថ្លៃជួសជុល និងថ្លៃជាងដែលបានបញ្ចូលក្នុងប្រព័ន្ធនឹងបង្ហាញនៅទីនេះ
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBills.map((b, idx) => {
                    const isPaid = b.balance <= 0.01;
                    return (
                      <TableRow key={b.id} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="text-center font-medium text-slate-500">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </TableCell>
                        <TableCell className="font-semibold text-amber-700 font-mono">
                          {b.billNumber}
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">
                          {b.supplierName}
                        </TableCell>
                        <TableCell>
                          {b.vehicles.length === 0 ? (
                            <span className="text-slate-400 italic">No vehicle linked</span>
                          ) : (
                            <div className="space-y-1">
                              {b.vehicles.map((v) => (
                                <div key={v.id} className="flex items-center gap-1.5">
                                  <span className="font-medium text-slate-700">
                                    {v.brand} {v.model}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                                    {v.vin}
                                  </span>
                                  <span className="text-[10px] text-amber-700 font-semibold">
                                    (${v.allocatedAmount.toFixed(2)})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {b.billDate ? new Date(b.billDate).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-800">
                          ${b.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          ${b.paidAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">
                          ${b.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              PAID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              DUE ${b.balance.toFixed(2)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500 max-w-[200px] truncate">
                          {b.description || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBill(b);
                              setPayAmount(b.balance > 0 ? b.balance : "");
                              setIsPayOpen(true);
                              setPaySuccess(null);
                              setPayError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 transition-colors cursor-pointer"
                          >
                            <DollarSign className="h-3 w-3" />
                            <span>{isPaid ? "Details" : "Pay"}</span>
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
              totalItems={filteredBills.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Pay / Update Dialog */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-600" />
              Repair Bill Payment: {selectedBill?.billNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedBill && (
            <form onSubmit={handleConfirmPay} className="space-y-4 pt-2 text-xs">
              {paySuccess && (
                <div className="p-2.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{paySuccess}</span>
                </div>
              )}
              {payError && (
                <div className="p-2.5 rounded bg-destructive/10 text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{payError}</span>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier/Garage:</span>
                  <span className="font-semibold text-slate-800">{selectedBill.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bill Date:</span>
                  <span className="text-slate-700">
                    {selectedBill.billDate ? new Date(selectedBill.billDate).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/80 pt-1.5">
                  <span className="text-slate-500">Total Bill Amount:</span>
                  <span className="font-semibold text-slate-800">${selectedBill.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Already Paid:</span>
                  <span className="font-semibold text-emerald-600">${selectedBill.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-700 border-t border-slate-200/80 pt-1.5">
                  <span>Current Balance Due:</span>
                  <span>${selectedBill.balance.toFixed(2)}</span>
                </div>
              </div>

              {selectedBill.balance > 0.01 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Amount to Record ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedBill.balance}
                    value={payAmount}
                    onChange={(e) =>
                      setPayAmount(e.target.value === "" ? "" : parseFloat(e.target.value))
                    }
                    placeholder="Enter amount..."
                    required
                    className="w-full h-9 px-3 text-xs border border-slate-300 rounded focus:outline-none focus:border-amber-500 font-semibold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Max payable balance: ${selectedBill.balance.toFixed(2)}
                  </span>
                </div>
              )}

              <DialogFooter className="pt-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                {selectedBill.balance > 0.01 && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded transition-colors disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>{saving ? "Saving..." : "Record Payment"}</span>
                  </button>
                )}
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
