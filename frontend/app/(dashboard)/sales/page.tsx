"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  Building2,
  Printer,
  FileText,
  Car,
  Search,
  RotateCcw,
  Eye,
} from "lucide-react";
import { salesService } from "@/lib/api";

interface SaleOrderRow {
  id: string;
  receiptNo: string;
  soldDate: string;
  soldPrice: number;
  interestRate?: number;
  purchaseCost?: number;
  tax?: number;
  clear?: number;
  container?: number;
  laborFee?: number;
  transport?: number;
  repair?: number;
  totalLandedCost: number;
  grossProfit: number;
  marginPercent: number;
  loanType: string;
  customerName: string;
  customerPhone: string;
  sellerName: string;
  vehicle: {
    id: string;
    vin: string;
    engineNumber?: string;
    brand: string;
    model: string;
    madeYear: number;
    color: string;
    branch?: string;
    coverImageUrl?: string | null;
  };
}

export default function SoldListPage() {
  const [sales, setSales] = useState<SaleOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters matching Screenshot 111223
  const [receiptFilter, setReceiptFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [vinFilter, setVinFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await salesService.list()) as SaleOrderRow[];
      setSales(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      if (
        receiptFilter &&
        !item.receiptNo.toLowerCase().includes(receiptFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        brandFilter &&
        !item.vehicle.brand.toLowerCase().includes(brandFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        modelFilter &&
        !item.vehicle.model.toLowerCase().includes(modelFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        vinFilter &&
        !item.vehicle.vin.toLowerCase().includes(vinFilter.toLowerCase())
      ) {
        return false;
      }
      if (dateFilter && !item.soldDate.startsWith(dateFilter)) {
        return false;
      }
      if (branchFilter !== "all") {
        const itemBranch = (item.vehicle.branch || "").toLowerCase();
        if (!itemBranch.includes(branchFilter.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [sales, receiptFilter, brandFilter, modelFilter, vinFilter, dateFilter, branchFilter]);

  const resetFilters = () => {
    setReceiptFilter("");
    setBrandFilter("");
    setModelFilter("");
    setVinFilter("");
    setDateFilter("");
    setBranchFilter("all");
  };

  return (
    <div className="space-y-4">
      {/* 1. Breadcrumb Bar matching Legacy Screenshot */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-[#e9ecef]/60 dark:bg-muted/40 px-3 py-2 rounded-md border border-border/40">
        <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
        <Link href="/" className="text-primary hover:underline font-medium">
          Dashboard
        </Link>
        <span>&gt;</span>
        <span className="text-foreground font-medium">Sale manage</span>
      </div>

      {/* 2. Page Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#212529] dark:text-foreground">
          Sold List
        </h2>
      </div>

      {/* 3. Filter Row matching Screenshot 111223 1:1 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-1">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#1a5fb4] dark:text-blue-400">
            Recept No
          </label>
          <Input
            placeholder="Recept Number"
            value={receiptFilter}
            onChange={(e) => setReceiptFilter(e.target.value)}
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
          <Input
            placeholder="vin no"
            value={vinFilter}
            onChange={(e) => setVinFilter(e.target.value)}
            className="h-9 text-xs bg-white dark:bg-card border-border/70"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#1a5fb4] dark:text-blue-400">
            Sold Date
          </label>
          <Input
            type="date"
            placeholder="sold out date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-9 text-xs bg-white dark:bg-card border-border/70"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#1a5fb4] dark:text-blue-400">
            Branch
          </label>
          <div className="flex gap-1.5">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-card border-border/70">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="-- All --" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- All --</SelectItem>
                <SelectItem value="phnom penh">PHNOM PENH</SelectItem>
                <SelectItem value="siem reap">SIEM REAP</SelectItem>
                <SelectItem value="battambang">BATTAMBANG</SelectItem>
              </SelectContent>
            </Select>

            {(receiptFilter || brandFilter || modelFilter || vinFilter || dateFilter || branchFilter !== "all") && (
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

      {/* 4. Subtitle line */}
      <div className="pt-2">
        <p className="text-xs text-muted-foreground">Listing all sold car ({filteredSales.length})</p>
      </div>

      {/* 5. Data Table matching Screenshot 111223 */}
      <div className="rounded-md border bg-white dark:bg-card shadow-xs overflow-x-auto">
        <Table className="text-xs min-w-[1500px]">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[140px] font-bold text-foreground">#No</TableHead>
              <TableHead className="w-[70px] font-bold text-foreground">Gerllary</TableHead>
              <TableHead className="w-[100px] font-bold text-foreground">Brand</TableHead>
              <TableHead className="w-[110px] font-bold text-foreground">Model</TableHead>
              <TableHead className="w-[160px] font-bold text-foreground">VinNumber</TableHead>
              <TableHead className="w-[120px] font-bold text-foreground">Engine</TableHead>
              <TableHead className="w-[60px] font-bold text-foreground">Year</TableHead>
              <TableHead className="w-[90px] font-bold text-foreground">Color</TableHead>
              <TableHead className="w-[110px] font-bold text-foreground">Branch</TableHead>
              <TableHead className="w-[100px] font-bold text-foreground text-right">SoldPrice</TableHead>
              <TableHead className="w-[60px] font-bold text-foreground text-right">Rate</TableHead>
              <TableHead className="w-[90px] font-bold text-foreground text-right">Cost</TableHead>
              <TableHead className="w-[90px] font-bold text-foreground text-right">Tax</TableHead>
              <TableHead className="w-[80px] font-bold text-foreground text-right">Clear</TableHead>
              <TableHead className="w-[80px] font-bold text-foreground text-right">Container</TableHead>
              <TableHead className="w-[80px] font-bold text-foreground text-right">LaborFee</TableHead>
              <TableHead className="w-[80px] font-bold text-foreground text-right">Transport</TableHead>
              <TableHead className="w-[80px] font-bold text-foreground text-right">Repair</TableHead>
              <TableHead className="w-[90px] font-bold text-foreground text-right">TotalCost</TableHead>
              <TableHead className="w-[90px] font-bold text-foreground text-center">SoldDate</TableHead>
              <TableHead className="w-[70px] font-bold text-foreground text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 21 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={21} className="text-center py-12 text-muted-foreground">
                  No sold vehicle records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => {
                const purchaseCost = sale.purchaseCost || (sale.totalLandedCost ? sale.totalLandedCost * 0.8 : 0);
                const tax = sale.tax || 0;
                const clear = sale.clear || 0;
                const container = sale.container || 0;
                const laborFee = sale.laborFee || 0;
                const transport = sale.transport || 0;
                const repair = sale.repair || 0;
                const rate = sale.interestRate !== undefined ? `${sale.interestRate.toFixed(2)}%` : "0.00%";

                return (
                  <TableRow key={sale.id} className="hover:bg-muted/40 transition-colors">
                    {/* #No */}
                    <TableCell className="font-semibold text-foreground font-mono">
                      {sale.receiptNo}
                    </TableCell>

                    {/* Gerllary */}
                    <TableCell>
                      <div className="h-10 w-14 rounded overflow-hidden bg-muted flex items-center justify-center border shrink-0">
                        {sale.vehicle.coverImageUrl ? (
                          <img
                            src={sale.vehicle.coverImageUrl}
                            alt={sale.vehicle.model}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Car className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>

                    {/* Brand */}
                    <TableCell className="font-medium text-foreground uppercase">
                      {sale.vehicle.brand}
                    </TableCell>

                    {/* Model */}
                    <TableCell className="font-medium uppercase">
                      {sale.vehicle.model}
                    </TableCell>

                    {/* VinNumber */}
                    <TableCell className="font-mono text-muted-foreground">
                      {sale.vehicle.vin}
                    </TableCell>

                    {/* Engine */}
                    <TableCell className="font-mono text-muted-foreground">
                      {sale.vehicle.engineNumber || "N/A"}
                    </TableCell>

                    {/* Year */}
                    <TableCell className="font-mono">
                      {sale.vehicle.madeYear}
                    </TableCell>

                    {/* Color */}
                    <TableCell className="uppercase text-muted-foreground">
                      {sale.vehicle.color}
                    </TableCell>

                    {/* Branch */}
                    <TableCell className="uppercase text-xs font-semibold text-muted-foreground">
                      {sale.vehicle.branch || "PHNOM PENH"}
                    </TableCell>

                    {/* SoldPrice */}
                    <TableCell className="font-bold text-foreground text-right font-mono">
                      ${sale.soldPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>

                    {/* Rate */}
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {rate}
                    </TableCell>

                    {/* Cost */}
                    <TableCell className="text-right font-mono text-muted-foreground">
                      ${purchaseCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>

                    {/* Tax */}
                    <TableCell className="text-right font-mono text-muted-foreground">
                      ${tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>

                    {/* Clear */}
                    <TableCell className="text-right font-mono text-muted-foreground">
                      ${clear.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>

                    {/* Container */}
                    <TableCell className="text-right font-mono text-muted-foreground">
                      ${container.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>

                    {/* LaborFee */}
                    <TableCell className="text-right font-mono text-muted-foreground">
                      ${laborFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>

                    {/* Transport */}
                    <TableCell className="text-right font-mono text-muted-foreground">
                      ${transport.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>

                    {/* Repair */}
                    <TableCell className="text-right font-mono text-muted-foreground">
                      ${repair.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>

                    {/* TotalCost */}
                    <TableCell className="text-right font-mono font-medium text-foreground">
                      ${(sale.totalLandedCost || (purchaseCost + tax + clear + container + laborFee + transport + repair)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>

                    {/* SoldDate */}
                    <TableCell className="text-center font-mono text-muted-foreground text-[11px]">
                      {sale.soldDate ? new Date(sale.soldDate).toISOString().slice(0, 10) : "-"}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-center">
                      <Link href={`/sales/${sale.id}`} className="inline-flex items-center justify-center">
                        <span
                          className="h-7 w-7 rounded-full bg-[#333] hover:bg-black text-white inline-flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                          title="View Sold Details & Update"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
