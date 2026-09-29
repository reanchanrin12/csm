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
  Check,
  X,
  RotateCcw,
  FileText,
} from "lucide-react";
import {
  supplierPaymentService,
  type SupplierPaymentRecord,
} from "@/lib/api";

export function SupplierPaymentView() {
  const [records, setRecords] = useState<SupplierPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters matching reference screenshot: Invoice No, Brand, Model, Vin number, Supplier name
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [vinFilter, setVinFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");

  // Modal State matching Screenshot 3
  const [selectedRecord, setSelectedRecord] = useState<SupplierPaymentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supplierPaymentService.list();
      setRecords(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load supplier payments");
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
      const invoiceMatch =
        !invoiceFilter.trim() ||
        r.invoiceNo.toLowerCase().includes(invoiceFilter.trim().toLowerCase());

      const brandMatch =
        !brandFilter.trim() ||
        r.brand.toLowerCase().includes(brandFilter.trim().toLowerCase());

      const modelMatch =
        !modelFilter.trim() ||
        r.model.toLowerCase().includes(modelFilter.trim().toLowerCase());

      const vinMatch =
        !vinFilter.trim() ||
        r.vin.toLowerCase().includes(vinFilter.trim().toLowerCase());

      const supplierMatch =
        !supplierFilter.trim() ||
        r.supplierName.toLowerCase().includes(supplierFilter.trim().toLowerCase());

      return invoiceMatch && brandMatch && modelMatch && vinMatch && supplierMatch;
    });
  }, [records, invoiceFilter, brandFilter, modelFilter, vinFilter, supplierFilter]);

  // Open Payment Modal
  const handleOpenPayment = (record: SupplierPaymentRecord) => {
    setSelectedRecord(record);
    setPayAmount(record.balance > 0 ? record.balance : "");
    setPaidDate(new Date().toISOString().slice(0, 10));
    setComment("");
    setPayError(null);
    setPaySuccess(null);
    setIsModalOpen(true);
  };

  // Submit Supplier Payment
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    if (!payAmount || Number(payAmount) <= 0) {
      setPayError("សូមបញ្ចូលចំនួនទឹកប្រាក់ដែលត្រូវបង់ (Please enter a valid payment amount).");
      return;
    }

    setSaving(true);
    setPayError(null);
    setPaySuccess(null);

    try {
      await supplierPaymentService.pay(selectedRecord.id, {
        amount: Number(payAmount),
        paidDate,
        comment,
      });

      setPaySuccess("ការទូទាត់ប្រាក់ជូនអ្នកផ្គត់ផ្គង់បានជោគជ័យ! (Payment saved successfully)");
      await fetchRecords();

      // Update local modal state
      const newPaid = selectedRecord.paidAmount + Number(payAmount);
      const newBalance = Math.max(0, selectedRecord.totalPrice - newPaid);
      setSelectedRecord({
        ...selectedRecord,
        paidAmount: newPaid,
        balance: newBalance,
      });

      setTimeout(() => {
        setIsModalOpen(false);
      }, 1000);
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Full-Width Light Grey/Blue Breadcrumb Banner matching Screenshot */}
      <div className="w-full bg-[#e8ecf4] border border-[#d8e0ec] rounded-[3px] px-3.5 py-2 flex items-center gap-1.5 text-[12px]">
        <LayoutGrid className="h-3.5 w-3.5 text-[#1976d2] shrink-0" />
        <Link href="/" className="text-[#1976d2] font-semibold hover:underline">
          Dashboard
        </Link>
        <span className="text-slate-400 font-normal">&gt;</span>
        <span className="text-slate-600 font-medium">Supplier Payment</span>
      </div>

      {/* 2. Main Title */}
      <div>
        <h1 className="text-[19px] font-bold text-[#2c3e50] tracking-tight">
          Supplier payment list
        </h1>
      </div>

      {/* 3. Filter Section in a single horizontal row (Exact Screenshot 111235) */}
      <div className="flex items-center gap-4 flex-wrap pt-1 pb-2">
        <div className="flex flex-col gap-1 w-[160px]">
          <label className="text-[12px] font-bold text-[#1f3a60]">
            Invoice No
          </label>
          <input
            type="text"
            placeholder="invoice number"
            value={invoiceFilter}
            onChange={(e) => setInvoiceFilter(e.target.value)}
            className="h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
          />
        </div>

        <div className="flex flex-col gap-1 w-[160px]">
          <label className="text-[12px] font-bold text-[#1f3a60]">
            Brand
          </label>
          <input
            type="text"
            placeholder="Car Brand"
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
            placeholder="Car Model"
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
          />
        </div>

        <div className="flex flex-col gap-1 w-[160px]">
          <label className="text-[12px] font-bold text-[#1f3a60]">
            Vin number
          </label>
          <input
            type="text"
            placeholder="Body number"
            value={vinFilter}
            onChange={(e) => setVinFilter(e.target.value)}
            className="h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
          />
        </div>

        <div className="flex flex-col gap-1 w-[180px]">
          <label className="text-[12px] font-bold text-[#1f3a60]">
            Supplier name
          </label>
          <input
            type="text"
            placeholder="Customer name"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
          />
        </div>
      </div>

      {/* 4. Subtitle: "supplier in balance list" */}
      <div>
        <p className="text-[12px] text-slate-500 font-normal">
          supplier in balance list
        </p>
      </div>

      {/* 5. Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading supplier payments</AlertTitle>
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

      {/* 6. Clean Table matching Screenshot 111235 */}
      <div className="border-t border-slate-200 overflow-x-auto">
        <Table>
          <TableHeader className="bg-transparent border-b border-slate-200">
            <TableRow className="hover:bg-transparent text-[12px] font-bold text-[#2c3e50]">
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold pl-1">#</TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">Brand</TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">Model</TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">Vin_No</TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">Supplier_Name</TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">Total_Price</TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">Paid_Amount</TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">Balance</TableHead>
              <TableHead className="h-9 py-2 text-[#2c3e50] font-bold">Status</TableHead>
              <TableHead className="h-9 py-2 text-right pr-2">{/* Action */}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right pr-2">
                    <Skeleton className="h-6 w-6 rounded ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-32 text-center text-xs text-slate-500"
                >
                  {records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 py-4">
                      <FileText className="h-8 w-8 text-slate-300" />
                      <span className="font-medium text-slate-600">
                        មិនទាន់មានទិន្នន័យទិញរថយន្តពីអ្នកផ្គត់ផ្គង់នៅឡើយទេ
                      </span>
                      <span className="text-[11px] text-slate-400">
                        (ទិន្នន័យនឹងបង្ហាញនៅពេលមានការទិញរថយន្តនៅ Buying &gt; Car Purchasing)
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
                  {/* # (Invoice No) */}
                  <TableCell className="font-semibold text-slate-900 py-3 pl-1">
                    {item.invoiceNo}
                  </TableCell>

                  {/* Brand */}
                  <TableCell className="text-slate-800 py-3 uppercase">
                    {item.brand}
                  </TableCell>

                  {/* Model */}
                  <TableCell className="text-slate-700 py-3">
                    {item.model}
                  </TableCell>

                  {/* Vin_No */}
                  <TableCell className="text-slate-700 py-3 font-mono text-[11px]">
                    {item.vin}
                  </TableCell>

                  {/* Supplier_Name */}
                  <TableCell className="text-slate-800 py-3 max-w-[280px] truncate" title={item.supplierName}>
                    {item.supplierName}
                  </TableCell>

                  {/* Total_Price */}
                  <TableCell className="text-slate-800 py-3">
                    ${item.totalPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>

                  {/* Paid_Amount */}
                  <TableCell className="text-slate-700 py-3">
                    ${item.paidAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>

                  {/* Balance */}
                  <TableCell className="py-3 font-bold text-[#ea4335]">
                    ${item.balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-slate-600 py-3 text-[11px]">
                    {item.status}
                  </TableCell>

                  {/* Action: Red Cart Button */}
                  <TableCell className="text-right py-3 pr-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPayment(item)}
                      title="ទូទាត់ប្រាក់ជូនអ្នកផ្គត់ផ្គង់"
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

      {/* 7. Exact Modal Dialog matching Screenshot 3 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          showCloseButton={false}
          className="!max-w-[500px] !p-0 overflow-hidden rounded-md border border-slate-300 shadow-xl bg-white"
        >
          {/* Top Dark Blue Header bar matching Screenshot 3 */}
          <div className="bg-[#102a4e] text-white px-5 py-3 flex items-center justify-between">
            <h2 className="text-[13px] font-bold tracking-tight">Supplier payment</h2>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="text-white hover:text-slate-300 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSavePayment} className="p-6 space-y-4">
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

            {/* Big Balance Callout: Balance : $ 1.00 */}
            <div className="text-[16px] font-bold text-slate-800">
              Balance :{" "}
              <span className="text-[#ea4335] font-extrabold ml-1">
                $
                {(selectedRecord?.balance ?? 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Inputs Grid: Amount + Paid date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-[#1f3a60]">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="amout to be paid"
                  value={payAmount}
                  onChange={(e) =>
                    setPayAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full h-[32px] px-2.5 text-xs border border-slate-300 rounded-[2px] focus:outline-none focus:border-[#409eff]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-bold text-[#1f3a60]">Paid date</label>
                <input
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  className="w-full h-[32px] px-2.5 text-xs border border-slate-300 rounded-[2px] focus:outline-none focus:border-[#409eff]"
                  required
                />
              </div>
            </div>

            {/* Comment Textarea */}
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-[#1f3a60]">Comment</label>
              <textarea
                rows={3}
                placeholder="node somcthing of this payment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-[2px] focus:outline-none focus:border-[#409eff] resize-none"
              />
            </div>

            {/* Dialog Footer: Close (outline) + Save (blue button with check) */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-[32px] px-4 text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-[2px] cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-[32px] px-4 text-xs font-semibold bg-[#1976d2] hover:bg-[#1565c0] text-white rounded-[2px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
