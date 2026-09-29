"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowRight, User, DollarSign, Calendar } from "lucide-react";

export interface RecentSaleItem {
  id: string;
  receiptNo: string;
  soldDate: string;
  soldPrice: number;
  grossProfit: number;
  marginPercent: number;
  customerName: string;
  customerPhone: string;
  loanType: string;
  vehicle: {
    vin: string;
    brand: string;
    model: string;
    madeYear: number;
    color: string;
  };
}

interface RecentSalesTableProps {
  sales: RecentSaleItem[];
}

export function RecentSalesTable({ sales }: RecentSalesTableProps) {
  return (
    <Card className="col-span-full lg:col-span-4 border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            Recent Sales Activity
          </CardTitle>
          <CardDescription className="text-xs">
            Latest vehicle sales orders, buyer info, and financial margins
          </CardDescription>
        </div>
        <Link href="/sales">
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-8">
            <span>View All Sales</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {sales.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground text-xs">
            <ShoppingCart className="h-10 w-10 mb-3 opacity-25" />
            <p className="font-semibold text-foreground">No sales orders recorded yet</p>
            <p className="mt-1 text-muted-foreground max-w-xs">
              Sold cars and customer payment schedules will automatically appear here once recorded.
            </p>
            <Link href="/sales/new" className="mt-4">
              <Button size="sm" className="h-8 text-xs">
                + Create First Sale
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground text-left">
                  <th className="py-2.5 px-4 font-semibold">Vehicle</th>
                  <th className="py-2.5 px-3 font-semibold">Buyer</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Sold Price</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Gross Margin</th>
                  <th className="py-2.5 px-3 font-semibold">Payment Plan</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sales.slice(0, 5).map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-foreground">
                        {s.vehicle.madeYear} {s.vehicle.brand} {s.vehicle.model}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        VIN: {s.vehicle.vin}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-foreground">{s.customerName}</div>
                      <div className="text-[11px] text-muted-foreground">{s.customerPhone}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                      ${s.soldPrice.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <span className="font-bold text-emerald-600">
                        +${s.grossProfit.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        ({s.marginPercent}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          s.loanType === "FULL_PAYMENT"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {s.loanType === "FULL_PAYMENT" ? "100% Cash" : "Installment"}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                      {s.soldDate.slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
