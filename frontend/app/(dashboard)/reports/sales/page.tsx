"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TableProperties, Search, Filter } from "lucide-react";
import { salesService } from "@/lib/api";
import { TablePagination } from "@/components/ui/table-pagination";

interface SaleOrderReportItem {
  id: string;
  receiptNo: string;
  soldDate: string;
  soldPrice: number;
  purchaseCost: number;
  taxCost: number;
  clearanceCost: number;
  containerCost: number;
  laborCost: number;
  transportCost: number;
  repairCost: number;
  totalLandedCost: number;
  grossProfit: number;
  customerName: string;
  customerPhone?: string | null;
  sellerName?: string | null;
  vehicle: {
    vin: string;
    brand: string;
    model: string;
    madeYear?: number | null;
    exteriorColor?: string | null;
    branch?: string | null;
  };
}

export default function SalesReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 font-sans text-xs">
          Loading sales report...
        </div>
      }
    >
      <SalesReportContent />
    </Suspense>
  );
}

function SalesReportContent() {
  const searchParams = useSearchParams();
  const paramView = searchParams.get("view"); // "details" | "summary"
  const isSummary = paramView === "summary";

  const [sales, setSales] = useState<SaleOrderReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters matching Screenshots 1 & 2
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [summaryBy, setSummaryBy] = useState<"Daily" | "Monthly" | "Yearly">("Daily");

  // Applied filter state (triggers on clicking Search)
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  // Pagination for Details view
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const data = await salesService.list();
      const rawSales = (Array.isArray(data) ? data : []) as any[];

      const mapped: SaleOrderReportItem[] = rawSales.map((s) => {
        const soldPrice = Number(s.soldPrice || 0);
        const purchaseCost = Number(s.purchaseCost ?? s.vehicle?.purchaseCost ?? 0);
        const taxCost = Number(s.taxCost ?? s.tax ?? 0);
        const clearanceCost = Number(s.clearanceCost ?? s.clear ?? 0);
        const containerCost = Number(s.containerCost ?? s.container ?? 0);
        const laborCost = Number(s.laborCost ?? s.laborFee ?? 0);
        const transportCost = Number(s.transportCost ?? s.transport ?? 0);
        const repairCost = Number(s.repairCost ?? s.repair ?? 0);
        const totalLandedCost = Number(
          s.totalLandedCost ??
            (purchaseCost + taxCost + clearanceCost + containerCost + laborCost + transportCost + repairCost)
        );
        const grossProfit = Number(s.grossProfit ?? (soldPrice - totalLandedCost));

        return {
          id: s.id,
          receiptNo: s.receiptNo || s.invoiceNumber || `REC-${s.id.slice(0, 6)}`,
          soldDate: s.soldDate || s.createdAt || "",
          soldPrice,
          purchaseCost,
          taxCost,
          clearanceCost,
          containerCost,
          laborCost,
          transportCost,
          repairCost,
          totalLandedCost,
          grossProfit,
          customerName: s.customerName || s.customer?.name || "N/A",
          customerPhone: s.customerPhone || s.customer?.phone,
          sellerName: s.sellerName || s.seller?.englishName || "",
          vehicle: {
            vin: s.vehicle?.vin || "—",
            brand: s.vehicle?.brand || s.vehicle?.model?.brand?.name || "—",
            model: s.vehicle?.model || s.vehicle?.model?.name || "—",
            madeYear: s.vehicle?.madeYear,
            exteriorColor: s.vehicle?.exteriorColor || s.vehicle?.color || "—",
            branch: s.vehicle?.branch || s.vehicle?.currentBranch?.name || "—",
          },
        };
      });

      setSales(mapped);
    } catch (err) {
      console.error("Failed to load sales report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const handleSearch = () => {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
    setCurrentPage(1);
  };

  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      const itemDate = item.soldDate ? item.soldDate.slice(0, 10) : "";
      if (appliedFrom && itemDate && itemDate < appliedFrom) return false;
      if (appliedTo && itemDate && itemDate > appliedTo) return false;
      return true;
    });
  }, [sales, appliedFrom, appliedTo]);

  const formatMoney = (val?: number | null) => {
    const num = Number(val || 0);
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Grouping for Summary View (Daily, Monthly, Yearly)
  const summaryRows = useMemo(() => {
    const map = new Map<string, { count: number; saleAmount: number; totalCost: number; profit: number }>();
    filteredSales.forEach((s) => {
      let key = s.soldDate ? s.soldDate.slice(0, 10) : "N/A";
      if (summaryBy === "Monthly" && s.soldDate) {
        key = s.soldDate.slice(0, 7);
      } else if (summaryBy === "Yearly" && s.soldDate) {
        key = s.soldDate.slice(0, 4);
      }

      const existing = map.get(key) || { count: 0, saleAmount: 0, totalCost: 0, profit: 0 };
      map.set(key, {
        count: existing.count + 1,
        saleAmount: existing.saleAmount + s.soldPrice,
        totalCost: existing.totalCost + s.totalLandedCost,
        profit: existing.profit + s.grossProfit,
      });
    });

    return Array.from(map.entries())
      .map(([dateKey, val]) => ({ dateKey, ...val }))
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [filteredSales, summaryBy]);

  // Totals for Details View
  const totalCostDetails = useMemo(() => filteredSales.reduce((sum, i) => sum + i.purchaseCost, 0), [filteredSales]);
  const totalLandedDetails = useMemo(() => filteredSales.reduce((sum, i) => sum + i.totalLandedCost, 0), [filteredSales]);
  const totalSalePriceDetails = useMemo(() => filteredSales.reduce((sum, i) => sum + i.soldPrice, 0), [filteredSales]);
  const totalProfitDetails = useMemo(() => filteredSales.reduce((sum, i) => sum + i.grossProfit, 0), [filteredSales]);

  // Totals for Summary View
  const totalSummaryQty = useMemo(() => summaryRows.reduce((sum, r) => sum + r.count, 0), [summaryRows]);
  const totalSummarySale = useMemo(() => summaryRows.reduce((sum, r) => sum + r.saleAmount, 0), [summaryRows]);
  const totalSummaryCost = useMemo(() => summaryRows.reduce((sum, r) => sum + r.totalCost, 0), [summaryRows]);
  const totalSummaryProfit = useMemo(() => summaryRows.reduce((sum, r) => sum + r.profit, 0), [summaryRows]);

  // Export CSV
  const handleExportCsv = () => {
    if (isSummary) {
      const headers = ["Date", "Sale Qty", "Sale Amount", "Total Cost", "Total Profit"];
      const rows = summaryRows.map((r) => [
        r.dateKey,
        r.count,
        r.saleAmount.toFixed(2),
        r.totalCost.toFixed(2),
        r.profit.toFixed(2),
      ]);
      const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csv);
      link.download = `sale_summary_report_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    } else {
      const headers = [
        "#",
        "Receipt No",
        "Name",
        "Brand",
        "Model",
        "Year",
        "Color",
        "Vin Number",
        "Cost",
        "Tax",
        "Clear",
        "Container",
        "LaborFee",
        "Transport",
        "Repair",
        "TotalCost",
        "SalePrice",
        "Profit",
        "SoldDate",
      ];
      const rows = filteredSales.map((s, idx) => [
        idx + 1,
        s.receiptNo,
        s.customerName,
        s.vehicle.brand,
        s.vehicle.model,
        s.vehicle.madeYear || "",
        s.vehicle.exteriorColor || "",
        s.vehicle.vin,
        s.purchaseCost.toFixed(2),
        s.taxCost.toFixed(2),
        s.clearanceCost.toFixed(2),
        s.containerCost.toFixed(2),
        s.laborCost.toFixed(2),
        s.transportCost.toFixed(2),
        s.repairCost.toFixed(2),
        s.totalLandedCost.toFixed(2),
        s.soldPrice.toFixed(2),
        s.grossProfit.toFixed(2),
        s.soldDate ? s.soldDate.slice(0, 10) : "",
      ]);
      const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((row) => row.map((c) => `"${c}"`).join(","))].join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csv);
      link.download = `sale_details_report_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-80px)] font-sans antialiased text-[#212529] pb-12">
      {/* ── 1. Breadcrumbs (Exact Screenshots 1 & 2) ── */}
      <div className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f0f3f6] border border-[#e2e8f0] rounded text-xs text-slate-600 w-fit mb-4">
        <TableProperties className="h-3.5 w-3.5 text-[#0066cc]" />
        <Link href="/" className="text-[#0066cc] hover:underline font-normal">
          Dashboard
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <span className="text-slate-500">
          {isSummary ? "Report Sale Summary" : "Sale report"}
        </span>
      </div>

      {/* ── 2. Filter Sold Card (Exact Screenshots 1 & 2) ── */}
      <div className="border border-[#e2e8f0] rounded p-4 mb-4 bg-white shadow-2xs">
        <div className="text-[13px] font-bold text-[#333] flex items-center gap-1.5 mb-3">
          <Filter className="h-3.5 w-3.5 text-[#555]" />
          <span>Filter sold</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
            {/* Date from */}
            <div className="w-full sm:w-44">
              <label className="text-[11px] font-semibold text-[#555] block mb-1">
                Date from
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 text-xs border border-[#ced4da] rounded px-2.5 text-[#495057] w-full bg-white focus:border-[#80bdff] focus:outline-none"
              />
            </div>

            {/* Date to */}
            <div className="w-full sm:w-44">
              <label className="text-[11px] font-semibold text-[#555] block mb-1">
                Date to
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 text-xs border border-[#ced4da] rounded px-2.5 text-[#495057] w-full bg-white focus:border-[#80bdff] focus:outline-none"
              />
            </div>

            {/* Summary By dropdown (ONLY on Sale Summary - Screenshot 2) */}
            {isSummary && (
              <div className="w-full sm:w-36">
                <label className="text-[11px] font-semibold text-[#555] block mb-1">
                  Summary By
                </label>
                <select
                  value={summaryBy}
                  onChange={(e) => setSummaryBy(e.target.value as any)}
                  className="h-8 text-xs border border-[#ced4da] rounded px-2 text-[#495057] w-full bg-white focus:border-[#80bdff] focus:outline-none cursor-pointer"
                >
                  <option value="Daily">Daily</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
            )}

            {/* Search Button (Red matching screenshot) */}
            <div>
              <button
                type="button"
                onClick={handleSearch}
                className="h-8 px-4 bg-[#d9534f] hover:bg-[#c9302c] active:bg-[#ac2925] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Search className="h-3 w-3" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Export out Button (Blue matching screenshot) */}
          <div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="h-8 px-4 bg-[#337ab7] hover:bg-[#286090] active:bg-[#204d74] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              Export out
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Table Views: SALE DETAILS (Screenshot 1) vs SALE SUMMARY (Screenshot 2) ── */}
      {isSummary ? (
        /* ═══════════ SALE SUMMARY TABLE (Screenshot 2) ═══════════ */
        <div className="w-full overflow-x-auto border border-[#dee2e6] rounded">
          <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-[#1f385c] text-white font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-center">Sale Qty</th>
                <th className="py-2.5 px-3 text-right">Sale Amount</th>
                <th className="py-2.5 px-3 text-right">Total Cost</th>
                <th className="py-2.5 px-3 text-right">Total Profit</th>
              </tr>
            </thead>
            <tbody>
              {/* Yellow Total Summary Row (Exact Screenshot 2) */}
              <tr className="bg-[#fff8db] border-b border-[#f0e4b8] font-bold text-[#333]">
                <td className="py-2 px-3 text-right">Total :</td>
                <td className="py-2 px-3 text-center">{totalSummaryQty}</td>
                <td className="py-2 px-3 text-right">{formatMoney(totalSummarySale)}</td>
                <td className="py-2 px-3 text-right">{formatMoney(totalSummaryCost)}</td>
                <td className="py-2 px-3 text-right">{formatMoney(totalSummaryProfit)}</td>
              </tr>

              {summaryRows.map((r, idx) => (
                <tr
                  key={idx}
                  className="border-b border-[#f1f3f5] hover:bg-[#f8f9fa] transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-[#1c3d73]">{r.dateKey}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-medium">{r.count}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-[#212529]">
                    {formatMoney(r.saleAmount)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#495057]">
                    {formatMoney(r.totalCost)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                    {formatMoney(r.profit)}
                  </td>
                </tr>
              ))}

              {summaryRows.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[#6c757d]">
                    No sales summary records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ═══════════ SALE DETAILS TABLE (Screenshot 1) ═══════════ */
        <div>
          {/* Subtitle matching Screenshot 1 */}
          <div className="mb-2">
            <p className="text-[12px] text-[#6c757d]">listing all sold car</p>
          </div>

          <div className="w-full overflow-x-auto border border-[#dee2e6] rounded">
            <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-[#1f385c] text-white font-semibold">
                  <th className="py-2.5 px-2 text-center">#</th>
                  <th className="py-2.5 px-3">Receipt No</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Brand</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-2 text-center">Year</th>
                  <th className="py-2.5 px-2">Color</th>
                  <th className="py-2.5 px-3">Vin Number</th>
                  <th className="py-2.5 px-2 text-right">Cost</th>
                  <th className="py-2.5 px-2 text-right">Tax</th>
                  <th className="py-2.5 px-2 text-right">Clear</th>
                  <th className="py-2.5 px-2 text-right">Container</th>
                  <th className="py-2.5 px-2 text-right">LaborFee</th>
                  <th className="py-2.5 px-2 text-right">Transport</th>
                  <th className="py-2.5 px-2 text-right">Repair</th>
                  <th className="py-2.5 px-3 text-right">TotalCost</th>
                  <th className="py-2.5 px-3 text-right">SalePrice</th>
                  <th className="py-2.5 px-2 text-center">Rate</th>
                  <th className="py-2.5 px-3 text-right">Profit</th>
                  <th className="py-2.5 px-3">SoldDate</th>
                </tr>
              </thead>
              <tbody>
                {/* Yellow Total Summary Row (Exact Screenshot 1) */}
                <tr className="bg-[#fff8db] border-b border-[#f0e4b8] font-bold text-[#333]">
                  <td colSpan={15} className="py-2 px-3 text-right">
                    Total :
                  </td>
                  <td className="py-2 px-3 text-right">{formatMoney(totalLandedDetails)}</td>
                  <td className="py-2 px-3 text-right">{formatMoney(totalSalePriceDetails)}</td>
                  <td className="py-2 px-2 text-center">—</td>
                  <td className="py-2 px-3 text-right">{formatMoney(totalProfitDetails)}</td>
                  <td></td>
                </tr>

                {filteredSales
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((s, index) => (
                    <tr
                      key={s.id}
                      className="border-b border-[#f1f3f5] hover:bg-[#f8f9fa] transition-colors"
                    >
                      <td className="py-2.5 px-2 text-center text-[#6c757d]">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#0066cc]">
                        <Link href={`/sales/${s.id}`} className="hover:underline">
                          {s.receiptNo}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#212529]">{s.customerName}</td>
                      <td className="py-2.5 px-3 uppercase text-[#212529]">{s.vehicle.brand}</td>
                      <td className="py-2.5 px-3 uppercase text-[#212529]">{s.vehicle.model}</td>
                      <td className="py-2.5 px-2 text-center text-[#495057]">{s.vehicle.madeYear || "—"}</td>
                      <td className="py-2.5 px-2 uppercase text-[#495057]">{s.vehicle.exteriorColor || "—"}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] uppercase text-[#495057]">
                        {s.vehicle.vin}
                      </td>
                      <td className="py-2.5 px-2 text-right text-[#495057]">{formatMoney(s.purchaseCost)}</td>
                      <td className="py-2.5 px-2 text-right text-[#495057]">{formatMoney(s.taxCost)}</td>
                      <td className="py-2.5 px-2 text-right text-[#495057]">{formatMoney(s.clearanceCost)}</td>
                      <td className="py-2.5 px-2 text-right text-[#495057]">{formatMoney(s.containerCost)}</td>
                      <td className="py-2.5 px-2 text-right text-[#495057]">{formatMoney(s.laborCost)}</td>
                      <td className="py-2.5 px-2 text-right text-[#495057]">{formatMoney(s.transportCost)}</td>
                      <td className="py-2.5 px-2 text-right text-[#495057]">{formatMoney(s.repairCost)}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#212529]">
                        {formatMoney(s.totalLandedCost)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#212529]">
                        {formatMoney(s.soldPrice)}
                      </td>
                      <td className="py-2.5 px-2 text-center text-[#495057]">1.0</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                        {formatMoney(s.grossProfit)}
                      </td>
                      <td className="py-2.5 px-3 text-[#495057]">
                        {s.soldDate ? s.soldDate.slice(0, 10) : "—"}
                      </td>
                    </tr>
                  ))}

                {filteredSales.length === 0 && !loading && (
                  <tr>
                    <td colSpan={20} className="py-12 text-center text-xs text-[#6c757d]">
                      No sold car records found matching the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredSales.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredSales.length}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
