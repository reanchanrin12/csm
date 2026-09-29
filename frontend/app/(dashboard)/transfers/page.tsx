"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  LayoutDashboard,
  RotateCcw,
  Plus,
  Download,
  AlertCircle,
  ArrowRightLeft,
} from "lucide-react";
import { transferService } from "@/lib/api";

interface TransferRecord {
  id: string;
  transferDate: string;
  vehicleVin: string;
  vehicleName: string;
  brand?: string;
  model?: string;
  madeYear?: number;
  sourceBranch: string;
  destBranch: string;
  note?: string;
  createdAt: string;
}

interface VehicleOption {
  id: string;
  vin: string;
  displayName: string;
  currentBranchId: string;
  currentBranchName: string;
}

interface BranchOption {
  id: string;
  name: string;
  address?: string;
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter Bar state matching Screenshot 1:1
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [vinFilter, setVinFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  // Transfer Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [destBranchId, setDestBranchId] = useState("");
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [transfersData, optionsData] = await Promise.all([
        transferService.list() as Promise<TransferRecord[]>,
        transferService.getOptions() as Promise<{
          vehicles: VehicleOption[];
          branches: BranchOption[];
        }>,
      ]);
      setTransfers(transfersData ?? []);
      setVehicles(optionsData.vehicles ?? []);
      setBranches(optionsData.branches ?? []);
      const firstVehicle = optionsData.vehicles?.[0];
      if (firstVehicle) setSelectedVehicleId(firstVehicle.id);
      const firstBranch = optionsData.branches?.[0];
      if (firstBranch) setDestBranchId(firstBranch.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // Filter available destination branches so source and dest aren't the same
  const validDestBranches = branches.filter(
    (b) => b.id !== selectedVehicle?.currentBranchId
  );

  // Filtered transfers based on 4 filter inputs
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      if (
        brandFilter &&
        !t.brand?.toLowerCase().includes(brandFilter.toLowerCase()) &&
        !t.vehicleName?.toLowerCase().includes(brandFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        modelFilter &&
        !t.model?.toLowerCase().includes(modelFilter.toLowerCase()) &&
        !t.vehicleName?.toLowerCase().includes(modelFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        vinFilter &&
        !t.vehicleVin?.toLowerCase().includes(vinFilter.toLowerCase())
      ) {
        return false;
      }
      if (
        yearFilter &&
        !String(t.madeYear || "").includes(yearFilter) &&
        !t.vehicleName?.includes(yearFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [transfers, brandFilter, modelFilter, vinFilter, yearFilter]);

  const resetFilters = () => {
    setBrandFilter("");
    setModelFilter("");
    setVinFilter("");
    setYearFilter("");
  };

  const handleExportCSV = () => {
    if (filteredTransfers.length === 0) {
      alert("No transfer records to export.");
      return;
    }
    const headers = [
      "#",
      "Brand",
      "Model",
      "Vin_Number",
      "Year",
      "Source",
      "Destination",
      "Transfer_Date",
      "Note",
    ];
    const rows = filteredTransfers.map((t, idx) => [
      idx + 1,
      t.brand || "",
      t.model || "",
      t.vehicleVin,
      t.madeYear || "",
      t.sourceBranch,
      t.destBranch,
      t.transferDate ? t.transferDate.slice(0, 10) : "",
      t.note || "",
    ]);

    const csvContent =
      "\uFEFF" +
      [
        headers.join(","),
        ...rows.map((r) =>
          r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `car_transfers_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedVehicleId) {
      setFormError("Please select a vehicle.");
      return;
    }
    if (!destBranchId) {
      setFormError("Please select a destination branch.");
      return;
    }
    if (destBranchId === selectedVehicle?.currentBranchId) {
      setFormError("Destination branch must be different from current branch.");
      return;
    }

    setSubmitting(true);
    try {
      await transferService.create({
        vehicleId: selectedVehicleId,
        destBranchId,
        transferDate: new Date(transferDate).toISOString(),
        note,
      });
      setIsDialogOpen(false);
      setNote("");
      await fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Breadcrumb Bar matching Screenshot 1:1 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-[#e9ecef]/60 dark:bg-muted/40 px-3 py-2 rounded-md border border-border/40">
        <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
        <Link href="/" className="text-primary hover:underline font-medium">
          Dashboard
        </Link>
        <span>&gt;</span>
        <span className="text-foreground font-medium">Transfer</span>
      </div>

      {/* 2. Page Title matching Screenshot */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#212529] dark:text-foreground">
          Car Transfer Info
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          view and manage car transfer
        </p>
      </div>

      {/* 3. Action Buttons Header (+ New car transfer / Export out) */}
      <div className="flex items-center justify-between pt-1">
        {/* Red + New car transfer Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#d9534f] hover:bg-[#c9302c] text-white text-xs font-semibold rounded shadow-xs transition-colors">
              <Plus className="h-3.5 w-3.5" />
              New car transfer
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                Transfer Car to Another Branch
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select an in-stock vehicle and designate the destination showroom branch.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {formError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-xs">Validation Error</AlertTitle>
                  <AlertDescription className="text-xs">{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1">
                <Label htmlFor="vehicleSelect" className="text-xs font-semibold">
                  Vehicle *
                </Label>
                <Select
                  value={selectedVehicleId}
                  onValueChange={setSelectedVehicleId}
                >
                  <SelectTrigger id="vehicleSelect" className="h-9 text-xs">
                    <SelectValue placeholder="Choose a vehicle in stock..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.length === 0 ? (
                      <div className="p-3 text-xs text-muted-foreground text-center">
                        No in-stock vehicles available
                      </div>
                    ) : (
                      vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id} className="text-xs">
                          {v.displayName} [{v.currentBranchName}]
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedVehicle && (
                <div className="p-2.5 border rounded-md bg-muted/20 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Location:</span>
                    <strong className="text-foreground">
                      {selectedVehicle.currentBranchName}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VIN:</span>
                    <span className="font-mono">{selectedVehicle.vin}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="destBranch" className="text-xs font-semibold">
                  Destination Branch *
                </Label>
                <Select
                  value={destBranchId}
                  onValueChange={setDestBranchId}
                >
                  <SelectTrigger id="destBranch" className="h-9 text-xs">
                    <SelectValue placeholder="Select Destination Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {validDestBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="transferDate" className="text-xs font-semibold">
                  Transfer Date *
                </Label>
                <Input
                  id="transferDate"
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="note" className="text-xs font-semibold">
                  Transfer Note / Reason
                </Label>
                <Input
                  id="note"
                  placeholder="e.g. Relocating for Battambang Showroom opening"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="h-8 text-xs bg-[#d9534f] hover:bg-[#c9302c] text-white"
                >
                  {submitting ? "Transferring..." : "Confirm Transfer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Blue Export out Button */}
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white text-xs font-semibold rounded shadow-xs transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export out
        </button>
      </div>

      {/* 4. Tab Header matching Screenshot */}
      <div className="pt-2">
        <div className="border-b border-border/60">
          <span className="inline-block px-4 py-2 text-xs font-semibold text-foreground bg-white dark:bg-card border border-b-0 border-border/60 rounded-t-md -mb-px">
            Car Transfer
          </span>
        </div>

        {/* 5. Inner Card with Subtitle & Filter Form */}
        <div className="rounded-b-md border border-t-0 bg-white dark:bg-card shadow-xs p-4 space-y-4">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Car transfer list
            </h3>
          </div>

          {/* 4 Filters Matching Screenshot 1:1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
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
              <label className="text-xs font-medium text-muted-foreground">
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
              <label className="text-xs font-medium text-muted-foreground">
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
              <label className="text-xs font-medium text-muted-foreground">
                Year
              </label>
              <div className="flex gap-1.5">
                <Input
                  placeholder="Year"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-card border-border/70"
                />
                {(brandFilter || modelFilter || vinFilter || yearFilter) && (
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

          {/* 6. Data Table matching 9 columns of Screenshot */}
          <div className="border rounded-md overflow-x-auto">
            <Table className="text-xs">
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="w-[50px] font-bold text-foreground">
                    #
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    Brand
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    Model
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    Vin_Number
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    Year
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    Source
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    Destination
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    Transfer_Date
                  </TableHead>
                  <TableHead className="font-bold text-foreground">
                    Note
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-12 text-muted-foreground"
                    >
                      No car transfers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransfers.map((t, idx) => (
                    <TableRow
                      key={t.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="font-mono text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground uppercase">
                        {t.brand || "-"}
                      </TableCell>
                      <TableCell className="font-medium uppercase">
                        {t.model || t.vehicleName}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {t.vehicleVin}
                      </TableCell>
                      <TableCell className="font-mono">
                        {t.madeYear || "-"}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {t.sourceBranch}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {t.destBranch}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {t.transferDate ? t.transferDate.slice(0, 10) : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.note || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 7. Pagination Controls matching Screenshot */}
          <div className="pt-1 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-8 text-xs px-3"
            >
              &laquo; Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-8 text-xs px-3"
            >
              Next &raquo;
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
