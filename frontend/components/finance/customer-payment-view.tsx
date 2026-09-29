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
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  X,
  RotateCcw,
  FileText,
} from "lucide-react";
import { salesService, type CustomerPaymentRecord } from "@/lib/api";

export function CustomerPaymentView() {
  const [records, setRecords] = useState<CustomerPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters matching reference screenshot: Loan code, Customer name, Brand, Model
  const [loanCodeFilter, setLoanCodeFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");

  // Modal State
  const [selectedRecord, setSelectedRecord] = useState<CustomerPaymentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payingScheduleId, setPayingScheduleId] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesService.getLoans();
      setRecords(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load customer payment records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Filtered rows
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const codeMatch =
        !loanCodeFilter.trim() ||
        r.loanCode.toLowerCase().includes(loanCodeFilter.trim().toLowerCase()) ||
        r.receiptNo.toLowerCase().includes(loanCodeFilter.trim().toLowerCase());

      const customerMatch =
        !customerFilter.trim() ||
        r.customerName.toLowerCase().includes(customerFilter.trim().toLowerCase());

      const brandMatch =
        !brandFilter.trim() ||
        r.brand.toLowerCase().includes(brandFilter.trim().toLowerCase());

      const modelMatch =
        !modelFilter.trim() ||
        r.model.toLowerCase().includes(modelFilter.trim().toLowerCase());

      return codeMatch && customerMatch && brandMatch && modelMatch;
    });
  }, [records, loanCodeFilter, customerFilter, brandFilter, modelFilter]);

  // Open Details/Payment Dialog
  const handleOpenPayment = (record: CustomerPaymentRecord) => {
    setSelectedRecord(record);
    setPaySuccess(null);
    setPayError(null);
    setIsModalOpen(true);
  };

  // Pay single installment
  const handlePayInstallment = async (scheduleId: string, amount: number) => {
    setPayingScheduleId(scheduleId);
    setPayError(null);
    setPaySuccess(null);
    try {
      await salesService.payInstallment(scheduleId, amount);
      setPaySuccess("ការបង់ប្រាក់បានជោគជ័យ! (Payment recorded successfully)");
      await fetchRecords();
      if (selectedRecord) {
        const updatedSchedules = selectedRecord.schedules.map((s) =>
          s.id === scheduleId
            ? { ...s, status: "PAID" as const, paidAmount: amount, paidDate: new Date().toISOString().slice(0, 10) }
            : s
        );
        setSelectedRecord({
          ...selectedRecord,
          schedules: updatedSchedules,
          totalPaid: selectedRecord.totalPaid + amount,
          balance: Math.max(0, selectedRecord.balance - amount),
          paidCount: selectedRecord.paidCount + 1,
        });
      }
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setPayingScheduleId(null);
    }
  };

  // Helper to translate loan type to Khmer
  const formatLoanType = (type: CustomerPaymentRecord["loanType"]) => {
    switch (type) {
      case "FULL_PAYMENT":
        return "បង់ផ្តាច់";
      case "INSTALLMENT_FLAT":
        return "បង់រំលស់ (ការប្រាក់ថេរ)";
      case "INSTALLMENT_DECLINING":
        return "បង់រំលស់ (ការប្រាក់ថយ)";
      case "BANK_LOAN":
        return "កម្ចីធនាគារ";
      default:
        return "បង់ផ្តាច់";
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Full-Width Light Grey/Blue Breadcrumb Banner matching Screenshot 111230 */}
      <div className="w-full bg-[#e8ecf4] border border-[#d8e0ec] rounded-[3px] px-3.5 py-2 flex items-center gap-1.5 text-[12px]">
        <LayoutGrid className="h-3.5 w-3.5 text-[#1976d2] shrink-0" />
        <Link href="/" className="text-[#1976d2] font-semibold hover:underline">
          Dashboard
        </Link>
        <span className="text-slate-400 font-normal">&gt;</span>
        <span className="text-slate-600 font-medium">Customer Payment</span>
      </div>

      {/* 2. Main Title */}
      <div>
        <h1 className="text-[19px] font-bold text-[#2c3e50] tracking-tight">
          Customer payment list
        </h1>
      </div>

      {/* 3. Filters in single horizontal row (Exact Screenshot 111230) */}
      <div className="flex items-center gap-4 flex-wrap pt-1 pb-2">
        <div className="flex flex-col gap-1 w-[160px]">
          <label className="text-[12px] font-bold text-[#1f3a60]">
            Loan code
          </label>
          <input
            type="text"
            placeholder="Loan code"
            value={loanCodeFilter}
            onChange={(e) => setLoanCodeFilter(e.target.value)}
            className="h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
          />
        </div>

        <div className="flex flex-col gap-1 w-[180px]">
          <label className="text-[12px] font-bold text-[#1f3a60]">
            Customer name
          </label>
          <input
            type="text"
            placeholder="Customer name"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
          />
        </div>

        <div className="flex flex-col gap-1 w-[160px]">
          <label className="text-[12px] font-bold text-[#1f3a60]">
            Brand
          </label>
          <input
            type="text"
            placeholder="Brand name"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
          />
        </div>

        <div className="flex flex-col gap-1 w-[160px]">
          <label className="text-[12px] font-bold text-[#1f3a60]">
            Model
          </label>
          <input
            type="text"
            placeholder="Car model"
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
          />
        </div>
      </div>

      {/* 4. Subtitle matching Screenshot: "customer load view list" */}
      <div>
        <p className="text-[12px] text-slate-500 font-normal">
          customer load view list
        </p>
      </div>

      {/* 5. Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading customer payments</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchRecords}
              className="h-7 text-xs ml-4 border border-red-300 px-2 rounded bg-white text-red-700 flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Retry
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* 6. Clean Table matching Screenshot 111230 */}
      <div className="border-t border-slate-200 overflow-x-auto">
        <Table>
          <TableHeader className="bg-transparent border-b border-slate-200">
            <TableRow className="hover:bg-transparent text-[12px] font-bold text-[#2c3e50]">
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold pl-1">
                #Loan Number
              </TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">
                Customer
              </TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">
                Brand
              </TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">
                Model
              </TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">
                Sold Price
              </TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">
                Rate
              </TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">
                Sold date
              </TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">
                Loan type
              </TableHead>
              <TableHead className="h-9 py-2 text-right pr-2">
                {/* Action */}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right pr-2">
                    <Skeleton className="h-6 w-6 rounded ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-32 text-center text-xs text-slate-500"
                >
                  {records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                      <FileText className="h-8 w-8 text-slate-300" />
                      <span className="font-medium text-slate-600">
                        មិនទាន់មានទិន្នន័យលក់រថយន្តនៅឡើយទេ
                      </span>
                      <span className="text-[11px] text-slate-400">
                        (ទិន្នន័យនឹងបង្ហាញនៅពេលមានការលក់ចេញនៅ Selling &gt; New Sell)
                      </span>
                    </div>
                  ) : (
                    "រកមិនឃើញទិន្នន័យដែលត្រូវនឹងតម្រងស្វែងរកឡើយ"
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((item) => (
                <TableRow
                  key={item.id}
                  className="text-[12px] hover:bg-[#f8fafc] border-b border-slate-100 transition-colors"
                >
                  {/* #Loan Number */}
                  <TableCell className="font-semibold text-slate-900 py-3 pl-1">
                    {item.loanCode}
                  </TableCell>

                  {/* Customer */}
                  <TableCell className="text-slate-800 py-3 font-medium">
                    {item.customerName}
                  </TableCell>

                  {/* Brand */}
                  <TableCell className="text-slate-800 py-3 uppercase">
                    {item.brand}
                  </TableCell>

                  {/* Model */}
                  <TableCell className="text-slate-700 py-3">
                    {item.model}
                  </TableCell>

                  {/* Sold Price */}
                  <TableCell className="text-slate-800 py-3">
                    $ {item.soldPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>

                  {/* Rate */}
                  <TableCell className="text-slate-700 py-3">
                    {item.rate.toFixed(2)} %
                  </TableCell>

                  {/* Sold Date */}
                  <TableCell className="text-slate-600 py-3">
                    {item.soldDate}
                  </TableCell>

                  {/* Loan type */}
                  <TableCell className="py-3">
                    <span className="text-slate-700 font-medium">
                      {formatLoanType(item.loanType)}
                    </span>
                  </TableCell>

                  {/* Action: Red Shopping Cart Button */}
                  <TableCell className="text-right py-3 pr-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPayment(item)}
                      title="ពិនិត្យមើល និងបង់ប្រាក់"
                      className="inline-flex items-center justify-center h-6 w-6 rounded-[2px] bg-[#ea4335] hover:bg-[#d32f2f] text-white shadow-xs transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 7. Payment / Receipt Details Dialog matching Screenshot layout */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          showCloseButton={false}
          className="!max-w-[540px] !p-0 overflow-hidden rounded-md border border-slate-300 shadow-xl bg-white"
        >
          {/* Top Dark Blue Header */}
          <div className="bg-[#102a4e] text-white px-5 py-3 flex items-center justify-between">
            <h2 className="text-[13px] font-bold tracking-tight">
              {selectedRecord?.loanType === "FULL_PAYMENT"
                ? "Customer payment receipt"
                : "Customer loan payment"}
            </h2>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="text-white hover:text-slate-300 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Feedback Alerts */}
            {paySuccess && (
              <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 text-xs py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription>{paySuccess}</AlertDescription>
              </Alert>
            )}
            {payError && (
              <Alert variant="destructive" className="text-xs py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{payError}</AlertDescription>
              </Alert>
            )}

            {/* Vehicle & Customer Summary */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">អតិថិជន</span>
                <span className="font-semibold text-slate-800">{selectedRecord?.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">រថយន្ត</span>
                <span className="font-semibold text-slate-800">
                  {selectedRecord?.brand} {selectedRecord?.model}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">តម្លៃលក់</span>
                <span className="font-semibold text-slate-900">
                  $ {selectedRecord?.soldPrice.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">ប្រភេទ</span>
                <span className="font-semibold text-[#1976d2]">
                  {selectedRecord ? formatLoanType(selectedRecord.loanType) : ""}
                </span>
              </div>
            </div>

            {/* Content depending on Loan Type */}
            {selectedRecord?.loanType === "FULL_PAYMENT" ? (
              selectedRecord.balance > 0 ? (
                <div className="border border-amber-200 bg-amber-50/60 rounded p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <span>ទិញបង់ផ្តាច់ (នៅសល់ប្រាក់មិនទាន់ទូទាត់បង្គ្រប់)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-2.5 rounded border border-amber-200">
                    <div>
                      <span className="text-slate-500 block text-[11px]">បានបង់មុន (Paid):</span>
                      <strong className="text-emerald-700 font-semibold">${selectedRecord.totalPaid.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">នៅខ្វះ (Remaining Balance):</span>
                      <strong className="text-red-700 font-semibold">${selectedRecord.balance.toLocaleString()}</strong>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    កាលបរិច្ឆេទលក់៖ {selectedRecord.soldDate} | លេខវិក្កយបត្រ៖ {selectedRecord.receiptNo}
                  </div>
                </div>
              ) : (
                <div className="border border-emerald-200 bg-emerald-50/50 rounded p-4 text-center space-y-1.5">
                  <CheckCircle2 className="h-9 w-9 text-emerald-600 mx-auto" />
                  <h3 className="text-xs font-bold text-emerald-800">
                    បានទូទាត់បង់ផ្តាច់ ១០០% រួចរាល់
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    រថយន្តនេះត្រូវបានទិញជាសាច់ប្រាក់សុទ្ធ (Cash Payment) ដោយគ្មានជំពាក់ឡើយ។
                  </p>
                  <div className="pt-1 text-[11px] text-slate-500">
                    កាលបរិច្ឆេទលក់៖ {selectedRecord.soldDate} | លេខវិក្កយបត្រ៖ {selectedRecord.receiptNo}
                  </div>
                </div>
              )
            ) : (
              /* Installment Schedules Table */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">
                    បង់រួច: <strong className="text-emerald-600">${selectedRecord?.totalPaid.toLocaleString()}</strong> /
                    នៅសល់: <strong className="text-red-600">${selectedRecord?.balance.toLocaleString()}</strong>
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    វគ្គបង់រួច: {selectedRecord?.paidCount}/{selectedRecord?.schedulesCount}
                  </span>
                </div>

                <div className="border border-slate-200 rounded overflow-hidden max-h-[220px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-slate-100">
                      <TableRow className="text-[11px]">
                        <TableHead className="h-7 py-1">វគ្គ</TableHead>
                        <TableHead className="h-7 py-1">កាលបរិច្ឆេទ</TableHead>
                        <TableHead className="h-7 py-1">សរុបត្រូវបង់</TableHead>
                        <TableHead className="h-7 py-1">ស្ថានភាព</TableHead>
                        <TableHead className="h-7 py-1 text-right pr-2">សកម្មភាព</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRecord?.schedules.map((schedule) => (
                        <TableRow key={schedule.id} className="text-xs">
                          <TableCell className="py-1.5 font-semibold">#{schedule.installmentNo}</TableCell>
                          <TableCell className="py-1.5">{schedule.dueDate}</TableCell>
                          <TableCell className="py-1.5 font-semibold text-slate-900">${schedule.totalDue.toLocaleString()}</TableCell>
                          <TableCell className="py-1.5">
                            {schedule.status === "PAID" ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                បង់រួច
                              </span>
                            ) : schedule.status === "PARTIAL" ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                                បង់មួយចំណែក (${schedule.paidAmount})
                              </span>
                            ) : schedule.status === "OVERDUE" ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800">
                                ហួសកំណត់
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                                រង់ចាំបង់
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-1.5 text-right pr-2">
                            {schedule.status !== "PAID" && (
                              <button
                                type="button"
                                disabled={payingScheduleId === schedule.id}
                                onClick={() => handlePayInstallment(schedule.id, schedule.totalDue)}
                                className="h-6 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 rounded cursor-pointer"
                              >
                                {payingScheduleId === schedule.id ? "..." : "បង់ប្រាក់"}
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-[32px] px-4 text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-[2px] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
