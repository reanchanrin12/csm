"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle, ArrowRight, CheckCircle2, DollarSign } from "lucide-react";

export interface LoanSummaryItem {
  id: string;
  customerName: string;
  customerPhone: string;
  model: string;
  brand: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  monthlyPay: number;
  schedulesCount: number;
  paidCount: number;
  schedules: {
    id: string;
    installmentNo: number;
    dueDate: string;
    totalDue: number;
    paidAmount: number;
    status: string;
  }[];
}

interface LoanCollectionsCardProps {
  loans: LoanSummaryItem[];
}

export function LoanCollectionsCard({ loans }: LoanCollectionsCardProps) {
  const totalFinanced = loans.reduce((sum, l) => sum + Number(l.totalDue || 0), 0);
  const totalCollected = loans.reduce((sum, l) => sum + Number(l.totalPaid || 0), 0);
  const totalOutstanding = totalFinanced - totalCollected;
  const collectionRate = totalFinanced > 0 ? Math.round((totalCollected / totalFinanced) * 100) : 0;

  // Extract pending schedules
  const pendingSchedules: {
    loanId: string;
    customerName: string;
    model: string;
    installmentNo: number;
    dueDate: string;
    totalDue: number;
    status: string;
  }[] = [];

  loans.forEach((l) => {
    l.schedules?.forEach((s) => {
      if (s.status !== "PAID") {
        pendingSchedules.push({
          loanId: l.id,
          customerName: l.customerName,
          model: `${l.brand} ${l.model}`,
          installmentNo: s.installmentNo,
          dueDate: s.dueDate.slice(0, 10),
          totalDue: s.totalDue,
          status: s.status,
        });
      }
    });
  });

  // Sort by due date ascending
  pendingSchedules.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <Card className="col-span-full lg:col-span-3 border-border shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Loan Collections & Cash Flow
          </CardTitle>
          <CardDescription className="text-xs">
            Customer installment schedules and upcoming receivables
          </CardDescription>
        </div>
        <Link href="/schedule">
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-8">
            <span>Schedule</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="rounded-lg bg-muted/40 border border-border/80 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Collection Progress</span>
            <span className="font-bold text-foreground font-mono">{collectionRate}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${collectionRate}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block">Collected</span>
              <span className="font-bold text-emerald-600 font-mono">
                ${totalCollected.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block">Outstanding</span>
              <span className="font-bold text-foreground font-mono">
                ${totalOutstanding.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Dues List */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Upcoming Due Installments
          </h4>

          {pendingSchedules.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-emerald-500 opacity-60" />
              All current loan installments are settled.
            </div>
          ) : (
            <div className="space-y-1.5">
              {pendingSchedules.slice(0, 3).map((item, idx) => (
                <div
                  key={`${item.loanId}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-md border border-border/60 hover:bg-muted/30 text-xs transition-colors"
                >
                  <div className="truncate max-w-[170px]">
                    <div className="font-medium text-foreground truncate">{item.customerName}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {item.model} (#{item.installmentNo})
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold font-mono text-foreground">
                      ${item.totalDue.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      Due: {item.dueDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
