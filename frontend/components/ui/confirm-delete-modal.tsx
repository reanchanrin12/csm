"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string | undefined;
  itemName?: string | undefined;
  description?: React.ReactNode;
  confirmText?: string | undefined;
  cancelText?: string | undefined;
  loading?: boolean | undefined;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  title = "Confirm Deletion",
  itemName,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
}: ConfirmDeleteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] max-w-[94vw] w-full p-0 overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-2xl">
        {/* Header bar with close button */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-bold text-slate-900 leading-tight">
                {title}
              </DialogTitle>
              <p className="text-[11px] text-slate-500 mt-0.5">
                តើអ្នកប្រាកដថាចង់លុបទិន្នន័យនេះមែនទេ?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 rounded p-1 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 py-3 space-y-2 text-xs text-slate-600">
          {itemName && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-[4px] font-mono text-[13px] font-semibold text-slate-800 break-all">
              {itemName}
            </div>
          )}
          {description ? (
            <div className="text-[12px] text-slate-600 leading-relaxed">
              {description}
            </div>
          ) : (
            <div className="text-[12px] text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this item? This action will remove all associated records and cannot be undone.
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="h-[34px] px-4 border border-[#dcdfe6] text-slate-700 hover:bg-white rounded-[4px] text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-[34px] px-5 bg-[#ea4335] hover:bg-[#d32f2f] text-white rounded-[4px] text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
