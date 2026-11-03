"use client";

import React, { Suspense } from "react";
import { RepairInfoView } from "@/components/repair/repair-info-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function RepairsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-96" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <RepairInfoView />
    </Suspense>
  );
}

