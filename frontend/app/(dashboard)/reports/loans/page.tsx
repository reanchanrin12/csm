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

export default function ArrearsPaymentReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 font-sans">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-[#1c3d73]" />
          <p className="text-sm font-medium">កំពុងផ្ទុកទិន្នន័យ (Loading Arrears Report)...</p>
        </div>
      }
    >
      <ArrearsPaymentContent />
    </Suspense>
  );
}

function ArrearsPaymentContent() {
  const [loans, setLoans] = useState<CustomerPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await salesService.getLoans();
      setLoans(data || []);
    } catch (err) {
      console.error("Failed to load arrears report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => {
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
  };

  const formatMoney = (val?: number | null) => {
    const num = Number(val || 0);
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Compute arrears items (schedules with OVERDUE or PENDING past due date)
  const arrearsList = useMemo(() => {
    const list: {
      id: string;
      ldid: string;
      cusName: string;
      gender: string;
      phone: string;
      arrearPrincipal: number;
      arrearInterest: number;
      totalArrear: number;
      disbursementDate: string;
      dueDate: string;
      defaultDay: number;
    }[] = [];

    const now = new Date();

    loans.forEach((loan) => {
      // Find overdue schedules
      const overdueSchedules = (loan.schedules || []).filter((s) => {
        const due = new Date(s.dueDate);
        return s.status === "OVERDUE" || (s.status === "PENDING" && due < now);
      });

      if (overdueSchedules.length > 0) {
        let principalSum = 0;
        let interestSum = 0;
        let totalSum = 0;
        let minDue = overdueSchedules[0]?.dueDate || "";

        overdueSchedules.forEach((sch) => {
          principalSum += Number(sch.principal || 0);
          interestSum += Number(sch.interest || 0);
          totalSum += Number(sch.totalDue || 0);
          if (sch.dueDate < minDue) minDue = sch.dueDate;
        });

        const due = new Date(minDue);
        const diffDays = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));

        // Date filter check
        if (appliedFrom && minDue.slice(0, 10) < appliedFrom) return;
        if (appliedTo && minDue.slice(0, 10) > appliedTo) return;

        list.push({
          id: loan.id,
          ldid: loan.loanCode || "LD" + loan.id.slice(0, 8),
          cusName: loan.customerName || "—",
          gender: "M",
          phone: loan.customerPhone || "—",
          arrearPrincipal: principalSum,
          arrearInterest: interestSum,
          totalArrear: totalSum,
          disbursementDate: loan.soldDate ? loan.soldDate.slice(0, 10) : "—",
          dueDate: minDue.slice(0, 10),
          defaultDay: diffDays,
        });
      }
    });

    return list;
  }, [loans, appliedFrom, appliedTo]);

  return (
    <div className="bg-white min-h-[calc(100vh-80px)] font-sans antialiased text-[#212529] pb-12">
      {/* ── 1. Breadcrumb (Exact Screenshot 1) ── */}
      <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f0f3f6] border border-[#e2e8f0] rounded text-xs text-slate-600 w-fit mb-4">
        <TableProperties className="h-3.5 w-3.5 text-[#0066cc]" />
        <Link href="/" className="text-[#0066cc] hover:underline font-normal">
          Dashboard
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <span className="text-slate-500">Arrears Payment Report</span>
      </div>

      {/* ── 2. Arrear Filter Card (Exact Screenshot 1) ── */}
      <div className="border border-[#e2e8f0] rounded p-4 mb-6 bg-white shadow-2xs max-w-2xl">
        <div className="text-[13px] font-bold text-[#333] flex items-center gap-1.5 mb-3">
          <Filter className="h-3.5 w-3.5 text-[#555]" />
          <span>Arrear Filter</span>
        </div>

        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          {/* From date */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-600">From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 px-2.5 text-xs border border-slate-300 rounded focus:border-[#337ab7] focus:outline-none w-[150px]"
            />
          </div>

          {/* To date */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-600">To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 px-2.5 text-xs border border-slate-300 rounded focus:border-[#337ab7] focus:outline-none w-[150px]"
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

      {/* ── 3. Centered Large Title (Exact Screenshot 1) ── */}
      <h1 className="text-2xl font-normal text-center text-[#333] mb-6">Arrears Payment</h1>

      {/* ── 4. Table (Exact Screenshot 1) ── */}
      <div className="border-t border-b border-slate-200 overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-300 text-slate-700 font-semibold text-[11px]">
              <th className="py-2.5 px-3">#No</th>
              <th className="py-2.5 px-3">LDID</th>
              <th className="py-2.5 px-3">Cus Name</th>
              <th className="py-2.5 px-3">Gender</th>
              <th className="py-2.5 px-3">Phone</th>
              <th className="py-2.5 px-3 text-right">Arrear Principal</th>
              <th className="py-2.5 px-3 text-right">Arrear Interest</th>
              <th className="py-2.5 px-3 text-right">Total Arrear</th>
              <th className="py-2.5 px-3">Disbursment Date</th>
              <th className="py-2.5 px-3">Due Date</th>
              <th className="py-2.5 px-3 text-center">Default Day</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-500">
                  Loading arrears records...
                </td>
              </tr>
            ) : arrearsList.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400">
                  No arrears payment records found
                </td>
              </tr>
            ) : (
              arrearsList.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-600">{idx + 1}</td>
                  <td className="py-2 px-3 font-mono font-medium text-slate-800">{item.ldid}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{item.cusName}</td>
                  <td className="py-2 px-3 text-slate-600">{item.gender}</td>
                  <td className="py-2 px-3 text-slate-600">{item.phone}</td>
                  <td className="py-2 px-3 text-right text-slate-800">{formatMoney(item.arrearPrincipal)}</td>
                  <td className="py-2 px-3 text-right text-slate-800">{formatMoney(item.arrearInterest)}</td>
                  <td className="py-2 px-3 text-right font-semibold text-rose-600">{formatMoney(item.totalArrear)}</td>
                  <td className="py-2 px-3 text-slate-600">{item.disbursementDate}</td>
                  <td className="py-2 px-3 text-slate-600">{item.dueDate}</td>
                  <td className="py-2 px-3 text-center font-bold text-amber-600">{item.defaultDay}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
