"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutGrid,
  PlusCircle,
  Search,
  Eye,
  X,
  Check,
  Edit2,
  Trash2,
  ChevronLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { costService, settingsService } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────
interface BillItem {
  id: string;
  billNumber: string;
  category: string;
  supplierName: string;
  supplierId?: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  billDate: string;
  description?: string;
  vehicles: {
    id?: string;
    vin: string;
    vehicleName: string;
    brand?: string;
    model?: string;
    madeYear?: number;
    color?: string;
    costType?: string;
    allocatedAmount: number;
  }[];
}

interface SupplierOption {
  id: string;
  nameEn: string;
  nameKh?: string;
  country?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  address?: string;
  website?: string;
  note?: string;
  category?: string;
  supplierType?: string;
}

interface VehicleOption {
  id: string;
  vin: string;
  brand?: string;
  model?: string;
  madeYear?: number;
  color?: string;
  displayName: string;
}

interface AddedCarItem {
  carId: string;
  vin: string;
  brand: string;
  model: string;
  year: number | string;
  color: string;
  clearanceFee: number;
  taxPayment: number;
  total: number;
}

function LogisticsContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");

  // View state: "dashboard" shows the tabs (Bill list / Logistic company),
  // "add-clearance" shows the full "Adding new tax & clearance fee" page (Screenshot 3).
  const [viewMode, setViewMode] = useState<"dashboard" | "add-clearance">(
    urlTab === "clearance" || urlTab === "new" ? "add-clearance" : "dashboard"
  );

  useEffect(() => {
    if (urlTab === "clearance" || urlTab === "new") {
      setViewMode("add-clearance");
    } else {
      setViewMode("dashboard");
    }
  }, [urlTab]);

  const [activeMainTab, setActiveMainTab] = useState<"bill-list" | "logistic-company">("bill-list");
  const [bills, setBills] = useState<BillItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Success / feedback banner
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters for Bill List (Screenshot 1)
  const [billNoFilter, setBillNoFilter] = useState("");
  const [vinFilter, setVinFilter] = useState("");
  const [appliedBillFilter, setAppliedBillFilter] = useState("");
  const [appliedVinFilter, setAppliedVinFilter] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // View / Edit Bill Modal (matching reference screenshot)
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);
  const [editShippingDate, setEditShippingDate] = useState("");
  const [editTransportCompanyId, setEditTransportCompanyId] = useState("");
  const [editPaidAmount, setEditPaidAmount] = useState<number | "">("");
  const [editDescription, setEditDescription] = useState("");
  const [billSaving, setBillSaving] = useState(false);
  const [billSaveError, setBillSaveError] = useState<string | null>(null);

  // ── "Adding new tax & clearance fee" Form State (Screenshot 3) ─────────
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [transportDate, setTransportDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [transportCompanyId, setTransportCompanyId] = useState("");

  // Inline "choose car" addition row
  const [selectedCarVin, setSelectedCarVin] = useState("");
  const [inputClearanceFee, setInputClearanceFee] = useState<number | "">("");
  const [inputTaxPayment, setInputTaxPayment] = useState<number | "">("");

  // Added cars table
  const [addedCars, setAddedCars] = useState<AddedCarItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── "Adding new logistic company" Modal State (Screenshot 4) ───────────
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyNameEn, setCompanyNameEn] = useState("");
  const [companyNameKh, setCompanyNameKh] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyCountry, setCompanyCountry] = useState("Cambodia");
  const [companyPhone1, setCompanyPhone1] = useState("");
  const [companyPhone2, setCompanyPhone2] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyNote, setCompanyNote] = useState("");
  const [companySubmitting, setCompanySubmitting] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  // Generate a realistic invoice number on mount/reset
  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `IN${year}${month}${day}${rand.toString().slice(0, 4)}`;
  };

  useEffect(() => {
    if (!invoiceNumber) {
      setInvoiceNumber(generateInvoiceNumber());
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [billsData, optionsData] = await Promise.all([
        costService.getBills(),
        costService.getOptions(),
      ]);
      setBills((billsData as BillItem[]) ?? []);
      const opts = optionsData as { suppliers: SupplierOption[]; vehicles: VehicleOption[] };
      setSuppliers(opts.suppliers ?? []);
      setVehicles(opts.vehicles ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Sorting States ──────────────────────────────────────────────────
  const [billSortKey, setBillSortKey] = useState<string>("billDate");
  const [billSortOrder, setBillSortOrder] = useState<"asc" | "desc">("desc");

  const [companySortKey, setCompanySortKey] = useState<string>("code");
  const [companySortOrder, setCompanySortOrder] = useState<"asc" | "desc">("asc");

  const toggleBillSort = (key: string) => {
    if (billSortKey === key) {
      setBillSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setBillSortKey(key);
      setBillSortOrder(
        key === "billDate" || key === "paidAmount" || key === "balance" ? "desc" : "asc"
      );
    }
  };

  const toggleCompanySort = (key: string) => {
    if (companySortKey === key) {
      setCompanySortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setCompanySortKey(key);
      setCompanySortOrder("asc");
    }
  };

  // Filter & Sort bills
  const sortedBills = useMemo(() => {
    const list = bills.filter((b) => {
      if (
        appliedBillFilter &&
        !b.billNumber.toLowerCase().includes(appliedBillFilter.toLowerCase())
      ) {
        return false;
      }
      if (appliedVinFilter) {
        const matchesVin = b.vehicles.some((v) =>
          v.vin.toLowerCase().includes(appliedVinFilter.toLowerCase())
        );
        if (!matchesVin) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (billSortKey === "billNumber") {
        valA = a.billNumber;
        valB = b.billNumber;
      } else if (billSortKey === "paidAmount") {
        valA = a.paidAmount;
        valB = b.paidAmount;
      } else if (billSortKey === "balance") {
        valA = a.balance;
        valB = b.balance;
      } else if (billSortKey === "billDate") {
        valA = new Date(a.billDate).getTime();
        valB = new Date(b.billDate).getTime();
      } else if (billSortKey === "supplierName") {
        valA = a.supplierName;
        valB = b.supplierName;
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return billSortOrder === "asc" ? valA - valB : valB - valA;
      }
      const cmp = String(valA).localeCompare(String(valB));
      return billSortOrder === "asc" ? cmp : -cmp;
    });
  }, [bills, appliedBillFilter, appliedVinFilter, billSortKey, billSortOrder]);

  const totalPages = Math.ceil(sortedBills.length / pageSize) || 1;
  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedBills.slice(start, start + pageSize);
  }, [sortedBills, currentPage]);

  // Sort logistic companies
  const sortedSuppliers = useMemo(() => {
    const list = suppliers.map((s, idx) => ({
      ...s,
      codeIndex: 1001 + idx * 100,
      displayName: s.nameKh ? `${s.nameKh} / ${s.nameEn}` : s.nameEn,
    }));

    return list.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (companySortKey === "code") {
        valA = a.codeIndex;
        valB = b.codeIndex;
      } else if (companySortKey === "name") {
        valA = a.displayName;
        valB = b.displayName;
      } else if (companySortKey === "address") {
        valA = a.address || "";
        valB = b.address || "";
      } else if (companySortKey === "phone") {
        valA = a.phone || "";
        valB = b.phone || "";
      } else if (companySortKey === "email") {
        valA = a.email || "";
        valB = b.email || "";
      } else if (companySortKey === "website") {
        valA = a.website || "";
        valB = b.website || "";
      } else if (companySortKey === "country") {
        valA = a.country || "";
        valB = b.country || "";
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return companySortOrder === "asc" ? valA - valB : valB - valA;
      }
      const cmp = String(valA).localeCompare(String(valB));
      return companySortOrder === "asc" ? cmp : -cmp;
    });
  }, [suppliers, companySortKey, companySortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedBillFilter(billNoFilter);
    setAppliedVinFilter(vinFilter);
    setCurrentPage(1);
  };

  // ── Inline Add Car to Table (Screenshot 3) ───────────────────────────
  const handleAddCarToList = () => {
    setFormError(null);
    if (!selectedCarVin) {
      setFormError("Please select a car from the 'choose car' dropdown.");
      return;
    }

    // Check if already in list
    if (addedCars.some((c) => c.vin === selectedCarVin)) {
      setFormError("This vehicle is already in the list. Remove it first if you want to modify fees.");
      return;
    }

    const matched = vehicles.find((v) => v.vin === selectedCarVin);
    if (!matched) {
      setFormError("Selected vehicle not found.");
      return;
    }

    const cFee = typeof inputClearanceFee === "number" ? inputClearanceFee : 0;
    const tPayment = typeof inputTaxPayment === "number" ? inputTaxPayment : 0;
    const totalRow = cFee + tPayment;

    if (totalRow <= 0) {
      setFormError("Please enter at least clearance fee or tax payment for the selected car.");
      return;
    }

    const newItem: AddedCarItem = {
      carId: matched.id,
      vin: matched.vin,
      brand: matched.brand || "VOYAH",
      model: matched.model || "FREE",
      year: matched.madeYear || new Date().getFullYear(),
      color: matched.color || "Black",
      clearanceFee: cFee,
      taxPayment: tPayment,
      total: totalRow,
    };

    setAddedCars((prev) => [...prev, newItem]);
    setSelectedCarVin("");
    setInputClearanceFee("");
    setInputTaxPayment("");
  };

  const handleRemoveCarFromList = (vinToRemove: string) => {
    setAddedCars((prev) => prev.filter((c) => c.vin !== vinToRemove));
  };

  // Compute grand total and balance
  const grandTotal = useMemo(() => {
    return addedCars.reduce((sum, item) => sum + item.total, 0);
  }, [addedCars]);

  const currentBalance = useMemo(() => {
    const paid = typeof paidAmount === "number" ? paidAmount : 0;
    return Math.max(0, grandTotal - paid);
  }, [grandTotal, paidAmount]);

  // Submit "Adding new tax & clearance fee" (Screenshot 3)
  const handleSaveTaxClearanceBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!invoiceNumber.trim()) {
      setFormError("Invoice number is required.");
      return;
    }
    if (!transportCompanyId) {
      setFormError("Please select a transport company.");
      return;
    }

    let finalCars = [...addedCars];

    // If user filled in "choose car" and fees but didn't click "+ Add to list", auto-add it!
    if (selectedCarVin) {
      const cFee = typeof inputClearanceFee === "number" ? inputClearanceFee : 0;
      const tPayment = typeof inputTaxPayment === "number" ? inputTaxPayment : 0;
      if (cFee > 0 || tPayment > 0) {
        const matched = vehicles.find((v) => v.vin === selectedCarVin);
        if (matched && !finalCars.some((c) => c.vin === selectedCarVin)) {
          finalCars.push({
            carId: matched.id,
            vin: matched.vin,
            brand: matched.brand || "VOYAH",
            model: matched.model || "FREE",
            year: matched.madeYear || new Date().getFullYear(),
            color: matched.color || "Black",
            clearanceFee: cFee,
            taxPayment: tPayment,
            total: cFee + tPayment,
          });
        }
      }
    }

    if (finalCars.length === 0) {
      setFormError("Please select a car and enter clearance fee or tax payment, then click '+ Add to list' (or click Save Now).");
      return;
    }

    const calculatedTotal = finalCars.reduce((sum, item) => sum + item.total, 0);

    setFormSubmitting(true);
    try {
      // Build allocations
      const allocations: { vin: string; amount: number; costType?: "TAX" | "CLEARANCE"; note?: string }[] = [];
      for (const car of finalCars) {
        if (car.clearanceFee > 0) {
          allocations.push({
            vin: car.vin,
            amount: car.clearanceFee,
            costType: "CLEARANCE",
            note: `Port clearance for ${car.brand} ${car.model} (${car.vin})`,
          });
        }
        if (car.taxPayment > 0) {
          allocations.push({
            vin: car.vin,
            amount: car.taxPayment,
            costType: "TAX",
            note: `Customs tax for ${car.brand} ${car.model} (${car.vin})`,
          });
        }
      }

      await costService.createBill({
        billNumber: invoiceNumber.trim(),
        supplierId: transportCompanyId,
        category: "CLEARANCE",
        totalAmount: calculatedTotal,
        paidAmount: typeof paidAmount === "number" ? paidAmount : 0,
        billDate: transportDate,
        description: description.trim() || undefined,
        allocations,
      });

      setActionSuccess(`Tax & Clearance fee bill "${invoiceNumber.trim()}" saved successfully.`);
      // Reset form
      setInvoiceNumber(generateInvoiceNumber());
      setSelectedCarVin("");
      setInputClearanceFee("");
      setInputTaxPayment("");
      setAddedCars([]);
      setPaidAmount("");
      setDescription("");
      await fetchData();
      setViewMode("dashboard");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save bill.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Open Add/Edit Logistic Company Modal (Screenshot 4) ─────────────
  const handleOpenNewCompanyModal = () => {
    setEditingCompanyId(null);
    setCompanyNameEn("");
    setCompanyNameKh("");
    setCompanyEmail("");
    setCompanyWebsite("");
    setCompanyCountry("Cambodia");
    setCompanyPhone1("");
    setCompanyPhone2("");
    setCompanyAddress("");
    setCompanyNote("");
    setCompanyError(null);
    setIsCompanyDialogOpen(true);
  };

  const handleOpenEditCompanyModal = (s: SupplierOption) => {
    setEditingCompanyId(s.id);
    setCompanyNameEn(s.nameEn || "");
    setCompanyNameKh(s.nameKh || "");
    setCompanyEmail(s.email || "");
    setCompanyWebsite(s.website || "");
    setCompanyCountry(s.country || "Cambodia");
    setCompanyPhone1(s.phone || "");
    setCompanyPhone2(s.phone2 || "");
    setCompanyAddress(s.address || "");
    setCompanyNote(s.note || "");
    setCompanyError(null);
    setIsCompanyDialogOpen(true);
  };

  const handleSubmitCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError(null);
    if (!companyNameEn.trim()) {
      setCompanyError("Please enter company English name.");
      return;
    }

    setCompanySubmitting(true);
    try {
      if (editingCompanyId) {
        await settingsService.updateSupplier(editingCompanyId, {
          nameEn: companyNameEn.trim(),
          nameKh: companyNameKh.trim() || undefined,
          country: companyCountry.trim() || undefined,
          phone: companyPhone1.trim() || undefined,
          phone2: companyPhone2.trim() || undefined,
          email: companyEmail.trim() || undefined,
          website: companyWebsite.trim() || undefined,
          address: companyAddress.trim() || undefined,
          note: companyNote.trim() || undefined,
        });
        setActionSuccess(`Company "${companyNameEn.trim()}" updated successfully.`);
      } else {
        await settingsService.createSupplier({
          nameEn: companyNameEn.trim(),
          nameKh: companyNameKh.trim() || undefined,
          country: companyCountry.trim() || undefined,
          phone: companyPhone1.trim() || undefined,
          phone2: companyPhone2.trim() || undefined,
          email: companyEmail.trim() || undefined,
          website: companyWebsite.trim() || undefined,
          address: companyAddress.trim() || undefined,
          note: companyNote.trim() || undefined,
          category: "LOGISTICS",
        });
        setActionSuccess(`New logistic company "${companyNameEn.trim()}" created successfully.`);
      }

      setIsCompanyDialogOpen(false);
      await fetchData();
    } catch (err: unknown) {
      setCompanyError(err instanceof Error ? err.message : "Failed to save company.");
    } finally {
      setCompanySubmitting(false);
    }
  };

  // ── Open & Edit Bill Details Modal (Exact Reference Screenshot 1) ────
  const handleOpenBillDetails = (b: BillItem) => {
    setSelectedBill(b);
    setEditShippingDate(b.billDate ? b.billDate.slice(0, 10) : "");
    const foundSupplier = suppliers.find(
      (s) => s.id === b.supplierId || s.nameEn === b.supplierName || s.nameKh === b.supplierName
    );
    setEditTransportCompanyId(foundSupplier?.id || b.supplierId || "");
    setEditPaidAmount(b.paidAmount);
    setEditDescription(b.description || b.billNumber || "");
    setBillSaveError(null);
  };

  const handleSaveBillChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    setBillSaving(true);
    setBillSaveError(null);
    try {
      await costService.updateBill(selectedBill.id, {
        supplierId: editTransportCompanyId || undefined,
        billDate: editShippingDate || undefined,
        paidAmount: typeof editPaidAmount === "number" ? editPaidAmount : 0,
        description: editDescription || undefined,
      });
      setActionSuccess(`Bill "${selectedBill.billNumber}" updated successfully.`);
      setSelectedBill(null);
      await fetchData();
    } catch (err: unknown) {
      setBillSaveError(err instanceof Error ? err.message : "Failed to save bill changes.");
    } finally {
      setBillSaving(false);
    }
  };

  const editBalance = useMemo(() => {
    if (!selectedBill) return 0;
    const paid = typeof editPaidAmount === "number" ? editPaidAmount : 0;
    return Math.max(0, selectedBill.totalAmount - paid);
  }, [selectedBill, editPaidAmount]);

  const billVehicleRows = useMemo(() => {
    if (!selectedBill) return [];
    const map = new Map<
      string,
      {
        vin: string;
        brand: string;
        model: string;
        year: number | string;
        color: string;
        clearance: number;
        taxPayment: number;
        lineTotal: number;
      }
    >();

    for (const v of selectedBill.vehicles) {
      const existing = map.get(v.vin);
      const isClearance = v.costType === "CLEARANCE" || selectedBill.category === "CLEARANCE";
      const isTax = v.costType === "TAX" || selectedBill.category === "TAX";

      const cAmt =
        v.costType === "CLEARANCE"
          ? v.allocatedAmount
          : !v.costType && selectedBill.category === "CLEARANCE"
          ? v.allocatedAmount
          : 0;
      const tAmt =
        v.costType === "TAX"
          ? v.allocatedAmount
          : !v.costType && selectedBill.category === "TAX"
          ? v.allocatedAmount
          : 0;

      if (existing) {
        if (v.costType === "CLEARANCE") existing.clearance += v.allocatedAmount;
        else if (v.costType === "TAX") existing.taxPayment += v.allocatedAmount;
        else existing.lineTotal += v.allocatedAmount;
        existing.lineTotal =
          existing.clearance + existing.taxPayment || existing.lineTotal + v.allocatedAmount;
      } else {
        let bName = v.brand || "";
        let mName = v.model || "";
        if (!bName && v.vehicleName) {
          const parts = v.vehicleName.split(" ");
          bName = parts[0] || "VOYAH";
          mName = parts.slice(1).join(" ") || "FREE";
        }
        map.set(v.vin, {
          vin: v.vin,
          brand: bName || "MHERO",
          model: mName || "817",
          year: v.madeYear || 2026,
          color: v.color || "SILVER",
          clearance: cAmt,
          taxPayment: tAmt,
          lineTotal: v.allocatedAmount,
        });
      }
    }

    return Array.from(map.values());
  }, [selectedBill]);

  return (
    <div className="space-y-4 max-w-full pb-16">
      {/* 1. Full-Width Light Grey/Blue Breadcrumb Banner matching Screenshot */}
      <div className="w-full bg-[#e8ecf4] border border-[#d8e0ec] rounded-[3px] px-3.5 py-2 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-1.5">
          <LayoutGrid className="h-3.5 w-3.5 text-[#1976d2] shrink-0" />
          <Link href="/" className="text-[#1976d2] font-semibold hover:underline">
            Dashboard
          </Link>
          <span className="text-slate-400 font-normal">&gt;</span>
          <span className="text-slate-600 font-medium">Transport info</span>
        </div>

        {viewMode === "add-clearance" && (
          <button
            type="button"
            onClick={() => setViewMode("dashboard")}
            className="text-[#1976d2] font-semibold hover:underline text-xs flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back to Bill list</span>
          </button>
        )}
      </div>

      {/* Action success alert */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[3px] text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          VIEW MODE 1: "Adding new tax & clearance fee" (Screenshot 1 / 3)
         ═══════════════════════════════════════════════════════════════════ */}
      {viewMode === "add-clearance" ? (
        <div className="space-y-4 pt-1">
          {/* Header with Title and Invoice Number on Right */}
          <div className="flex flex-wrap items-end justify-between gap-4 pt-1 pb-1">
            <h1 className="text-[20px] font-bold text-[#2c3e50] tracking-tight">
              Adding new tax &amp; clearance fee
            </h1>

            {/* Top Right: Invoice Number Input */}
            <div className="flex flex-col items-start sm:items-end space-y-1">
              <label className="text-[12px] text-slate-700 font-medium">
                Invoice Number
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="IN2026041533"
                className="w-64 sm:w-72 h-[30px] px-2.5 text-[12px] font-mono border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
              />
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-[3px] bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSaveTaxClearanceBill} className="space-y-4">
            {/* Row 1: transport date & transport company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] text-slate-600 font-medium">
                  transport date
                </label>
                <input
                  type="date"
                  required
                  value={transportDate}
                  onChange={(e) => setTransportDate(e.target.value)}
                  className="w-full h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] text-slate-600 font-medium">
                  transport company
                </label>
                <select
                  required
                  value={transportCompanyId}
                  onChange={(e) => setTransportCompanyId(e.target.value)}
                  className="w-full h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                >
                  <option value="">--Select--</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameKh ? `${s.nameKh} / ${s.nameEn}` : s.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: choose car + clearance fee + tax payment + "+ Add to list" */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
              <div className="md:col-span-4 space-y-1">
                <label className="text-[12px] text-slate-600 font-medium">
                  choose car
                </label>
                <select
                  value={selectedCarVin}
                  onChange={(e) => setSelectedCarVin(e.target.value)}
                  className="w-full h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                >
                  <option value="">choose car</option>
                  {vehicles.map((v) => (
                    <option key={v.vin} value={v.vin}>
                      {v.brand} {v.model} ({v.vin}) {v.madeYear ? `- ${v.madeYear}` : ""} {v.color ? `- ${v.color}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-[12px] text-slate-600 font-medium">
                  clearance fee
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="clearance fee"
                  value={inputClearanceFee}
                  onChange={(e) =>
                    setInputClearanceFee(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
                />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-[12px] text-slate-600 font-medium">
                  tax payment
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="$ tax payment"
                  value={inputTaxPayment}
                  onChange={(e) =>
                    setInputTaxPayment(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleAddCarToList}
                  className="h-[30px] px-4 bg-[#20c997] hover:bg-[#1bb386] text-white rounded-[2px] text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                  title="Add to list"
                >
                  <PlusCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Add to list</span>
                </button>
              </div>
            </div>

            {/* Section: Car list Table */}
            <div className="space-y-1 pt-3">
              <h2 className="text-[14px] font-bold text-[#2c3e50]">Car list</h2>

              <div className="border-t border-b border-slate-200 overflow-x-auto bg-white">
                <table className="w-full text-left border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#2c3e50] font-semibold text-[12px]">
                      <th className="py-2 px-3 w-10 text-slate-700">#</th>
                      <th className="py-2 px-3 text-slate-700">Brand</th>
                      <th className="py-2 px-3 text-slate-700">Model</th>
                      <th className="py-2 px-3 text-slate-700">Vin</th>
                      <th className="py-2 px-3 w-20 text-slate-700">Year</th>
                      <th className="py-2 px-3 w-24 text-slate-700">Color</th>
                      <th className="py-2 px-3 w-28 text-slate-700">Clearance</th>
                      <th className="py-2 px-3 w-28 text-slate-700">Tax payment</th>
                      <th className="py-2 px-3 w-28 text-slate-700">Total</th>
                      <th className="py-2 px-3 w-14 text-center text-slate-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addedCars.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="py-6 text-center text-xs text-slate-400 italic"
                        >
                          No car added to list yet. Select a car above, enter fees, and click &quot;Add to list&quot;.
                        </td>
                      </tr>
                    ) : (
                      addedCars.map((car, idx) => (
                        <tr
                          key={car.vin}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{car.brand}</td>
                          <td className="py-2.5 px-3 text-slate-700">{car.model}</td>
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                            {car.vin}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono">{car.year}</td>
                          <td className="py-2.5 px-3 text-slate-600">{car.color}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-800">
                            ${car.clearanceFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-800">
                            ${car.taxPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            ${car.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCarFromList(car.vin)}
                              className="text-slate-400 hover:text-red-600 cursor-pointer p-1 transition-colors"
                              title="Remove car"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Grand Total right under table */}
              <div className="flex justify-end pt-2 pr-4">
                <span className="text-[13px] font-bold text-slate-800">
                  Total: ${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Row 3: Paid Amount (stacked) */}
            <div className="space-y-1 pt-1">
              <label className="text-[12px] text-slate-600 font-medium">
                Paid Amount
              </label>
              <div className="relative w-72">
                <span className="absolute left-3 top-1.5 text-slate-500 text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={paidAmount}
                  onChange={(e) =>
                    setPaidAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full h-[30px] pl-6 pr-3 text-[12px] font-mono border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                />
              </div>
            </div>

            {/* Row 4: Balance (stacked) */}
            <div className="space-y-1">
              <label className="text-[12px] text-slate-600 font-medium">
                Balance
              </label>
              <div className="relative w-72">
                <span className="absolute left-3 top-1.5 text-slate-500 text-xs">$</span>
                <input
                  type="text"
                  readOnly
                  value={currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  className="w-full h-[30px] pl-6 pr-3 text-[12px] font-mono border border-[#dcdfe6] rounded-[2px] bg-[#f5f7fa] text-slate-700 font-medium focus:outline-none"
                />
              </div>
            </div>

            {/* Row 5: Description */}
            <div className="space-y-1">
              <label className="text-[12px] text-slate-600 font-medium">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="other description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full max-w-xl p-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
              />
            </div>

            {/* Bottom Actions: Save Now */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={formSubmitting}
                className="h-[32px] px-5 text-xs font-semibold bg-[#1976d2] hover:bg-[#1565c0] text-white rounded-[2px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{formSubmitting ? "Saving..." : "Save Now"}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("dashboard")}
                className="h-[32px] px-4 text-xs font-medium border border-[#dcdfe6] text-slate-600 hover:bg-slate-50 rounded-[2px] cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
            VIEW MODE 2: "Tax And Clearance Fee" Dashboard (Screenshot 1 & 2)
           ═══════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* Page Header & 2 Action Buttons matching Screenshot */}
          <div className="pt-1">
            <h1 className="text-[20px] font-bold text-[#2c3e50] tracking-tight">
              Tax And Clearance Fee
            </h1>

            <div className="flex items-center gap-2 pt-2.5">
              <button
                type="button"
                onClick={() => setViewMode("add-clearance")}
                className="h-[30px] px-3.5 text-xs font-semibold bg-[#1976d2] hover:bg-[#1565c0] text-white rounded-[2px] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>New bill</span>
              </button>

              <button
                type="button"
                onClick={handleOpenNewCompanyModal}
                className="h-[30px] px-3.5 text-xs font-semibold bg-[#1976d2] hover:bg-[#1565c0] text-white rounded-[2px] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>New logistic company</span>
              </button>
            </div>
          </div>

          {/* Tabs: Bill List & Logistic Company */}
          <div className="pt-1">
            <div className="flex items-center gap-6 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveMainTab("bill-list")}
                className={cn(
                  "pb-2 text-xs font-semibold cursor-pointer border-b-2 transition-colors",
                  activeMainTab === "bill-list"
                    ? "border-[#1976d2] text-[#1976d2]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                Bill List
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab("logistic-company")}
                className={cn(
                  "pb-2 text-xs font-semibold cursor-pointer border-b-2 transition-colors",
                  activeMainTab === "logistic-company"
                    ? "border-[#1976d2] text-[#1976d2]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                Logistic Company
              </button>
            </div>
          </div>

          {/* Tab 1: Bill List (Screenshot 1) */}
          {activeMainTab === "bill-list" && (
            <div className="space-y-2 pt-1">
              <h2 className="text-[16px] font-bold text-[#2c3e50]">Bill list</h2>

              {/* Filter Inputs matching Screenshot */}
              <form
                onSubmit={handleSearch}
                className="flex flex-wrap items-end justify-between gap-4 pt-1"
              >
                {/* Left: Filter Bill */}
                <div className="space-y-1">
                  <label className="text-[12px] text-slate-600 font-medium">
                    Filter Bill
                  </label>
                  <div>
                    <input
                      type="text"
                      placeholder="filter by bill no"
                      value={billNoFilter}
                      onChange={(e) => setBillNoFilter(e.target.value)}
                      className="w-64 h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
                    />
                  </div>
                </div>

                {/* Right: Search By Vin Number + Search Button */}
                <div className="flex items-end gap-2">
                  <div className="space-y-1">
                    <label className="text-[12px] text-slate-600 font-medium">
                      Search By Vin Number
                    </label>
                    <div>
                      <input
                        type="text"
                        placeholder="car vin num"
                        value={vinFilter}
                        onChange={(e) => setVinFilter(e.target.value)}
                        className="w-56 h-[30px] px-2.5 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="h-[30px] px-3.5 text-xs font-semibold bg-[#ea4335] hover:bg-[#d32f2f] text-white rounded-[2px] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Search</span>
                  </button>
                </div>
              </form>

              {/* Subtitle matching Screenshot */}
              <p className="text-[11px] text-slate-400 pt-3 pb-0.5">view bill was add</p>

              {/* Table matching Screenshot 1:1 */}
              <div className="border-t border-slate-200 overflow-x-auto">
                {loading ? (
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : error ? (
                  <div className="p-6 text-center text-xs text-red-600">{error}</div>
                ) : (
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-[#2c3e50] font-bold text-[12px]">
                        <th className="py-2.5 px-3 w-12 text-slate-700">#</th>
                        <th
                          onClick={() => toggleBillSort("billNumber")}
                          className="py-2.5 px-3 text-slate-700 cursor-pointer select-none hover:text-[#1976d2] transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Bill No</span>
                            {billSortKey === "billNumber" ? (
                              billSortOrder === "asc" ? (
                                <ArrowUp className="h-3 w-3 text-[#1976d2]" />
                              ) : (
                                <ArrowDown className="h-3 w-3 text-[#1976d2]" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-60" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => toggleBillSort("paidAmount")}
                          className="py-2.5 px-3 w-32 text-slate-700 cursor-pointer select-none hover:text-[#1976d2] transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Paid_Amount</span>
                            {billSortKey === "paidAmount" ? (
                              billSortOrder === "asc" ? (
                                <ArrowUp className="h-3 w-3 text-[#1976d2]" />
                              ) : (
                                <ArrowDown className="h-3 w-3 text-[#1976d2]" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-60" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => toggleBillSort("balance")}
                          className="py-2.5 px-3 w-28 text-slate-700 cursor-pointer select-none hover:text-[#1976d2] transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Balance</span>
                            {billSortKey === "balance" ? (
                              billSortOrder === "asc" ? (
                                <ArrowUp className="h-3 w-3 text-[#1976d2]" />
                              ) : (
                                <ArrowDown className="h-3 w-3 text-[#1976d2]" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-60" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => toggleBillSort("billDate")}
                          className="py-2.5 px-3 w-32 text-slate-700 cursor-pointer select-none hover:text-[#1976d2] transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Bill_Date</span>
                            {billSortKey === "billDate" ? (
                              billSortOrder === "asc" ? (
                                <ArrowUp className="h-3 w-3 text-[#1976d2]" />
                              ) : (
                                <ArrowDown className="h-3 w-3 text-[#1976d2]" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-60" />
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => toggleBillSort("supplierName")}
                          className="py-2.5 px-3 text-slate-700 cursor-pointer select-none hover:text-[#1976d2] transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Supplier</span>
                            {billSortKey === "supplierName" ? (
                              billSortOrder === "asc" ? (
                                <ArrowUp className="h-3 w-3 text-[#1976d2]" />
                              ) : (
                                <ArrowDown className="h-3 w-3 text-[#1976d2]" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-60" />
                            )}
                          </div>
                        </th>
                        <th className="py-2.5 px-3 w-16 text-center text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedBills.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                            No bill data found.
                          </td>
                        </tr>
                      ) : (
                        paginatedBills.map((b, index) => (
                          <tr
                            key={b.id}
                            className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-[12px]"
                          >
                            <td className="py-2.5 px-3 text-slate-500 font-mono">
                              {(currentPage - 1) * pageSize + index + 1}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 font-medium max-w-md truncate">
                              {b.billNumber}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-mono">
                              $ {b.paidAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-mono">
                              $ {b.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono whitespace-nowrap">
                              {b.billDate.slice(0, 10)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-normal">
                              {b.supplierName}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleOpenBillDetails(b)}
                                className="h-6 w-6 rounded border border-slate-300 hover:bg-slate-100 inline-flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
                                title="View bill details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {/* Pagination Controls */}
                <div className="flex items-center gap-1 pt-4 pb-4">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                    className="h-[28px] px-2 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-[28px] px-3 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-[28px] px-3 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="h-[28px] px-2 text-[12px] border border-[#dcdfe6] rounded-[2px] bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Logistic Company (Screenshot 2) */}
          {activeMainTab === "logistic-company" && (
            <div className="space-y-3 pt-1">
              <div>
                <h2 className="text-[16px] font-bold text-[#2c3e50]">Logistic company</h2>
                <p className="text-[11px] text-slate-400">all company</p>
              </div>

              <div className="border-t border-slate-200 overflow-x-auto">
                <table className="w-full text-left border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[#2c3e50] font-bold text-[12px]">
                      <th
                        onClick={() => toggleCompanySort("code")}
                        className="py-2.5 px-3 w-16 cursor-pointer select-none hover:text-[#1976d2] transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          <span>#</span>
                          {companySortKey === "code" ? (
                            companySortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-[#1976d2]" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-[#1976d2]" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => toggleCompanySort("name")}
                        className="py-2.5 px-3 min-w-[280px] cursor-pointer select-none hover:text-[#1976d2] transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          <span>Name</span>
                          {companySortKey === "name" ? (
                            companySortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-[#1976d2]" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-[#1976d2]" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => toggleCompanySort("address")}
                        className="py-2.5 px-3 min-w-[200px] cursor-pointer select-none hover:text-[#1976d2] transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          <span>Address</span>
                          {companySortKey === "address" ? (
                            companySortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-[#1976d2]" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-[#1976d2]" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => toggleCompanySort("phone")}
                        className="py-2.5 px-3 w-32 cursor-pointer select-none hover:text-[#1976d2] transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          <span>Phone</span>
                          {companySortKey === "phone" ? (
                            companySortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-[#1976d2]" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-[#1976d2]" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => toggleCompanySort("email")}
                        className="py-2.5 px-3 w-36 cursor-pointer select-none hover:text-[#1976d2] transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          <span>Email</span>
                          {companySortKey === "email" ? (
                            companySortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-[#1976d2]" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-[#1976d2]" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => toggleCompanySort("website")}
                        className="py-2.5 px-3 w-32 cursor-pointer select-none hover:text-[#1976d2] transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          <span>Website</span>
                          {companySortKey === "website" ? (
                            companySortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-[#1976d2]" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-[#1976d2]" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => toggleCompanySort("country")}
                        className="py-2.5 px-3 w-28 cursor-pointer select-none hover:text-[#1976d2] transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          <span>Country</span>
                          {companySortKey === "country" ? (
                            companySortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-[#1976d2]" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-[#1976d2]" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-60" />
                          )}
                        </div>
                      </th>
                      <th className="py-2.5 px-3 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                          No logistic company found.
                        </td>
                      </tr>
                    ) : (
                      sortedSuppliers.map((s) => {
                        return (
                          <tr
                            key={s.id}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-[12px]"
                          >
                            <td className="py-2.5 px-3 text-slate-500 font-mono">
                              {s.codeIndex}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {s.nameKh ? `${s.nameKh} / ${s.nameEn}` : s.nameEn}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {s.address || "PP"}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono">
                              {s.phone ? `${s.phone} /` : "N/A /"}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono">
                              {s.email ? `${s.email} /` : ""}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {s.website ? (
                                <a
                                  href={s.website.startsWith("http") ? s.website : `https://${s.website}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#1976d2] hover:underline truncate block max-w-xs"
                                >
                                  {s.website}
                                </a>
                              ) : (
                                ""
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 uppercase font-medium">
                              {s.country || "CAMBODIA"}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCompanyModal(s)}
                                className="h-6 w-6 rounded bg-[#1976d2] hover:bg-[#1565c0] text-white inline-flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                title="Edit company"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: "Adding new logistic company" (Screenshot 4)
         ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
        <DialogContent className="max-w-[540px] p-0 overflow-hidden rounded-[4px] border border-slate-200 shadow-2xl">
          {/* Dark blue modal header */}
          <div className="bg-[#102a4e] text-white px-5 py-3 flex items-center justify-between">
            <DialogTitle className="text-[14px] font-semibold tracking-wide text-white">
              {editingCompanyId ? "Edit logistic company" : "Adding new logistic company"}
            </DialogTitle>
            <button
              type="button"
              onClick={() => setIsCompanyDialogOpen(false)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmitCompany} className="p-5 space-y-3.5 text-xs bg-white">
            {companyError && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
                {companyError}
              </div>
            )}

            {/* Row 1: English name & Khmer name */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  English name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="supplier name in english"
                  value={companyNameEn}
                  onChange={(e) => setCompanyNameEn(e.target.value)}
                  className="w-full h-[32px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Khmer name
                </label>
                <input
                  type="text"
                  placeholder="supplier name in khmer"
                  value={companyNameKh}
                  onChange={(e) => setCompanyNameKh(e.target.value)}
                  className="w-full h-[32px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
                />
              </div>
            </div>

            {/* Row 2: Email & Website */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="ex: example@company.com"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="w-full h-[32px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Website
                </label>
                <input
                  type="text"
                  placeholder="www.companyname.com"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="w-full h-[32px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
                />
              </div>
            </div>

            {/* Row 3: Country & Phone line 1 */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Country
                </label>
                <select
                  value={companyCountry}
                  onChange={(e) => setCompanyCountry(e.target.value)}
                  className="w-full h-[32px] px-2 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                >
                  <option value="">-Select-</option>
                  <option value="Cambodia">Cambodia</option>
                  <option value="China">China</option>
                  <option value="Thailand">Thailand</option>
                  <option value="Vietnam">Vietnam</option>
                  <option value="United States">United States</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Japan">Japan</option>
                  <option value="South Korea">South Korea</option>
                  <option value="Germany">Germany</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Phone line 1
                </label>
                <input
                  type="text"
                  placeholder="ex: +85512 345644"
                  value={companyPhone1}
                  onChange={(e) => setCompanyPhone1(e.target.value)}
                  className="w-full h-[32px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
                />
              </div>
            </div>

            {/* Row 4: Phone line 2 & Address */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Phone line 2
                </label>
                <input
                  type="text"
                  placeholder="ex: +85512 345644"
                  value={companyPhone2}
                  onChange={(e) => setCompanyPhone2(e.target.value)}
                  className="w-full h-[32px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="company address"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full h-[32px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
                />
              </div>
            </div>

            {/* Row 5: Note */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Note
              </label>
              <textarea
                rows={2}
                placeholder="Note something"
                value={companyNote}
                onChange={(e) => setCompanyNote(e.target.value)}
                className="w-full p-2.5 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
              />
            </div>

            {/* Modal Footer Buttons */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCompanyDialogOpen(false)}
                className="h-[30px] px-4 border border-[#dcdfe6] text-slate-700 hover:bg-slate-50 rounded-[2px] text-xs font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={companySubmitting}
                className="h-[30px] px-5 bg-[#1976d2] hover:bg-[#1565c0] text-white rounded-[2px] text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{companySubmitting ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: View / Edit Bill Details (Exact Reference Screenshot)
         ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
        <DialogContent className="max-w-[880px] p-0 overflow-hidden rounded-[4px] border border-slate-200 shadow-2xl">
          {/* Dark blue modal header */}
          <div className="bg-[#102a4e] text-white px-5 py-3 flex items-center justify-between">
            <DialogTitle className="text-[14px] font-semibold tracking-wide text-white">
              Invoice Number : {selectedBill?.billNumber}
            </DialogTitle>
            <button
              type="button"
              onClick={() => setSelectedBill(null)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedBill && (
            <div className="p-5 space-y-4 text-xs bg-white">
              {billSaveError && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
                  {billSaveError}
                </div>
              )}

              {/* Form Row 1: Shipping date, Transport company, Paid Amount, Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">
                    Shipping date
                  </label>
                  <input
                    type="date"
                    value={editShippingDate}
                    onChange={(e) => setEditShippingDate(e.target.value)}
                    className="w-full h-[30px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">
                    Transport company
                  </label>
                  <select
                    value={editTransportCompanyId}
                    onChange={(e) => setEditTransportCompanyId(e.target.value)}
                    className="w-full h-[30px] px-2 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                  >
                    <option value="">--Select--</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameKh ? `${s.nameKh} / ${s.nameEn}` : s.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">
                    Paid Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editPaidAmount}
                      onChange={(e) =>
                        setEditPaidAmount(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="w-full h-[30px] pl-6 pr-2 text-xs font-mono border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">
                    Balance
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">$</span>
                    <input
                      type="text"
                      readOnly
                      value={editBalance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      className="w-full h-[30px] pl-6 pr-2 text-xs font-mono border border-[#dcdfe6] rounded-[2px] bg-[#f5f7fa] text-slate-700 font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form Row 2: Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="other description"
                  className="w-full p-2 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
                />
              </div>

              {/* Buttons: Close & Save changes */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedBill(null)}
                  className="h-[30px] px-4 border border-[#dcdfe6] text-slate-700 hover:bg-slate-50 rounded-[2px] text-xs font-medium cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveBillChanges}
                  disabled={billSaving}
                  className="h-[30px] px-4 bg-[#1976d2] hover:bg-[#1565c0] text-white rounded-[2px] text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{billSaving ? "Saving..." : "Save changes"}</span>
                </button>
              </div>

              {/* Section: Car list with Total on Right */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-bold text-[#2c3e50]">Car list</h3>
                  <span className="text-[13px] font-bold text-slate-900">
                    Total: ${selectedBill.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-[2px] overflow-x-auto bg-white">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                        <th className="py-2 px-2.5 w-8">#</th>
                        <th className="py-2 px-2.5">Brand</th>
                        <th className="py-2 px-2.5">Model</th>
                        <th className="py-2 px-2.5 font-mono">Vin</th>
                        <th className="py-2 px-2.5 w-16">Year</th>
                        <th className="py-2 px-2.5 w-20">Color</th>
                        <th className="py-2 px-2.5 w-24">Clearan</th>
                        <th className="py-2 px-2.5 w-24">Tax Payment</th>
                        <th className="py-2 px-2.5 w-24">Line Total</th>
                        <th className="py-2 px-2.5 w-14 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billVehicleRows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-6 text-center text-slate-400 italic">
                            No vehicles listed on this bill.
                          </td>
                        </tr>
                      ) : (
                        billVehicleRows.map((v, i) => (
                          <tr key={v.vin + i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-2.5 text-slate-500 font-mono">{i + 1}</td>
                            <td className="py-2 px-2.5 font-semibold text-slate-800">{v.brand}</td>
                            <td className="py-2 px-2.5 text-slate-700">{v.model}</td>
                            <td className="py-2 px-2.5 font-mono text-slate-800">{v.vin}</td>
                            <td className="py-2 px-2.5 font-mono text-slate-600">{v.year}</td>
                            <td className="py-2 px-2.5 text-slate-600 uppercase">{v.color}</td>
                            <td className="py-2 px-2.5 font-mono text-slate-800">
                              ${v.clearance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2.5 font-mono text-slate-800">
                              ${v.taxPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2.5 font-mono font-bold text-slate-900">
                              ${v.lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2.5 text-center">
                              <button
                                type="button"
                                className="h-5 w-5 rounded bg-[#1976d2] hover:bg-[#1565c0] text-white inline-flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                title="Edit item"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LogisticsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center text-xs text-slate-400">
          <Skeleton className="h-6 w-32" />
        </div>
      }
    >
      <LogisticsContent />
    </Suspense>
  );
}
