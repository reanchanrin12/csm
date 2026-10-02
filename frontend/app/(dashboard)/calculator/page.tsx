"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TableProperties,
  ShoppingCart,
  List,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleRow {
  time: number;
  principal: number;
  interest: number;
  date: string;
  total: number;
  balance: number;
}

export default function ScheduleCalculatorPage() {
  // Method selection: FLAT (ការប្រាក់ថេរ) vs DECLINING (ថយដើមថយការ)
  const [calculationMethod, setCalculationMethod] = useState<"FLAT" | "DECLINING">("FLAT");

  // Input states strictly matching CSM 1.0 live screenshot
  const [salePrice, setSalePrice] = useState<string>("");
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0] || "";
  });
  const [term, setTerm] = useState<string>("");
  const [termType, setTermType] = useState<string>("");
  const [interval, setInterval] = useState<string>("1");
  const [rate, setRate] = useState<string>("");

  // Modal Dialog states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [scheduleData, setScheduleData] = useState<ScheduleRow[]>([]);

  // Execute preview calculation and open modal
  const handlePreview = () => {
    const principal = parseFloat(salePrice);
    const termNum = parseInt(term, 10);
    const intervalNum = parseInt(interval, 10) || 1;
    const rateNum = parseFloat(rate);

    // If any input is not provided, open modal with empty table matching live reference
    if (
      !principal ||
      principal <= 0 ||
      !termNum ||
      termNum <= 0 ||
      isNaN(rateNum) ||
      rateNum < 0
    ) {
      setScheduleData([]);
      setIsModalOpen(true);
      return;
    }

    // Determine total months and total installment periods
    const isYear = termType.toLowerCase().includes("year");
    const totalMonths = isYear ? termNum * 12 : termNum;
    const totalPeriods = Math.max(1, Math.round(totalMonths / intervalNum));

    // Rate calculation: monthly rate <= 3% or annual > 3%
    const monthlyRate = rateNum <= 3 ? rateNum / 100 : rateNum / 100 / 12;
    const periodRate = monthlyRate * intervalNum;

    const basePrincipalPerPeriod = principal / totalPeriods;
    const startDate = date ? new Date(date) : new Date();

    const rows: ScheduleRow[] = [];
    let remaining = principal;

    for (let i = 1; i <= totalPeriods; i++) {
      const dueDateObj = new Date(startDate);
      dueDateObj.setMonth(dueDateObj.getMonth() + i * intervalNum);
      const formattedDate = dueDateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

      let periodInterest = 0;
      let periodPrincipal = basePrincipalPerPeriod;

      if (calculationMethod === "FLAT") {
        periodInterest = principal * periodRate;
      } else {
        periodInterest = remaining * periodRate;
      }

      remaining = Math.max(0, remaining - periodPrincipal);

      rows.push({
        time: i,
        principal: periodPrincipal,
        interest: periodInterest,
        date: formattedDate,
        total: periodPrincipal + periodInterest,
        balance: remaining,
      });
    }

    setScheduleData(rows);
    setIsModalOpen(true);
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (scheduleData.length === 0) return;

    let csvContent = "Time,Principal,Interest,Date,Total,Balance\n";
    scheduleData.forEach((row) => {
      csvContent += `${row.time},${row.principal.toFixed(2)},${row.interest.toFixed(2)},${row.date},${row.total.toFixed(2)},${row.balance.toFixed(2)}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `loan_schedule_preview_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-5xl">
      {/* 1. Breadcrumb matching CSM 1.0 */}
      <div className="flex items-center gap-2 px-3.5 py-2 bg-[#e9ecef] border border-slate-200/70 text-xs rounded text-slate-600">
        <div className="bg-[#0284c7] text-white p-1 rounded-xs">
          <TableProperties className="h-3.5 w-3.5" />
        </div>
        <Link href="/" className="text-[#1c64f2] hover:underline font-medium">
          Dashboard
        </Link>
        <span className="text-slate-400">&gt;</span>
        <span className="text-slate-600">Schedule calculator</span>
      </div>

      {/* 2. Page Title & Subtitle */}
      <div>
        <h1 className="text-[22px] font-bold text-slate-800 tracking-tight leading-tight">
          Schedule calculator
        </h1>
        <p className="text-[11px] text-slate-500 mt-0.5">forecast loan price</p>
      </div>

      {/* 3. Main Form Container matching live screenshot */}
      <div className="bg-white rounded border border-slate-200/90 p-5 shadow-xs">
        {/* Toggle Calculation Mode (ការប្រាក់ថេរ vs ថយដើមថយការ) */}
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setCalculationMethod("FLAT")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium transition-all cursor-pointer",
              calculationMethod === "FLAT"
                ? "bg-[#1c64f2] text-white shadow-xs"
                : "bg-white text-[#1c64f2] border border-[#1c64f2] hover:bg-[#1c64f2]/5"
            )}
          >
            <span className="font-bold text-sm leading-none">$</span>
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>ការប្រាក់ថេរ</span>
          </button>

          <button
            type="button"
            onClick={() => setCalculationMethod("DECLINING")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium transition-all cursor-pointer",
              calculationMethod === "DECLINING"
                ? "bg-[#1c64f2] text-white shadow-xs"
                : "bg-white text-[#1c64f2] border border-[#1c64f2] hover:bg-[#1c64f2]/5"
            )}
          >
            <span className="font-bold text-sm leading-none">$</span>
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>ថយដើមថយការ</span>
          </button>
        </div>

        {/* Input Form Controls */}
        <div className="space-y-4">
          {/* Sale Price */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Sale price
            </label>
            <input
              type="number"
              step="100"
              placeholder="$ "
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className="w-full sm:w-1/2 px-3 py-1.5 text-xs border rounded border-slate-300 bg-white focus:outline-none focus:border-[#1c64f2] transition-colors"
            />
          </div>

          {/* Dotted Divider */}
          <div className="border-b border-dotted border-slate-200 pt-2" />

          {/* Date */}
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full sm:w-1/2 px-3 py-1.5 text-xs border rounded border-slate-300 bg-white focus:outline-none focus:border-[#1c64f2] transition-colors"
            />
          </div>

          {/* Term & Term Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Term
              </label>
              <input
                type="number"
                placeholder="term"
                min="1"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 bg-white focus:outline-none focus:border-[#1c64f2] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Term type
              </label>
              <select
                value={termType}
                onChange={(e) => setTermType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 bg-white focus:outline-none focus:border-[#1c64f2] transition-colors"
              >
                <option value="">-- Select --</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
          </div>

          {/* Interval & Rate % */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Interval
              </label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 bg-white focus:outline-none focus:border-[#1c64f2] transition-colors"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="6">6</option>
                <option value="12">12</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                Rate %
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="rate (%)"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 bg-white focus:outline-none focus:border-[#1c64f2] transition-colors"
              />
            </div>
          </div>

          {/* Single Red Preview Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#e02424] hover:bg-[#c81e1e] text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
            >
              <List className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Modal Popup: "Preview Schedule for loan" matching live screenshot */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-300">
            {/* Dark Blue Modal Header */}
            <div className="bg-[#112d59] text-white px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide">
                Preview Schedule for loan
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Table matching live screenshot */}
            <div className="p-4 max-h-[60vh] overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[500px] whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2 px-3 text-center w-14">Time</th>
                    <th className="py-2 px-3 text-right">Principal</th>
                    <th className="py-2 px-3 text-right">Interest</th>
                    <th className="py-2 px-3 text-center">Date</th>
                    <th className="py-2 px-3 text-right">Total</th>
                    <th className="py-2 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {scheduleData.map((row) => (
                    <tr key={row.time} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 text-center font-mono text-slate-500">
                        {row.time}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        ${row.principal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-amber-600">
                        ${row.interest.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2 px-3 text-center font-medium">
                        {row.date}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ${row.total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">
                        ${row.balance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer: Print to excel & Close buttons */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1c64f2] hover:bg-[#1a56db] rounded transition-colors shadow-xs cursor-pointer"
              >
                Print to excel
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
