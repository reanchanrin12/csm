"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CustomerPaymentView } from "@/components/finance/customer-payment-view";
import { SupplierPaymentView } from "@/components/finance/supplier-payment-view";
import { BankLoanListView } from "@/components/finance/bank-loan-list-view";
import { RepairPaymentView } from "@/components/finance/repair-payment-view";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Calendar,
  LayoutGrid,
  DollarSign,
  MessageSquare,
  PlusCircle,
  Filter,
  Search,
  RotateCcw,
  Check,
  Edit,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { expenseService } from "@/lib/api";
import type { OperatingExpenseItem } from "@csm/contracts";

function MonthlyExpensesView() {
  const [expenses, setExpenses] = useState<OperatingExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form State (Exact Screenshot 111255 fields)
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [expenseTo, setExpenseTo] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter State (Exact Screenshot 111255: Filter exense by date)
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [activeStartDate, setActiveStartDate] = useState("");
  const [activeEndDate, setActiveEndDate] = useState("");

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editExpenseDate, setEditExpenseDate] = useState("");
  const [editExpenseTo, setEditExpenseTo] = useState("");
  const [editAmount, setEditAmount] = useState<number | "">("");
  const [editDetails, setEditDetails] = useState("");
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await expenseService.list();
      setExpenses(data.expenses || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Save Expense
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setActionSuccess(null);

    if (!expenseTo.trim()) {
      setFormError("Please enter items expense on.");
      return;
    }
    if (typeof amount !== "number" || amount <= 0) {
      setFormError("Payment amount must be greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      await expenseService.create({
        expenseDate,
        expenseTo: expenseTo.trim(),
        amount: Number(amount),
        details: details.trim(),
      });
      setExpenseTo("");
      setAmount("");
      setDetails("");
      setActionSuccess("Expense saved successfully!");
      await fetchExpenses();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      
      setSubmitting(false);
    }
  };

  // Open Edit
  const handleOpenEdit = (item: OperatingExpenseItem) => {
    setEditingId(item.id);
    setEditExpenseDate(item.expenseDate.slice(0, 10));
    setEditExpenseTo(item.expenseTo);
    setEditAmount(item.amount);
    setEditDetails(item.details || "");
    setEditFormError(null);
    setIsEditOpen(true);
  };

  // Submit Update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    if (!editExpenseTo.trim()) {
      setEditFormError("Please enter items expense on.");
      return;
    }
    if (typeof editAmount !== "number" || editAmount <= 0) {
      setEditFormError("Payment amount must be greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      await expenseService.update(editingId, {
        expenseDate: editExpenseDate,
        expenseTo: editExpenseTo.trim(),
        amount: Number(editAmount),
        details: editDetails.trim(),
      });
      setIsEditOpen(false);
      setEditingId(null);
      setActionSuccess("Expense updated successfully!");
      await fetchExpenses();
    } catch (err: unknown) {
      setEditFormError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await expenseService.delete(deletingId);
      setDeletingId(null);
      setActionSuccess("Expense deleted successfully!");
      // Reset page if deleting the last item on the current page
      if (paginatedExpenses.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
      await fetchExpenses();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete expense");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveStartDate(filterStartDate);
    setActiveEndDate(filterEndDate);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilterStartDate("");
    setFilterEndDate("");
    setActiveStartDate("");
    setActiveEndDate("");
    setCurrentPage(1);
  };

  // Filter logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const itemDate = item.expenseDate.slice(0, 10);
      if (activeStartDate && itemDate < activeStartDate) return false;
      if (activeEndDate && itemDate > activeEndDate) return false;
      return true;
    });
  }, [expenses, activeStartDate, activeEndDate]);

  const totalPages = Math.ceil(filteredExpenses.length / pageSize) || 1;
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage]);

  return (
    <div className="space-y-4 max-w-full pb-16">
      {/* 1. Full-Width Light Grey/Blue Breadcrumb Banner matching Screenshot 111255 */}
      <div className="w-full bg-[#e8ecf4] border border-[#d8e0ec] rounded-[3px] px-3.5 py-2 flex items-center gap-1.5 text-[12px]">
        <LayoutGrid className="h-3.5 w-3.5 text-[#1976d2] shrink-0" />
        <Link href="/" className="text-[#1976d2] font-semibold hover:underline">
          Dashboard
        </Link>
        <span className="text-slate-400 font-normal">&gt;</span>
        <span className="text-slate-600 font-medium">Other expense</span>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-xs hover:underline cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <Alert variant="destructive" className="py-2 text-xs">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {/* 2. Monthly Expenses Form matching Screenshot 111255 */}
      <div className="pt-1">
        <h1 className="text-[19px] font-bold text-[#2c3e50] tracking-tight">Monthly Expenses</h1>
        <p className="text-[12px] text-slate-500 font-normal mt-0.5 mb-5">add data</p>

        <form onSubmit={handleCreate} className="space-y-3.5 max-w-xl">
          {formError && (
            <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
              {formError}
            </div>
          )}

          {/* Row 1: Select Date */}
          <div className="flex items-center gap-4">
            <div className="w-36 flex items-center gap-2 text-[12px] font-bold text-[#1f3a60]">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>Select Date</span>
            </div>
            <input
              id="expenseDate"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
              className="w-[260px] h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
            />
          </div>

          {/* Row 2: Expense To */}
          <div className="flex items-center gap-4">
            <div className="w-36 flex items-center gap-2 text-[12px] font-bold text-[#1f3a60]">
              <LayoutGrid className="h-4 w-4 text-slate-500" />
              <span>Expense To</span>
            </div>
            <input
              id="expenseTo"
              type="text"
              placeholder="items expense on"
              value={expenseTo}
              onChange={(e) => setExpenseTo(e.target.value)}
              required
              className="w-[260px] h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
            />
          </div>

          {/* Row 3: Payment Amount */}
          <div className="flex items-center gap-4">
            <div className="w-36 flex items-center gap-2 text-[12px] font-bold text-[#1f3a60]">
              <DollarSign className="h-4 w-4 text-slate-500" />
              <span>Payment Amount</span>
            </div>
            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="$ expense price"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === "" ? "" : Number(e.target.value))
              }
              required
              className="w-[260px] h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
            />
          </div>

          {/* Row 4: Detail */}
          <div className="flex items-start gap-4">
            <div className="w-36 flex items-center gap-2 text-[12px] font-bold text-[#1f3a60] pt-1">
              <MessageSquare className="h-4 w-4 text-slate-500" />
              <span>Detail</span>
            </div>
            <textarea
              id="details"
              rows={3}
              placeholder="some node about this expense on"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-[360px] p-2 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff] resize-none"
            />
          </div>

          {/* Row 5: Save Expense Button */}
          <div className="flex items-center gap-4 pt-1">
            <div className="w-36" />
            <button
              type="submit"
              disabled={submitting}
              className="h-[32px] px-4 text-xs font-semibold bg-[#1976d2] hover:bg-[#1565c0] text-white rounded-[2px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{submitting ? "Saving..." : "Save Expense"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Filter exense Section (Exact Screenshot 111255 layout) */}
      <div className="pt-6 border-t border-slate-200 space-y-2">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#2c3e50]">
          <Filter className="h-3.5 w-3.5 text-[#2c3e50]" />
          <span>Filter exense</span>
        </div>
        <p className="text-[11px] text-slate-500">by date</p>

        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 pt-1">
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="w-48 h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
          />

          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="w-48 h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
          />

          <button
            type="submit"
            className="h-[30px] px-4 text-xs font-semibold bg-[#ea4335] hover:bg-[#d32f2f] text-white rounded-[2px] flex items-center gap-1.5 cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            Search
          </button>

          {(activeStartDate || activeEndDate) && (
            <button
              type="button"
              onClick={handleReset}
              className="h-[30px] px-3 text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-[2px] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </form>
      </div>

      {/* 4. Expenses list Tab & Table Header (Exact Screenshot 111255 layout) */}
      <div className="space-y-0 pt-4">
        <div className="flex items-center border-b border-slate-200">
          <div className="px-4 py-2 text-xs font-semibold border-t border-l border-r border-slate-300 border-b-2 border-b-white text-[#2c3e50] bg-white -mb-px rounded-t-[2px]">
            Expenses list
          </div>
        </div>

        {/* Table matching Screenshot 111255 */}
        <div className="border-t border-slate-200 overflow-x-auto">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : error ? (
              <div className="p-6 text-center text-xs text-destructive">{error}</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No expense data found.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16 font-bold text-xs text-foreground">#No</TableHead>
                    <TableHead className="w-32 font-bold text-xs text-foreground">Date</TableHead>
                    <TableHead className="font-bold text-xs text-foreground">Expense On</TableHead>
                    <TableHead className="font-bold text-xs text-foreground">Amount Paid</TableHead>
                    <TableHead className="font-bold text-xs text-foreground">Detail</TableHead>
                    <TableHead className="w-20 text-center font-bold text-xs text-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExpenses.map((e, index) => (
                    <TableRow key={e.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {(currentPage - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {e.expenseDate.slice(0, 10)}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        {e.expenseTo}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-foreground">
                        ${e.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {e.details || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => handleOpenEdit(e)}
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            aria-label={`Edit expense for ${e.expenseTo}`}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingId(e.id);
                            }}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            aria-label={`Delete expense for ${e.expenseTo}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination Controls matching Screenshot 111258: « Previous Next » */}
            {totalPages > 1 && (
              <div className="p-3.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/10">
                <span>
                  Showing {paginatedExpenses.length} of {filteredExpenses.length} entries
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <span className="px-2 font-mono text-xs">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Expense</DialogTitle>
            <DialogDescription className="text-xs">
              Update details for this expense entry.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            {editFormError && (
              <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs">
                {editFormError}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="editDate" className="text-xs">Select Date</Label>
              <Input
                id="editDate"
                type="date"
                value={editExpenseDate}
                onChange={(e) => setEditExpenseDate(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editTo" className="text-xs">Expense To</Label>
              <Input
                id="editTo"
                value={editExpenseTo}
                onChange={(e) => setEditExpenseTo(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editAmount" className="text-xs">Payment Amount</Label>
              <Input
                id="editAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={editAmount}
                onChange={(e) =>
                  setEditAmount(e.target.value === "" ? "" : Number(e.target.value))
                }
                required
                className="h-9 text-xs font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editDetails" className="text-xs">Detail</Label>
              <Textarea
                id="editDetails"
                rows={3}
                value={editDetails}
                onChange={(e) => setEditDetails(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="h-9 text-xs font-semibold">
                {submitting ? "Saving..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingId(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive">Delete Expense</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete this expense record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs">
              {deleteError}
            </div>
          )}
          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingId(null)}
              disabled={isDeleting}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="h-9 text-xs font-semibold"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FinanceContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "customer";

  if (tab === "customer") {
    return <CustomerPaymentView />;
  }

  if (tab === "supplier") {
    return <SupplierPaymentView />;
  }

  if (tab === "bank-loans" || tab === "loans") {
    return <BankLoanListView />;
  }

  if (tab === "repair") {
    return <RepairPaymentView />;
  }

  return <MonthlyExpensesView />;
}

export default function FinancePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center text-xs text-slate-400">
          <Skeleton className="h-6 w-32" />
        </div>
      }
    >
      <FinanceContent />
    </Suspense>
  );
}
