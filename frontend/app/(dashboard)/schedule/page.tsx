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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  Calendar,
  RotateCcw,
  Car,
  CheckCircle2,
  Clock,
  Eye,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { salesService } from "@/lib/api";
import { TablePagination } from "@/components/ui/table-pagination";

interface ScheduleItem {
  id: string;
  installmentNo: number;
  dueDate: string;
  principal: number;
  interest: number;
  totalDue: number;
  paidAmount: number;
  status: "PENDING" | "PAID" | "PARTIAL" | "OVERDUE";
  paidDate: string | null;
}

interface LoanOrderRow {
  id: string;
  loanCode: string;
  receiptNo: string;
  customerName: string;
  customerPhone: string;
  brand: string;
  model: string;
  vin: string;
  engine: string;
  coverImageUrl?: string | null;
  soldPrice: number;
  rate: number;
  soldDate: string;
  termMonths: number;
  loanType: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  monthlyPay: number;
  schedulesCount: number;
  paidCount: number;
  schedules: ScheduleItem[];
}

export default function CustomerLoanSchedulePage() {
  const [loans, setLoans] = useState<LoanOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter Row matching Screenshot 111258
  const [loanCodeFilter, setLoanCodeFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [vinFilter, setVinFilter] = useState("");

  // Schedule Details Modal
  const [selectedLoan, setSelectedLoan] = useState<LoanOrderRow | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await salesService.getLoans()) as LoanOrderRow[];
      setLoans(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load loan schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // Filtered loan list
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      if (
        loanCodeFilter &&
        !loan.loanCode.toLowerCase().includes(loanCodeFilter.toLowerCase()) &&
        !loan.receiptNo.toLowerCase().includes(loanCodeFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        brandFilter &&
        !loan.brand.toLowerCase().includes(brandFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        modelFilter &&
        !loan.model.toLowerCase().includes(modelFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        vinFilter &&
        !loan.vin.toLowerCase().includes(vinFilter.toLowerCase()) &&
        !loan.engine.toLowerCase().includes(vinFilter.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [loans, loanCodeFilter, brandFilter, modelFilter, vinFilter]);

  // Pagination (10 items per page limit to prevent slow rendering)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [loanCodeFilter, brandFilter, modelFilter, vinFilter]);

  const paginatedLoans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLoans.slice(start, start + pageSize);
  }, [filteredLoans, currentPage, pageSize]);

  const resetFilters = () => {
    setLoanCodeFilter("");
    setBrandFilter("");
    setModelFilter("");
    setVinFilter("");
    setCurrentPage(1);
  };

  const handlePaySchedule = async (scheduleId: string) => {
    setPayingId(scheduleId);
    try {
      await salesService.payInstallment(scheduleId);
      // Refresh list
      await fetchLoans();

      // Update current open modal view
      if (selectedLoan) {
        setSelectedLoan((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            schedules: prev.schedules.map((s) =>
              s.id === scheduleId
                ? {
                    ...s,
                    status: "PAID",
                    paidAmount: s.totalDue,
                    paidDate: new Date().toISOString(),
                  }
                : s
            ),
          };
        });
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPayingId(null);
    }
  };

  const openScheduleModal = (loan: LoanOrderRow) => {
    setSelectedLoan(loan);
    setScheduleModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* 1. Breadcrumb Bar matching Screenshot 111258 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-[#e9ecef]/60 dark:bg-muted/40 px-3 py-2 rounded-md border border-border/40">
        <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
        <Link href="/" className="text-primary hover:underline font-medium">
          Dashboard
        </Link>
        <span>&gt;</span>
        <span className="text-foreground font-medium">Schedule</span>
      </div>

      {/* 2. Page Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#212529] dark:text-foreground">
          Customer loan schedule
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          filter and view loan payment
        </p>
      </div>

      {/* 3. Filter Row matching Screenshot 111258 1:1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#1a5fb4] dark:text-blue-400">
            Loan code
          </label>
          <Input
            placeholder="Loan code"
            value={loanCodeFilter}
            onChange={(e) => setLoanCodeFilter(e.target.value)}
            className="h-9 text-xs bg-white dark:bg-card border-border/70"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#1a5fb4] dark:text-blue-400">
            Brand
          </label>
          <Input
            placeholder="Brand name"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="h-9 text-xs bg-white dark:bg-card border-border/70"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#1a5fb4] dark:text-blue-400">
            Model
          </label>
          <Input
            placeholder="Car model"
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="h-9 text-xs bg-white dark:bg-card border-border/70"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#1a5fb4] dark:text-blue-400">
            Vin number
          </label>
          <div className="flex gap-1.5">
            <Input
              placeholder="Engine"
              value={vinFilter}
              onChange={(e) => setVinFilter(e.target.value)}
              className="h-9 text-xs bg-white dark:bg-card border-border/70"
            />
            {(loanCodeFilter || brandFilter || modelFilter || vinFilter) && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="h-9 px-2 text-xs"
                title="Reset filters"
              >
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Tab Header matching Screenshot 111258 */}
      <div className="pt-2">
        <div className="border-b border-border/60">
          <span className="inline-block px-4 py-2 text-xs font-semibold text-foreground bg-white dark:bg-card border border-b-0 border-border/60 rounded-t-md -mb-px">
            Loan payment list
          </span>
        </div>

        {/* 5. Data Table matching Screenshot 111258 */}
        <div className="rounded-b-md border border-t-0 bg-white dark:bg-card shadow-xs overflow-x-auto">
          <Table className="text-xs">
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="w-[160px] font-bold text-foreground">
                  #Loan Number
                </TableHead>
                <TableHead className="w-[80px] font-bold text-foreground">
                  Car
                </TableHead>
                <TableHead className="w-[120px] font-bold text-foreground">
                  Brand
                </TableHead>
                <TableHead className="w-[140px] font-bold text-foreground">
                  Model
                </TableHead>
                <TableHead className="w-[120px] font-bold text-foreground text-right">
                  Sold Price
                </TableHead>
                <TableHead className="w-[80px] font-bold text-foreground text-right">
                  Rate
                </TableHead>
                <TableHead className="w-[110px] font-bold text-foreground">
                  Sold date
                </TableHead>
                <TableHead className="w-[110px] font-bold text-foreground text-center">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredLoans.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No installment loan contracts found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLoans.map((loan) => (
                  <TableRow
                    key={loan.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    {/* #Loan Number */}
                    <TableCell className="font-semibold text-foreground font-mono">
                      {loan.loanCode}
                    </TableCell>

                    {/* Car Thumbnail */}
                    <TableCell>
                      <div className="h-9 w-14 rounded overflow-hidden bg-muted flex items-center justify-center border shrink-0">
                        {loan.coverImageUrl ? (
                          <img
                            src={loan.coverImageUrl}
                            alt={loan.model}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Car className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>

                    {/* Brand */}
                    <TableCell className="font-medium text-foreground uppercase">
                      {loan.brand}
                    </TableCell>

                    {/* Model */}
                    <TableCell className="font-medium uppercase">
                      {loan.model}
                    </TableCell>

                    {/* Sold Price */}
                    <TableCell className="font-bold text-foreground text-right font-mono">
                      ${loan.soldPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>

                    {/* Rate */}
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {loan.rate.toFixed(2)}%
                    </TableCell>

                    {/* Sold Date */}
                    <TableCell className="font-mono text-muted-foreground">
                      {loan.soldDate.slice(0, 10)}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openScheduleModal(loan)}
                        className="h-7 text-xs px-2.5 gap-1 border-primary/40 text-primary hover:bg-primary/10"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View ({loan.paidCount}/{loan.schedulesCount})
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredLoans.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* 6. Amortization Schedule Detail Dialog */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Installment Payment Schedule
            </DialogTitle>
            {selectedLoan && (
              <DialogDescription className="text-xs">
                Loan Code: <strong className="font-mono">{selectedLoan.loanCode}</strong> | Customer:{" "}
                <strong>{selectedLoan.customerName}</strong> ({selectedLoan.customerPhone}) | Vehicle:{" "}
                <strong>
                  {selectedLoan.brand} {selectedLoan.model}
                </strong>{" "}
                (VIN: <span className="font-mono">{selectedLoan.vin}</span>)
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedLoan && (
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {/* Summary KPIs */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded border p-2 bg-muted/10">
                  <span className="text-muted-foreground block text-[10px]">Sold Price</span>
                  <span className="font-bold font-mono">
                    ${selectedLoan.soldPrice.toLocaleString()}
                  </span>
                </div>
                <div className="rounded border p-2 bg-muted/10">
                  <span className="text-muted-foreground block text-[10px]">Total Due</span>
                  <span className="font-bold font-mono text-[#1a5fb4]">
                    ${selectedLoan.totalDue.toLocaleString()}
                  </span>
                </div>
                <div className="rounded border p-2 bg-muted/10">
                  <span className="text-muted-foreground block text-[10px]">Total Paid</span>
                  <span className="font-bold font-mono text-green-600">
                    ${selectedLoan.totalPaid.toLocaleString()}
                  </span>
                </div>
                <div className="rounded border p-2 bg-muted/10">
                  <span className="text-muted-foreground block text-[10px]">Remaining Balance</span>
                  <span className="font-bold font-mono text-destructive">
                    ${selectedLoan.balance.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Installment Rows Table */}
              <div className="rounded border overflow-hidden">
                <Table className="text-xs">
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead className="w-[90px]">Due Date</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right font-bold">Total Due</TableHead>
                      <TableHead className="text-center w-[90px]">Status</TableHead>
                      <TableHead className="text-center w-[90px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedLoan.schedules.map((row) => {
                      const isPaid = row.status === "PAID";
                      return (
                        <TableRow
                          key={row.id}
                          className={isPaid ? "bg-green-50/30 dark:bg-green-950/20" : ""}
                        >
                          <TableCell className="font-mono font-semibold">
                            {row.installmentNo}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {row.dueDate.slice(0, 10)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${row.principal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            ${row.interest.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            ${row.totalDue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-center">
                            {isPaid ? (
                              <Badge className="bg-green-600 text-white hover:bg-green-600 text-[10px] px-2 py-0">
                                PAID
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-500 text-[10px] px-2 py-0">
                                PENDING
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {!isPaid ? (
                              <Button
                                size="sm"
                                disabled={payingId === row.id}
                                onClick={() => handlePaySchedule(row.id)}
                                className="h-6 text-[11px] px-2.5 bg-[#20c997] hover:bg-[#1baa80] text-white"
                              >
                                {payingId === row.id ? "Paying..." : "Pay Now"}
                              </Button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {row.paidDate ? row.paidDate.slice(0, 10) : "Paid"}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
