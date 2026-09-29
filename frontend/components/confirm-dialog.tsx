"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "យល់ព្រម (Confirm)",
  cancelText = "បោះបង់ (Cancel)",
  variant = "destructive",
  icon,
  loading: externalLoading,
  onConfirm,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading ?? internalLoading;

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      console.error("Confirmation error:", err);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isLoading && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[420px] p-6 gap-5 bg-card text-card-foreground border-border shadow-2xl">
        <div className="flex flex-col items-center text-center gap-3">
          {icon ? (
            icon
          ) : variant === "destructive" ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive border border-destructive/25">
              <AlertCircle className="h-6 w-6" />
            </div>
          ) : null}

          <DialogHeader className="gap-1.5 p-0">
            <DialogTitle className="text-center text-lg font-semibold tracking-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="flex-row gap-2.5 sm:justify-center border-t-0 bg-transparent p-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 cursor-pointer font-medium"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 cursor-pointer font-medium gap-1.5"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isLoading ? "កំពុងដំណើរការ..." : confirmText}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
