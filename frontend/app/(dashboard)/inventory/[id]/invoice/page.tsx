"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function InventoryInvoiceRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    if (resolvedParams.id) {
      router.replace(`/purchasesaveinvoice/${resolvedParams.id}`);
    }
  }, [resolvedParams.id, router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-slate-500 font-sans">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#337ab7] border-t-transparent mb-3" />
      <span className="text-sm">កំពុងបញ្ជូនទៅកាន់ទំព័រវិក្កយបត្រ (Redirecting to invoice)...</span>
    </div>
  );
}
