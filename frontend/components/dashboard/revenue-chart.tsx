"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, DollarSign } from "lucide-react";

export interface MonthlyMetric {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

interface RevenueChartProps {
  data: MonthlyMetric[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute scale max
  const maxVal = Math.max(...data.map((d) => Math.max(d.revenue, d.cost)), 50000);
  const chartHeight = 200;

  return (
    <Card className="col-span-full lg:col-span-4 border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Revenue vs. Landed Cost Trend
          </CardTitle>
          <CardDescription className="text-xs">
            Monthly comparison of total car sales revenue against total landed inventory costs
          </CardDescription>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-primary inline-block" />
            <span className="text-muted-foreground font-medium">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-muted-foreground/30 inline-block" />
            <span className="text-muted-foreground font-medium">Landed Cost</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-emerald-500 inline-block" />
            <span className="text-muted-foreground font-medium">Gross Profit</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* SVG Grouped Bar Chart */}
        <div className="relative pt-6 pb-2">
          {/* Y-axis gridlines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 text-[10px] text-muted-foreground border-b border-border">
            <div className="border-b border-dashed border-border w-full flex justify-between">
              <span>${(maxVal / 1000).toFixed(0)}k</span>
            </div>
            <div className="border-b border-dashed border-border w-full flex justify-between">
              <span>${(maxVal / 2000).toFixed(0)}k</span>
            </div>
            <div className="flex justify-between">
              <span>$0</span>
            </div>
          </div>

          {/* Bars */}
          <div className="relative h-[200px] flex items-end justify-between gap-3 px-6 pt-4">
            {data.map((item, idx) => {
              const revHeight = maxVal > 0 ? (item.revenue / maxVal) * chartHeight : 0;
              const costHeight = maxVal > 0 ? (item.cost / maxVal) * chartHeight : 0;
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-20 z-20 bg-popover text-popover-foreground border border-border rounded-md px-3 py-2 text-xs shadow-md pointer-events-none whitespace-nowrap min-w-[140px] animate-in fade-in-50 zoom-in-95">
                      <p className="font-bold text-foreground mb-1">{item.month} Performance</p>
                      <div className="flex justify-between gap-3 text-[11px]">
                        <span className="text-muted-foreground">Revenue:</span>
                        <span className="font-mono font-semibold text-primary">
                          ${item.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 text-[11px]">
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="font-mono font-semibold text-muted-foreground">
                          ${item.cost.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 text-[11px] pt-1 border-t border-border mt-1">
                        <span className="text-emerald-600 font-medium">Profit:</span>
                        <span className="font-mono font-bold text-emerald-600">
                          +${item.profit.toLocaleString()} ({item.margin}%)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Dual Bars */}
                  <div className="w-full flex items-end justify-center gap-1.5">
                    {/* Revenue Bar */}
                    <div
                      style={{ height: `${Math.max(revHeight, 4)}px` }}
                      className={`w-4 sm:w-6 rounded-t-sm transition-all duration-300 ${
                        item.revenue > 0
                          ? "bg-primary group-hover:brightness-110"
                          : "bg-muted"
                      }`}
                    />
                    {/* Cost Bar */}
                    <div
                      style={{ height: `${Math.max(costHeight, 4)}px` }}
                      className={`w-4 sm:w-6 rounded-t-sm transition-all duration-300 ${
                        item.cost > 0
                          ? "bg-muted-foreground/30 group-hover:bg-muted-foreground/45"
                          : "bg-muted/50"
                      }`}
                    />
                  </div>

                  {/* Month Label */}
                  <span
                    className={`mt-2 text-xs transition-colors ${
                      isHovered ? "font-bold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
