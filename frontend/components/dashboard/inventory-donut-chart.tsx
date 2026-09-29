"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Car, Building2 } from "lucide-react";

export interface ModelStockItem {
  modelName: string;
  brand: string;
  count: number;
  color: string;
}

interface InventoryDonutChartProps {
  items: ModelStockItem[];
  totalStock: number;
  ppCount: number;
  btbCount: number;
}

export function InventoryDonutChart({
  items,
  totalStock,
  ppCount,
  btbCount,
}: InventoryDonutChartProps) {
  // SVG Donut calculation
  const radius = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Curated color palette
  const colors = [
    "hsl(var(--primary))",
    "hsl(217, 91%, 60%)",
    "hsl(142, 71%, 45%)",
    "hsl(38, 92%, 50%)",
    "hsl(280, 65%, 60%)",
  ];

  let accumulatedPercent = 0;

  return (
    <Card className="col-span-full lg:col-span-3 border-border shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" />
          Inventory by Model
        </CardTitle>
        <CardDescription className="text-xs">
          Stock allocation across vehicle lines and showroom branches
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalStock === 0 ? (
          <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground text-xs">
            <Car className="h-8 w-8 mb-2 opacity-30" />
            No vehicles currently in stock
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            {/* SVG Donut */}
            <div className="relative flex items-center justify-center">
              <svg width="160" height="160" className="transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  className="text-muted/40"
                  strokeWidth={strokeWidth}
                />
                {/* Slices */}
                {items.map((item, idx) => {
                  const percent = totalStock > 0 ? item.count / totalStock : 0;
                  const strokeDasharray = `${percent * circumference} ${circumference}`;
                  const strokeDashoffset = -accumulatedPercent * circumference;
                  accumulatedPercent += percent;
                  const sliceColor = colors[idx % colors.length];

                  return (
                    <circle
                      key={item.modelName}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={sliceColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-500 hover:opacity-80"
                    />
                  );
                })}
              </svg>
              {/* Centered Total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                  {totalStock}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Units in Stock
                </span>
              </div>
            </div>

            {/* Legend & Breakdown */}
            <div className="flex-1 w-full space-y-3">
              <div className="space-y-2">
                {items.slice(0, 4).map((item, idx) => {
                  const percent = totalStock > 0 ? Math.round((item.count / totalStock) * 100) : 0;
                  const dotColor = colors[idx % colors.length];
                  return (
                    <div key={item.modelName} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate max-w-[150px]">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: dotColor }}
                        />
                        <span className="text-foreground font-medium truncate">
                          {item.brand} {item.modelName}
                        </span>
                      </div>
                      <span className="font-mono text-muted-foreground text-xs">
                        {item.count} ({percent}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Branch Allocation Badges */}
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span>Phnom Penh:</span>
                  <span className="font-bold text-foreground font-mono">{ppCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Battambang:</span>
                  <span className="font-bold text-foreground font-mono">{btbCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
