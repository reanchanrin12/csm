"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import type { UserRole } from "@csm/contracts";

interface AccessDeniedProps {
  userRole?: UserRole | string;
  onBack?: () => void;
}

export function AccessDenied({ userRole, onBack }: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 text-center shadow-xs">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-3">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">
          មិនមានសិទ្ធិចូលទំព័រនេះទេ (Access Denied)
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          គណនីរបស់អ្នកមានតួនាទី{" "}
          <strong className="text-slate-800 uppercase">{userRole || "User"}</strong>{" "}
          ដែលមិនមានការអនុញ្ញាតឱ្យបើកមើលផ្នែកនេះឡើយ។ សូមទាក់ទង Administrator។
        </p>
        <div className="mt-5">
          <button
            onClick={onBack ? onBack : () => router.push("/")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>ត្រឡប់ទៅ Dashboard វិញ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
