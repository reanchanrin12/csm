"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  TableProperties,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";
import { salesService, CustomerPaymentRecord } from "@/lib/api";

export default function HistoryPaymentReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 font-sans">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-[#1c3d73]" />
          <p className="text-sm font-medium">កំពុងផ្ទុកទិន្នន័យ (Loading History Payment)...</p>
        </div>
      }
    >
      <HistoryPaymentContent />
    </Suspense>
  );
}

function HistoryPaymentContent() {
  const [loans, setLoans] = useState<CustomerPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchLoanCode, setSearchLoanCode] = useState("");
  const [selectedLoan, setSelectedLoan] = useState<CustomerPaymentRecord | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await salesService.getLoans();
      setLoans(data || []);
      const first = data?.[0];
      if (first) {
        setSelectedLoan(first);
        setSearchLoanCode(first.loanCode || "");
      }
    } catch (err) {
      console.error("Failed to load history payment report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => {
    const q = searchLoanCode.trim().toLowerCase();
    const found = loans.find(
      (l) =>
        (l.loanCode && l.loanCode.toLowerCase().includes(q)) ||
        (l.receiptNo && l.receiptNo.toLowerCase().includes(q)) ||
        (l.id && l.id.toLowerCase().includes(q))
    );
    if (found) {
      setSelectedLoan(found);
    }
  };

  const formatMoney = (val?: number | null) => {
    const num = Number(val || 0);
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Paid schedules
  const paidSchedules = useMemo(() => {
    if (!selectedLoan || !selectedLoan.schedules) return [];
    return selectedLoan.schedules.filter((s) => s.status === "PAID" || Number(s.paidAmount || 0) > 0);
  }, [selectedLoan]);

  // Totals
  const totalPrincipal = useMemo(() => {
    return paidSchedules.reduce((sum, s) => sum + Number(s.principal || 0), 0);
  }, [paidSchedules]);

  const totalInterest = useMemo(() => {
    return paidSchedules.reduce((sum, s) => sum + Number(s.interest || 0), 0);
  }, [paidSchedules]);

  const totalPenalty = useMemo(() => {
    return paidSchedules.reduce((sum, s) => sum + Number(s.penalty || 0), 0);
  }, [paidSchedules]);

  const totalPaid = useMemo(() => {
    return paidSchedules.reduce((sum, s) => sum + Number(s.paidAmount || 0), 0);
  }, [paidSchedules]);

  return (
    <div className="bg-white min-h-[calc(100vh-80px)] font-sans antialiased text-[#212529] pb-12">
      {/* ── 1. Breadcrumb (Exact Screenshot 2) ── */}
      <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f0f3f6] border border-[#e2e8f0] rounded text-xs text-slate-600 w-fit mb-4">
        <TableProperties className="h-3.5 w-3.5 text-[#0066cc]" />
        <Link href="/" className="text-[#0066cc] hover:underline font-normal">
          Dashboard
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <span className="text-slate-500">History payment Report</span>
      </div>

      {/* ── 2. Payment Filter Card (Exact Screenshot 2) ── */}
      <div className="border border-[#e2e8f0] rounded p-4 mb-6 bg-white shadow-2xs max-w-xl">
        <div className="text-[13px] font-bold text-[#333] flex items-center gap-1.5 mb-3">
          <Filter className="h-3.5 w-3.5 text-[#555]" />
          <span>Payment Filter</span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-600">Loan Code</label>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-slate-300 rounded overflow-hidden">
              <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1.5 border-r border-slate-300 font-medium">
                Loan
              </span>
              <input
                type="text"
                placeholder="LD2015930291"
                value={searchLoanCode}
                onChange={(e) => setSearchLoanCode(e.target.value)}
                className="h-8 px-2.5 text-xs focus:outline-none w-[180px] sm:w-[220px]"
              />
            </div>

            {/* Red Search Button */}
            <button
              onClick={handleSearch}
              className="h-8 px-4 bg-[#d9534f] hover:bg-[#c9302c] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="h-3 w-3" />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Centered Title & Subtitle (Exact Screenshot 2) ── */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-normal text-[#333]">History Payment</h1>
        <p className="text-xs text-slate-400 mt-1">loan payment history</p>
      </div>

      {/* ── 4. Metadata Summary Bar (Exact Screenshot 2) ── */}
      <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-700 mb-3 px-1">
        <div className="space-y-1">
          <p>
            Total Balance : <span className="text-rose-600 font-bold">{formatMoney(selectedLoan?.balance || 0)}</span>
          </p>
          <p className="text-slate-600 font-normal">
            Disbursement Date : <span className="font-medium text-slate-800">{selectedLoan?.soldDate ? selectedLoan.soldDate.slice(0, 10) : "—"}</span>
          </p>
        </div>
        <div className="space-y-1 text-right">
          <p className="font-mono">
            Loan Code : <span className="font-bold text-slate-900">{selectedLoan?.loanCode || "—"}</span>
          </p>
          <p className="text-slate-600 font-normal">
            Payment status : <span className="font-medium text-emerald-600">{selectedLoan?.balance === 0 ? "PAID" : "ACTIVE"}</span>
          </p>
        </div>
      </div>

      {/* ── 5. Table (Exact Screenshot 2) ── */}
      <div className="border border-slate-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-300 text-slate-700 font-semibold text-[11px] bg-slate-50">
                <th className="py-2.5 px-3">#No</th>
                <th className="py-2.5 px-3">Trans Name</th>
                <th className="py-2.5 px-3">Paid Date</th>
                <th className="py-2.5 px-3">Reciept No</th>
                <th className="py-2.5 px-3 text-right">Principal</th>
                <th className="py-2.5 px-3 text-right">Interest</th>
                <th className="py-2.5 px-3 text-right">Penalty</th>
                <th className="py-2.5 px-3 text-right">Paid Amount</th>
                <th className="py-2.5 px-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Loading payment history...
                  </td>
                </tr>
              ) : paidSchedules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No payment transactions recorded for this loan
                  </td>
                </tr>
              ) : (
                paidSchedules.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-600">{idx + 1}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">Installment #{s.installmentNo}</td>
                    <td className="py-2 px-3 text-slate-600">{s.paidDate ? s.paidDate.slice(0, 10) : "—"}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                      {selectedLoan?.receiptNo || "—"}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-800">{formatMoney(s.principal)}</td>
                    <td className="py-2 px-3 text-right text-slate-800">{formatMoney(s.interest)}</td>
                    <td className="py-2 px-3 text-right text-slate-800">{formatMoney(s.penalty)}</td>
                    <td className="py-2 px-3 text-right font-medium text-emerald-600">{formatMoney(s.paidAmount)}</td>
                    <td className="py-2 px-3 text-right text-slate-800">{formatMoney(selectedLoan?.balance)}</td>
                  </tr>
                ))
              )}

              {/* Yellow Total Row (Exact Screenshot 2) */}
              <tr className="bg-[#fff8db] border-t-2 border-[#f1e4b3] font-bold text-slate-800">
                <td colSpan={4} className="py-2 px-3 text-right pr-4">
                  Total :
                </td>
                <td className="py-2 px-3 text-right">{formatMoney(totalPrincipal)}</td>
                <td className="py-2 px-3 text-right">{formatMoney(totalInterest)}</td>
                <td className="py-2 px-3 text-right">{formatMoney(totalPenalty)}</td>
                <td className="py-2 px-3 text-right">{formatMoney(totalPaid)}</td>
                <td className="py-2 px-3 text-right">{formatMoney(selectedLoan?.balance || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
