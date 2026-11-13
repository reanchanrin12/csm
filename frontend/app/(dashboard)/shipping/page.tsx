"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutGrid,
  Plus,
  PlusCircle,
  Search,
  Eye,
  X,
  Check,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronDown,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Barcode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { costService, settingsService } from "@/lib/api";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";

// ── Types ───────────────────────────────────────────────────────────────────
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
  tranFee: number;
  containerFee: number;
  laborFee: number;
  total: number;
}

const STANDARD_COUNTRIES = [
  "BELGUIM",
  "CAMBODIA",
  "CANADA",
  "CHINA",
  "DENMARK",
  "DUBAI",
  "GERMANY",
  "HONG KONG",
  "JAPAN",
  "LAO PDR",
  "MALAYSIA",
  "RUSSIA",
  "TAIWAN",
  "THAILAND",
  "USA",
];

function ShippingContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");

  // View state: "dashboard" shows the tabs (Bill list / Logistic company),
  // "add-shipping" shows the full "Add new shipping fee" form.
  const [viewMode, setViewMode] = useState<"dashboard" | "add-shipping">(
    urlTab === "new" ? "add-shipping" : "dashboard"
  );

  useEffect(() => {
    if (urlTab === "new") {
      setViewMode("add-shipping");
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

  // Filters for Bill List
  const [billNoFilter, setBillNoFilter] = useState("");
  const [vinFilter, setVinFilter] = useState("");
  const [appliedBillFilter, setAppliedBillFilter] = useState("");
  const [appliedVinFilter, setAppliedVinFilter] = useState("");

  // Pagination State (with configurable page entries 10, 25, 50, 100, All)
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // View / Edit Bill Modal (matching reference screenshot media_1794533295563_fadfcbd4.png)
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);
  const [editShippingDate, setEditShippingDate] = useState("");
  const [editTransportCompanyId, setEditTransportCompanyId] = useState("");
  const [editPaidAmount, setEditPaidAmount] = useState<number | "">("");
  const [editDescription, setEditDescription] = useState("");
  const [billSaving, setBillSaving] = useState(false);
  const [billSaveError, setBillSaveError] = useState<string | null>(null);

  // Editable vehicle rows in modal
  interface ShippingBillVehicleRow {
    vin: string;
    brand: string;
    model: string;
    year: number | string;
    color: string;
    tranFee: number;
    containerFee: number;
    laborFee: number;
    lineTotal: number;
    isEditing?: boolean;
  }
  const [editCarRows, setEditCarRows] = useState<ShippingBillVehicleRow[]>([]);

  // Styled Confirm Delete Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteDialogTitle, setDeleteDialogTitle] = useState("Confirm Deletion");
  const [deleteItemName, setDeleteItemName] = useState<string | undefined>(undefined);
  const [deleteDialogDescription, setDeleteDialogDescription] = useState<React.ReactNode>(undefined);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = useState<(() => Promise<void>) | null>(null);

  const requestConfirmDelete = (config: {
    title?: string;
    itemName?: string;
    description?: React.ReactNode;
    onConfirm: () => Promise<void>;
  }) => {
    setDeleteDialogTitle(config.title || "Confirm Deletion");
    setDeleteItemName(config.itemName);
    setDeleteDialogDescription(config.description);
    setPendingDeleteAction(() => config.onConfirm);
    setDeleteConfirmOpen(true);
  };

  // ── "Add new shipping fee" Form State ─────────────────────────────────────
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [shippingDate, setShippingDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [transportCompanyId, setTransportCompanyId] = useState("");
  const [paidAmount, setPaidAmount] = useState<number | "">(0);
  const [description, setDescription] = useState("");

  // Inline "choose car" addition row
  const [selectedCarVin, setSelectedCarVin] = useState("");
  const [inputTranFee, setInputTranFee] = useState<number | "">("");
  const [inputContainerFee, setInputContainerFee] = useState<number | "">("");
  const [inputLaborFee, setInputLaborFee] = useState<number | "">("");

  // "Select car" Modal State
  const [isSelectCarModalOpen, setIsSelectCarModalOpen] = useState(false);
  const [carModalSearch, setCarModalSearch] = useState("");
  const [carModalCurrentPage, setCarModalCurrentPage] = useState(1);
  const carModalPageSize = 10;
  const [carModalSortCol, setCarModalSortCol] = useState<"no" | "brand" | "model" | "vin" | "year" | "color">("no");
  const [carModalSortDir, setCarModalSortDir] = useState<"asc" | "desc">("asc");

  // Multi-select in modal
  const [modalSelectedVins, setModalSelectedVins] = useState<string[]>([]);

  // Batch fee inputs inside "Select car" modal
  const [modalBatchTranFee, setModalBatchTranFee] = useState<number | "">("");
  const [modalBatchContainerFee, setModalBatchContainerFee] = useState<number | "">("");
  const [modalBatchLaborFee, setModalBatchLaborFee] = useState<number | "">("");

  // Table of added cars in the form
  const [addedCars, setAddedCars] = useState<AddedCarItem[]>([]);
  const [savingBill, setSavingBill] = useState(false);

  // ── "Adding new logistic company" Modal State ─────────────────────────────
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyNameEn, setCompanyNameEn] = useState("");
  const [companyNameKh, setCompanyNameKh] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyCountry, setCompanyCountry] = useState("");
  const [companyPhone1, setCompanyPhone1] = useState("");
  const [companyPhone2, setCompanyPhone2] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyNote, setCompanyNote] = useState("");
  const [countriesList, setCountriesList] = useState<string[]>(STANDARD_COUNTRIES);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  // Filters for Logistic Company tab
  const [companySearch, setCompanySearch] = useState("");
  const [companyCountryFilter, setCompanyCountryFilter] = useState("all");

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [billsData, optionsData, countriesData] = await Promise.all([
        costService.getBills(undefined, undefined, undefined, "shipping"),
        costService.getOptions(),
        settingsService.getCountries().catch(() => []),
      ]);
      setBills((billsData as BillItem[]) ?? []);
      const opts = optionsData as { suppliers: SupplierOption[]; vehicles: VehicleOption[] };
      setSuppliers(opts?.suppliers ?? []);
      setVehicles(opts?.vehicles ?? []);

      if (Array.isArray(countriesData) && countriesData.length > 0) {
        const names = countriesData.map((c: { nameEn?: string; name?: string }) => c.nameEn || c.name || "").filter(Boolean);
        const combined = Array.from(new Set([...STANDARD_COUNTRIES, ...names])).sort();
        setCountriesList(combined);
      }
    } catch (err: unknown) {
      console.error("Failed to load shipping data", err);
      setError("Unable to load shipping data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered bills for main table
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (appliedBillFilter) {
        const q = appliedBillFilter.toLowerCase();
        const num = (b.billNumber || "").toLowerCase();
        const desc = (b.description || "").toLowerCase();
        const supp = (b.supplierName || "").toLowerCase();
        if (!num.includes(q) && !desc.includes(q) && !supp.includes(q)) return false;
      }
      if (appliedVinFilter) {
        const q = appliedVinFilter.toLowerCase();
        const matchVin = b.vehicles.some((v) => (v.vin || "").toLowerCase().includes(q));
        if (!matchVin) return false;
      }
      return true;
    });
  }, [bills, appliedBillFilter, appliedVinFilter]);

  // Paginated bills
  const totalBills = filteredBills.length;
  const effectivePageSize = pageSize <= 0 ? Math.max(1, totalBills) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalBills / effectivePageSize));
  const paginatedBills = useMemo(() => {
    if (pageSize <= 0) return filteredBills;
    const start = (currentPage - 1) * effectivePageSize;
    return filteredBills.slice(start, start + effectivePageSize);
  }, [filteredBills, currentPage, effectivePageSize, pageSize]);

  // Filtered Logistic Companies
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (companySearch) {
        const q = companySearch.toLowerCase();
        const en = (s.nameEn || "").toLowerCase();
        const kh = (s.nameKh || "").toLowerCase();
        const ph = (s.phone || "").toLowerCase();
        if (!en.includes(q) && !kh.includes(q) && !ph.includes(q)) return false;
      }
      if (companyCountryFilter !== "all") {
        if ((s.country || "").toUpperCase() !== companyCountryFilter.toUpperCase()) {
          return false;
        }
      }
      return true;
    });
  }, [suppliers, companySearch, companyCountryFilter]);

  // Handle Open Bill Details Modal
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

    // Group cost items by vehicle VIN
    const map = new Map<string, ShippingBillVehicleRow>();
    for (const v of b.vehicles) {
      const existing = map.get(v.vin);
      const tran =
        v.costType === "TRANSPORT"
          ? v.allocatedAmount
          : !v.costType && b.category === "TRANSPORT"
          ? v.allocatedAmount
          : 0;
      const container = v.costType === "CONTAINER" ? v.allocatedAmount : 0;
      const labor = v.costType === "LABOR" ? v.allocatedAmount : 0;

      if (!existing) {
        map.set(v.vin, {
          vin: v.vin,
          brand: v.brand || "",
          model: v.model || v.vehicleName || "",
          year: v.madeYear || "-",
          color: v.color || "-",
          tranFee: tran,
          containerFee: container,
          laborFee: labor,
          lineTotal: tran + container + labor,
          isEditing: false,
        });
      } else {
        existing.tranFee += tran;
        existing.containerFee += container;
        existing.laborFee += labor;
        existing.lineTotal = existing.tranFee + existing.containerFee + existing.laborFee;
      }
    }
    setEditCarRows(Array.from(map.values()));
  };

  const modalComputedTotal = useMemo(() => {
    return editCarRows.reduce((sum, r) => sum + (Number(r.lineTotal) || 0), 0);
  }, [editCarRows]);

  const modalComputedBalance = useMemo(() => {
    const paid = typeof editPaidAmount === "number" ? editPaidAmount : 0;
    return modalComputedTotal - paid;
  }, [modalComputedTotal, editPaidAmount]);

  // "Edit car info" sub-modal state (matching exact reference screenshot)
  const [editingCarIndex, setEditingCarIndex] = useState<number | null>(null);
  const [carModalTranFee, setCarModalTranFee] = useState<number | "">(0);
  const [carModalContainerFee, setCarModalContainerFee] = useState<number | "">(0);
  const [carModalLaborFee, setCarModalLaborFee] = useState<number | "">(0);

  const handleOpenEditCarModal = (index: number) => {
    const row = editCarRows[index];
    if (!row) return;
    setEditingCarIndex(index);
    setCarModalTranFee(row.tranFee);
    setCarModalContainerFee(row.containerFee);
    setCarModalLaborFee(row.laborFee);
  };

  const handleSaveCarModal = () => {
    if (editingCarIndex === null) return;
    const t = typeof carModalTranFee === "number" ? carModalTranFee : 0;
    const c = typeof carModalContainerFee === "number" ? carModalContainerFee : 0;
    const l = typeof carModalLaborFee === "number" ? carModalLaborFee : 0;
    setEditCarRows((prev) => {
      const next = [...prev];
      const cur = next[editingCarIndex];
      if (!cur) return prev;
      next[editingCarIndex] = {
        ...cur,
        tranFee: t,
        containerFee: c,
        laborFee: l,
        lineTotal: t + c + l,
      };
      return next;
    });
    setEditingCarIndex(null);
  };

  const handleUpdateEditCarRow = (
    index: number,
    field: "tranFee" | "containerFee" | "laborFee",
    value: number
  ) => {
    setEditCarRows((prev) => {
      const cur = prev[index];
      if (!cur) return prev;
      const updated: ShippingBillVehicleRow = {
        ...cur,
        [field]: value,
        lineTotal:
          (field === "tranFee" ? value : cur.tranFee) +
          (field === "containerFee" ? value : cur.containerFee) +
          (field === "laborFee" ? value : cur.laborFee),
      };
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const handleRemoveCarRow = (index: number) => {
    if (editCarRows.length === 1 && selectedBill) {
      requestConfirmDelete({
        title: "Delete Empty Invoice",
        itemName: `Invoice No: ${selectedBill.billNumber}`,
        description: `Removing the only vehicle will delete invoice "${selectedBill.billNumber}". Do you want to delete this invoice completely?`,
        onConfirm: async () => {
          await costService.deleteBill(selectedBill.id);
          setActionSuccess(`Invoice "${selectedBill.billNumber}" deleted successfully.`);
          setSelectedBill(null);
          await fetchData();
        },
      });
      return;
    }
    setEditCarRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveBillChanges = async () => {
    if (!selectedBill) return;
    setBillSaving(true);
    setBillSaveError(null);

    try {
      const allocations: Array<{
        vin: string;
        costType: "TRANSPORT" | "CONTAINER" | "LABOR";
        amount: number;
      }> = [];

      for (const row of editCarRows) {
        if (Number(row.tranFee) > 0) {
          allocations.push({
            vin: row.vin,
            costType: "TRANSPORT",
            amount: Number(row.tranFee),
          });
        }
        if (Number(row.containerFee) > 0) {
          allocations.push({
            vin: row.vin,
            costType: "CONTAINER",
            amount: Number(row.containerFee),
          });
        }
        if (Number(row.laborFee) > 0) {
          allocations.push({
            vin: row.vin,
            costType: "LABOR",
            amount: Number(row.laborFee),
          });
        }
      }

      const dto = {
        supplierId: editTransportCompanyId || undefined,
        billDate: editShippingDate ? new Date(editShippingDate).toISOString() : undefined,
        paidAmount: typeof editPaidAmount === "number" ? editPaidAmount : 0,
        description: editDescription || undefined,
        totalAmount: modalComputedTotal,
        allocations,
      };

      await costService.updateBill(selectedBill.id, dto);
      setActionSuccess(`Invoice "${selectedBill.billNumber}" updated successfully!`);
      setSelectedBill(null);
      await fetchData();
    } catch (err: unknown) {
      console.error("Failed to update bill", err);
      setBillSaveError(err instanceof Error ? err.message : "Failed to save bill changes");
    } finally {
      setBillSaving(false);
    }
  };

  // Add Car inline to "Add new shipping fee" form
  const handleAddCarInline = () => {
    if (!selectedCarVin) return;
    const v = vehicles.find((x) => x.vin === selectedCarVin);
    if (!v) return;

    if (addedCars.some((c) => c.vin === v.vin)) {
      alert("This vehicle has already been added.");
      return;
    }

    const tFee = typeof inputTranFee === "number" ? inputTranFee : 0;
    const cFee = typeof inputContainerFee === "number" ? inputContainerFee : 0;
    const lFee = typeof inputLaborFee === "number" ? inputLaborFee : 0;
    const total = tFee + cFee + lFee;

    const newItem: AddedCarItem = {
      carId: v.id,
      vin: v.vin,
      brand: v.brand || "",
      model: v.model || v.displayName || "",
      year: v.madeYear || "-",
      color: v.color || "-",
      tranFee: tFee,
      containerFee: cFee,
      laborFee: lFee,
      total,
    };

    setAddedCars((prev) => [...prev, newItem]);
    setSelectedCarVin("");
    setInputTranFee("");
    setInputContainerFee("");
    setInputLaborFee("");
  };

  // Handle Save "Add new shipping fee"
  const handleSaveShippingBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      alert("Please provide an Invoice Number.");
      return;
    }
    if (!transportCompanyId) {
      alert("Please select a Transport company.");
      return;
    }
    if (addedCars.length === 0) {
      alert("Please add at least one vehicle to this shipping bill.");
      return;
    }

    setSavingBill(true);
    try {
      const calculatedTotal = addedCars.reduce((sum, c) => sum + c.total, 0);

      const allocations: Array<{
        vin: string;
        costType: "TRANSPORT" | "CONTAINER" | "LABOR";
        amount: number;
      }> = [];

      for (const car of addedCars) {
        if (car.tranFee > 0) {
          allocations.push({ vin: car.vin, costType: "TRANSPORT", amount: car.tranFee });
        }
        if (car.containerFee > 0) {
          allocations.push({ vin: car.vin, costType: "CONTAINER", amount: car.containerFee });
        }
        if (car.laborFee > 0) {
          allocations.push({ vin: car.vin, costType: "LABOR", amount: car.laborFee });
        }
      }

      await costService.createBill({
        billNumber: invoiceNumber.trim(),
        supplierId: transportCompanyId,
        category: "TRANSPORT",
        totalAmount: calculatedTotal,
        paidAmount: typeof paidAmount === "number" ? paidAmount : 0,
        billDate: shippingDate,
        description: description || invoiceNumber.trim(),
        allocations,
      });

      setActionSuccess(`Shipping bill "${invoiceNumber}" saved successfully!`);
      // Reset form
      setInvoiceNumber("");
      setAddedCars([]);
      setPaidAmount(0);
      setDescription("");
      setViewMode("dashboard");
      await fetchData();
    } catch (err: unknown) {
      console.error("Failed to save shipping bill", err);
      alert(err instanceof Error ? err.message : "Failed to save shipping bill");
    } finally {
      setSavingBill(false);
    }
  };

  // Handle Create or Edit Logistic Company
  const handleSubmitCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyNameEn.trim()) {
      setCompanyError("Company name (EN) is required.");
      return;
    }
    setCompanySaving(true);
    setCompanyError(null);
    try {
      if (editingCompanyId) {
        await settingsService.updateSupplier(editingCompanyId, {
          nameEn: companyNameEn.trim(),
          nameKh: companyNameKh.trim() || undefined,
          email: companyEmail.trim() || undefined,
          website: companyWebsite.trim() || undefined,
          country: companyCountry.trim() || undefined,
          phone: companyPhone1.trim() || undefined,
          phone2: companyPhone2.trim() || undefined,
          address: companyAddress.trim() || undefined,
          note: companyNote.trim() || undefined,
        });
        setActionSuccess(`Company "${companyNameEn}" updated.`);
      } else {
        const created = await settingsService.createSupplier({
          nameEn: companyNameEn.trim(),
          nameKh: companyNameKh.trim() || undefined,
          email: companyEmail.trim() || undefined,
          website: companyWebsite.trim() || undefined,
          country: companyCountry.trim() || undefined,
          phone: companyPhone1.trim() || undefined,
          phone2: companyPhone2.trim() || undefined,
          address: companyAddress.trim() || undefined,
          note: companyNote.trim() || undefined,
          category: "LOGISTICS",
        });
        if (created && (created as { id?: string }).id) {
          setTransportCompanyId((created as { id?: string }).id!);
        }
        setActionSuccess(`Logistic company "${companyNameEn}" created.`);
      }

      setIsCompanyDialogOpen(false);
      resetCompanyForm();
      await fetchData();
    } catch (err: unknown) {
      console.error("Failed to save company", err);
      setCompanyError(err instanceof Error ? err.message : "Failed to save logistic company");
    } finally {
      setCompanySaving(false);
    }
  };

  const resetCompanyForm = () => {
    setEditingCompanyId(null);
    setCompanyNameEn("");
    setCompanyNameKh("");
    setCompanyEmail("");
    setCompanyWebsite("");
    setCompanyCountry("");
    setCompanyPhone1("");
    setCompanyPhone2("");
    setCompanyAddress("");
    setCompanyNote("");
    setCompanyError(null);
  };

  const handleOpenEditCompany = (s: SupplierOption) => {
    setEditingCompanyId(s.id);
    setCompanyNameEn(s.nameEn || "");
    setCompanyNameKh(s.nameKh || "");
    setCompanyEmail(s.email || "");
    setCompanyWebsite(s.website || "");
    setCompanyCountry(s.country || "");
    setCompanyPhone1(s.phone || "");
    setCompanyPhone2(s.phone2 || "");
    setCompanyAddress(s.address || "");
    setCompanyNote(s.note || "");
    setCompanyError(null);
    setIsCompanyDialogOpen(true);
  };

  const handleDeleteCompany = (s: SupplierOption) => {
    requestConfirmDelete({
      title: "Confirm Delete Company",
      itemName: s.nameEn,
      description: `Are you sure you want to delete logistic company "${s.nameEn}"?`,
      onConfirm: async () => {
        await settingsService.deleteSupplier(s.id);
        setActionSuccess(`Company "${s.nameEn}" deleted.`);
        await fetchData();
      },
    });
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1700px] mx-auto min-h-screen text-slate-800">
      {/* Breadcrumb matching Screenshot 2 */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <LayoutGrid className="h-3.5 w-3.5 text-sky-500" />
        <Link href="/" className="text-sky-600 hover:underline">
          Dashboard
        </Link>
        <span>&gt;</span>
        <span className="text-slate-700">Shipping info</span>
        {viewMode === "add-shipping" && (
          <>
            <span>&gt;</span>
            <span className="text-slate-700 font-semibold">Add new shipping fee</span>
          </>
        )}
      </div>

      {/* Action feedback alert banner */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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
          MODE 1: ADD NEW SHIPPING FEE FORM
         ═══════════════════════════════════════════════════════════════════ */}
      {viewMode === "add-shipping" ? (
        <div className="bg-white rounded-[2px] border border-[#e4e7ed] p-5 shadow-xs space-y-6">
          {/* Header with Title and Invoice Number on Right */}
          <div className="flex flex-wrap items-end justify-between gap-4 pt-1 pb-1">
            <h1 className="text-[20px] font-bold text-[#2c3e50] tracking-tight">
              Add new shipping fee
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
                placeholder="ZHH260414SA"
                className="w-64 sm:w-72 h-[30px] px-2.5 text-[12px] font-mono border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
              />
            </div>
          </div>

          <form onSubmit={handleSaveShippingBill} className="space-y-6">
            {/* Top 3 Form Fields: Shipping Date | Transport Company | Paid Amount */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="space-y-1">
                <label className="text-[12px] font-medium text-slate-700">
                  Shipping date
                </label>
                <input
                  type="date"
                  required
                  value={shippingDate}
                  onChange={(e) => setShippingDate(e.target.value)}
                  className="w-full h-[32px] px-2.5 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-medium text-slate-700">
                  Transport company
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    required
                    value={transportCompanyId}
                    onChange={(e) => setTransportCompanyId(e.target.value)}
                    className="flex-1 h-[32px] px-2.5 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                  >
                    <option value="">-- Choose logistic company --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn} {s.nameKh ? `(${s.nameKh})` : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      resetCompanyForm();
                      setIsCompanyDialogOpen(true);
                    }}
                    title="Add new logistic company"
                    className="h-[32px] px-2 bg-[#409eff] hover:bg-[#337ecc] text-white rounded-[2px] cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-medium text-slate-700">
                  Paid Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paidAmount}
                  onChange={(e) =>
                    setPaidAmount(e.target.value === "" ? "" : parseFloat(e.target.value))
                  }
                  placeholder="0.00"
                  className="w-full h-[32px] px-2.5 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                />
              </div>
            </div>

            {/* Description textarea */}
            <div className="space-y-1 text-xs">
              <label className="text-[12px] font-medium text-slate-700">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description / note for this shipping invoice..."
                className="w-full p-2 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
              />
            </div>

            {/* "Select car" Trigger Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setModalSelectedVins([]);
                  setModalBatchTranFee("");
                  setModalBatchContainerFee("");
                  setModalBatchLaborFee("");
                  setIsSelectCarModalOpen(true);
                }}
                className="h-[32px] px-4 bg-[#409eff] hover:bg-[#337ecc] text-white rounded-[2px] text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Select car from stock</span>
              </button>
            </div>

            {/* Added Cars Table */}
            <div className="border border-[#e4e7ed] rounded-[2px] overflow-hidden">
              <div className="bg-[#f5f7fa] px-4 py-2 border-b border-[#e4e7ed] flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  Vehicle List ({addedCars.length})
                </span>
                <span className="font-bold text-[#409eff] text-sm">
                  Total Shipping: $
                  {addedCars
                    .reduce((sum, c) => sum + c.total, 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f5f7fa] text-slate-700 font-semibold border-b border-[#e4e7ed]">
                      <th className="p-2.5 w-12 text-center">#</th>
                      <th className="p-2.5">Brand</th>
                      <th className="p-2.5">Model</th>
                      <th className="p-2.5">VIN</th>
                      <th className="p-2.5">Year</th>
                      <th className="p-2.5">Color</th>
                      <th className="p-2.5 text-right">Tran fee ($)</th>
                      <th className="p-2.5 text-right">Container fee ($)</th>
                      <th className="p-2.5 text-right">Labor fee ($)</th>
                      <th className="p-2.5 text-right">Total ($)</th>
                      <th className="p-2.5 text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Inline Quick-Add Row */}
                    <tr className="bg-sky-50/40 border-b border-sky-100">
                      <td className="p-2 text-center text-slate-400 font-mono text-[11px]">
                        +
                      </td>
                      <td colSpan={5} className="p-2">
                        <select
                          value={selectedCarVin}
                          onChange={(e) => setSelectedCarVin(e.target.value)}
                          className="w-full h-[28px] px-2 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800"
                        >
                          <option value="">-- Choose car from inventory --</option>
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.vin}>
                              {v.displayName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={inputTranFee}
                          onChange={(e) =>
                            setInputTranFee(e.target.value === "" ? "" : parseFloat(e.target.value))
                          }
                          className="w-full h-[28px] px-2 text-right border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={inputContainerFee}
                          onChange={(e) =>
                            setInputContainerFee(e.target.value === "" ? "" : parseFloat(e.target.value))
                          }
                          className="w-full h-[28px] px-2 text-right border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={inputLaborFee}
                          onChange={(e) =>
                            setInputLaborFee(e.target.value === "" ? "" : parseFloat(e.target.value))
                          }
                          className="w-full h-[28px] px-2 text-right border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 font-mono"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-semibold text-slate-800">
                        $
                        {(
                          (typeof inputTranFee === "number" ? inputTranFee : 0) +
                          (typeof inputContainerFee === "number" ? inputContainerFee : 0) +
                          (typeof inputLaborFee === "number" ? inputLaborFee : 0)
                        ).toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={handleAddCarInline}
                          disabled={!selectedCarVin}
                          className="h-[28px] px-2.5 bg-[#409eff] hover:bg-[#337ecc] text-white rounded-[2px] text-xs font-medium cursor-pointer disabled:opacity-40"
                        >
                          Add
                        </button>
                      </td>
                    </tr>

                    {/* Added Cars List */}
                    {addedCars.length === 0 ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="p-6 text-center text-slate-400 text-xs italic"
                        >
                          No vehicles added yet. Click &quot;Select car from stock&quot; or use the quick add row above.
                        </td>
                      </tr>
                    ) : (
                      addedCars.map((car, idx) => (
                        <tr
                          key={car.vin}
                          className="border-b border-[#e4e7ed] hover:bg-slate-50/60"
                        >
                          <td className="p-2.5 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-800">
                            {car.brand}
                          </td>
                          <td className="p-2.5 text-slate-700">{car.model}</td>
                          <td className="p-2.5 font-mono text-slate-600">
                            {car.vin}
                          </td>
                          <td className="p-2.5 text-slate-600">{car.year}</td>
                          <td className="p-2.5 text-slate-600">{car.color}</td>
                          <td className="p-2.5 text-right font-mono text-slate-700">
                            ${car.tranFee.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-700">
                            ${car.containerFee.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-700">
                            ${car.laborFee.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            ${car.total.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setAddedCars((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
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
            </div>

            {/* Bottom Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setViewMode("dashboard")}
                className="h-[32px] px-5 border border-[#dcdfe6] text-slate-700 hover:bg-slate-50 rounded-[2px] text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingBill || addedCars.length === 0}
                className="h-[32px] px-6 bg-[#409eff] hover:bg-[#337ecc] text-white rounded-[2px] text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{savingBill ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
            MODE 2: DASHBOARD (Bill List & Logistic Company Tabs)
           ═══════════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* Header Title & Top Blue Action Buttons (matching Screenshot media_1794532701869_95b590d0.png) */}
          <div className="space-y-3">
            <h1 className="text-[22px] font-bold text-[#2c3e50] tracking-tight">
              Shipping info
            </h1>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("add-shipping")}
                className="h-[30px] px-3.5 bg-[#409eff] hover:bg-[#337ecc] text-white rounded-[2px] text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New bill</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  resetCompanyForm();
                  setIsCompanyDialogOpen(true);
                }}
                className="h-[30px] px-3.5 bg-[#409eff] hover:bg-[#337ecc] text-white rounded-[2px] text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New logistic company</span>
              </button>
            </div>
          </div>

          {/* Subtabs: Bill List | Logistic Company */}
          <div className="border-b border-[#e4e7ed] flex items-center gap-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveMainTab("bill-list")}
              className={cn(
                "pb-2.5 cursor-pointer relative font-medium",
                activeMainTab === "bill-list"
                  ? "text-[#409eff] font-semibold border-b-2 border-[#409eff]"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Bill List
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab("logistic-company")}
              className={cn(
                "pb-2.5 cursor-pointer relative font-medium",
                activeMainTab === "logistic-company"
                  ? "text-[#409eff] font-semibold border-b-2 border-[#409eff]"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Logistic Company
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              TAB 1: BILL LIST (Matching reference media_1794532701869_95b590d0.png)
             ───────────────────────────────────────────────────────────── */}
          {activeMainTab === "bill-list" && (
            <div className="bg-white rounded-[2px] border border-[#e4e7ed] p-5 shadow-xs space-y-4">
              <div>
                <h2 className="text-[14px] font-bold text-slate-800">Bill list</h2>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Left: Filter by Bill No */}
                <div className="w-64">
                  <input
                    type="text"
                    value={billNoFilter}
                    onChange={(e) => {
                      setBillNoFilter(e.target.value);
                      setAppliedBillFilter(e.target.value);
                    }}
                    placeholder="Filter bill"
                    className="w-full h-[30px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
                  />
                </div>

                {/* Right: Search By Vin Number + Search Button */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={vinFilter}
                    onChange={(e) => setVinFilter(e.target.value)}
                    placeholder="Search By Vin Number"
                    className="w-56 h-[30px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#409eff]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedVinFilter(vinFilter);
                      setAppliedBillFilter(billNoFilter);
                    }}
                    className="h-[30px] px-3.5 bg-[#f56c6c] hover:bg-[#e64242] text-white rounded-[2px] text-xs font-medium cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Search className="h-3 w-3" />
                    <span>Search</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 italic pt-1">
                view bill was add
              </div>

              {/* Table with columns matching screenshot:
                  #, Bill No, Paid amount, Balance, Total, Bill date, Supplier, Action */}
              <div className="overflow-x-auto border border-[#e4e7ed] rounded-[2px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f5f7fa] text-slate-700 font-semibold border-b border-[#e4e7ed]">
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3">Bill No</th>
                      <th className="p-3 text-right">Paid amount</th>
                      <th className="p-3 text-right">Balance</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Bill date</th>
                      <th className="p-3">Supplier</th>
                      <th className="p-3 text-center w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center">
                          <Skeleton className="h-5 w-48 mx-auto" />
                        </td>
                      </tr>
                    ) : paginatedBills.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-8 text-center text-slate-400 italic text-xs"
                        >
                          No shipping bills found.
                        </td>
                      </tr>
                    ) : (
                      paginatedBills.map((b, idx) => {
                        const rowNo =
                          pageSize <= 0 ? idx + 1 : (currentPage - 1) * effectivePageSize + idx + 1;
                        return (
                          <tr
                            key={b.id}
                            className="border-b border-[#e4e7ed] hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="p-3 text-center font-mono text-slate-500">
                              {rowNo}
                            </td>
                            <td className="p-3 font-semibold text-slate-800">
                              {b.billNumber}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-700">
                              $ {b.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-700">
                              $ {b.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-mono font-semibold text-slate-900">
                              $ {b.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center text-slate-600 font-mono">
                              {b.billDate ? b.billDate.slice(0, 10) : "-"}
                            </td>
                            <td className="p-3 text-slate-700 uppercase">
                              {b.supplierName || "-"}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenBillDetails(b)}
                                  className="h-6 w-6 border border-[#dcdfe6] text-slate-600 hover:text-[#409eff] hover:border-[#409eff] rounded-[2px] flex items-center justify-center cursor-pointer transition-colors"
                                  title="View invoice details"
                                >
                                  <Eye className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    requestConfirmDelete({
                                      title: "Confirm Delete Shipping Bill",
                                      itemName: `Bill No: ${b.billNumber}`,
                                      description: "Are you sure you want to delete this shipping bill? This will remove all associated shipping fees from the vehicles.",
                                      onConfirm: async () => {
                                        await costService.deleteBill(b.id);
                                        setActionSuccess(`Bill "${b.billNumber}" deleted.`);
                                        await fetchData();
                                      },
                                    });
                                  }}
                                  className="h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded-[2px] flex items-center justify-center cursor-pointer transition-colors"
                                  title="Delete invoice"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-2">
                <div className="flex items-center gap-2">
                  <span>
                    Showing {totalBills === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1} to{" "}
                    {pageSize <= 0 ? totalBills : Math.min(currentPage * effectivePageSize, totalBills)} of{" "}
                    {totalBills} bills
                  </span>
                  <div className="flex items-center gap-1.5 ml-3">
                    <span className="text-[11px] text-slate-500">Show:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-[26px] px-2 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-700 focus:outline-none focus:border-[#409eff]"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={-1}>All</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage <= 1 || pageSize <= 0}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-[28px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    &lt; Previous
                  </button>
                  <span className="h-[28px] px-3 bg-[#409eff] text-white rounded-[2px] text-xs font-semibold flex items-center justify-center">
                    {currentPage}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages || pageSize <= 0}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-[28px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next &gt;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              TAB 2: LOGISTIC COMPANY TAB
             ───────────────────────────────────────────────────────────── */}
          {activeMainTab === "logistic-company" && (
            <div className="bg-white rounded-[2px] border border-[#e4e7ed] p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <h2 className="text-[14px] font-bold text-slate-800">
                  Logistic Company ({filteredSuppliers.length})
                </h2>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    placeholder="Search company..."
                    className="w-48 h-[30px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                  />
                  <select
                    value={companyCountryFilter}
                    onChange={(e) => setCompanyCountryFilter(e.target.value)}
                    className="h-[30px] px-2.5 text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                  >
                    <option value="all">All Countries</option>
                    {countriesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto border border-[#e4e7ed] rounded-[2px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f5f7fa] text-slate-700 font-semibold border-b border-[#e4e7ed]">
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3">Company (EN)</th>
                      <th className="p-3">Company (KH)</th>
                      <th className="p-3">Country</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Address</th>
                      <th className="p-3 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-8 text-center text-slate-400 italic text-xs"
                        >
                          No logistic companies found.
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map((s, idx) => (
                        <tr
                          key={s.id}
                          className="border-b border-[#e4e7ed] hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="p-3 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            {s.nameEn}
                          </td>
                          <td className="p-3 text-slate-700">{s.nameKh || "-"}</td>
                          <td className="p-3 text-slate-600">{s.country || "-"}</td>
                          <td className="p-3 text-slate-600 font-mono">
                            {s.phone || "-"}
                          </td>
                          <td className="p-3 text-slate-600">{s.email || "-"}</td>
                          <td className="p-3 text-slate-600">{s.address || "-"}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCompany(s)}
                                className="h-6 w-6 border border-[#dcdfe6] text-slate-600 hover:text-[#409eff] hover:border-[#409eff] rounded-[2px] flex items-center justify-center cursor-pointer transition-colors"
                                title="Edit company"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCompany(s)}
                                className="h-6 w-6 border border-[#dcdfe6] text-slate-600 hover:text-red-600 hover:border-red-400 rounded-[2px] flex items-center justify-center cursor-pointer transition-colors"
                                title="Delete company"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: VIEW & EDIT INVOICE (Exact Reference Screenshot media_1794533295563_fadfcbd4.png)
         ═══════════════════════════════════════════════════════════════════ */}
      {selectedBill && (
        <Dialog
          open={!!selectedBill}
          onOpenChange={(open) => {
            if (!open) setSelectedBill(null);
          }}
        >
          <DialogContent className="sm:max-w-[1050px] max-w-[96vw] w-full p-0 overflow-hidden rounded-[4px] border border-slate-200 shadow-2xl">
            {/* Top Blue Header with Invoice Number */}
            <div className="bg-[#1976d2] text-white px-5 py-3 flex items-center justify-between">
              <DialogTitle className="text-[14px] font-semibold tracking-wide text-white">
                Invoice Number : {selectedBill.billNumber}
              </DialogTitle>
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs bg-white max-h-[85vh] overflow-y-auto">
              {billSaveError && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
                  {billSaveError}
                </div>
              )}

              {/* Form Fields: Shipping Date | Transport Company | Paid Amount | Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">
                    Shipping date
                  </label>
                  <input
                    type="date"
                    value={editShippingDate}
                    onChange={(e) => setEditShippingDate(e.target.value)}
                    className="w-full h-[30px] px-2.5 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">
                    Transport company
                  </label>
                  <select
                    value={editTransportCompanyId}
                    onChange={(e) => setEditTransportCompanyId(e.target.value)}
                    className="w-full h-[30px] px-2 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                  >
                    <option value="">-- Choose company --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn} {s.nameKh ? `(${s.nameKh})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">
                    Paid Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPaidAmount}
                    onChange={(e) =>
                      setEditPaidAmount(
                        e.target.value === "" ? "" : parseFloat(e.target.value)
                      )
                    }
                    className="w-full h-[30px] px-2.5 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">
                    Balance
                  </label>
                  <div className="w-full h-[30px] px-2.5 flex items-center bg-slate-50 border border-[#dcdfe6] rounded-[2px] text-xs font-mono font-semibold text-slate-700">
                    ${modalComputedBalance.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                />
              </div>

              {/* Car list header and total */}
              <div className="flex items-center justify-between border-t border-[#e4e7ed] pt-3">
                <div className="text-[13px] font-bold text-slate-800">
                  Car list ({editCarRows.length} {editCarRows.length === 1 ? "vehicle" : "vehicles"})
                </div>
                <div className="text-[14px] font-bold text-slate-800">
                  Total: ${modalComputedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Car list Table matching Screenshot media_1794533295563_fadfcbd4.png:
                  #, Brand, Model, Vin, Year, Color, Tran fee, Container fee, Labor fee, Total, Action */}
              <div className="border border-[#e4e7ed] rounded-[2px] overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f5f7fa] text-slate-700 font-semibold border-b border-[#e4e7ed]">
                      <th className="p-2 w-10 text-center">#</th>
                      <th className="p-2">Brand</th>
                      <th className="p-2">Model</th>
                      <th className="p-2">Vin</th>
                      <th className="p-2">Year</th>
                      <th className="p-2">Color</th>
                      <th className="p-2 text-right">Tran fee</th>
                      <th className="p-2 text-right">Container fee</th>
                      <th className="p-2 text-right">Labor fee</th>
                      <th className="p-2 text-right">Line Total</th>
                      <th className="p-2 text-center w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editCarRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={11}
                          className="p-6 text-center text-slate-400 italic text-xs"
                        >
                          No vehicles listed on this bill.
                        </td>
                      </tr>
                    ) : (
                      editCarRows.map((row, idx) => (
                        <tr
                          key={row.vin}
                          className="border-b border-[#e4e7ed] hover:bg-slate-50/70"
                        >
                          <td className="p-2 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-2 font-semibold text-slate-800">
                            {row.brand}
                          </td>
                          <td className="p-2 text-slate-700">{row.model}</td>
                          <td className="p-2 font-mono text-slate-600">
                            {row.vin}
                          </td>
                          <td className="p-2 text-slate-600">{row.year}</td>
                          <td className="p-2 text-slate-600">{row.color}</td>

                          {/* Tran fee */}
                          <td className="p-2 text-right font-mono text-slate-800">
                            ${row.tranFee.toFixed(2)}
                          </td>

                          {/* Container fee */}
                          <td className="p-2 text-right font-mono text-slate-800">
                            ${row.containerFee.toFixed(2)}
                          </td>

                          {/* Labor fee */}
                          <td className="p-2 text-right font-mono text-slate-800">
                            ${row.laborFee.toFixed(2)}
                          </td>

                          {/* Line Total */}
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            ${row.lineTotal.toFixed(2)}
                          </td>

                          {/* Action */}
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCarModal(idx)}
                                className="h-6 w-6 bg-[#409eff] hover:bg-[#337ecc] text-white rounded-[2px] flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                title="Edit car info"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCarRow(idx)}
                                className="h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded-[2px] flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                                title="Remove car from invoice"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-[#e4e7ed] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedBill) return;
                    requestConfirmDelete({
                      title: "Confirm Delete Invoice",
                      itemName: `Invoice No: ${selectedBill.billNumber}`,
                      description: "Are you sure you want to delete this shipping invoice? This will remove all associated fees from the vehicles.",
                      onConfirm: async () => {
                        await costService.deleteBill(selectedBill.id);
                        setActionSuccess(`Invoice "${selectedBill.billNumber}" deleted successfully.`);
                        setSelectedBill(null);
                        await fetchData();
                      },
                    });
                  }}
                  className="h-[32px] px-3.5 bg-red-600 hover:bg-red-700 text-white rounded-[2px] text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Invoice</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBill(null)}
                    className="h-[32px] px-4 border border-[#dcdfe6] text-slate-700 hover:bg-slate-50 rounded-[2px] text-xs font-medium cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBillChanges}
                    disabled={billSaving}
                    className="h-[32px] px-5 bg-[#1976d2] hover:bg-[#1565c0] text-white rounded-[2px] text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{billSaving ? "Saving..." : "Save changes"}</span>
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Sub-modal: Edit car info (Matching Screenshot media_1794535232469_d4e0e776.jpg) */}
      {editingCarIndex !== null && editCarRows[editingCarIndex] && (
        <Dialog
          open={editingCarIndex !== null}
          onOpenChange={(open) => {
            if (!open) setEditingCarIndex(null);
          }}
        >
          <DialogContent className="sm:max-w-[620px] max-w-[94vw] w-full p-0 overflow-hidden rounded-[4px] border border-slate-200 shadow-2xl">
            {/* Header: Edit car info */}
            <div className="bg-[#1976d2] text-white px-5 py-3 flex items-center justify-between">
              <DialogTitle className="text-[14px] font-semibold tracking-wide text-white">
                Edit car info
              </DialogTitle>
              <button
                type="button"
                onClick={() => setEditingCarIndex(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 bg-white text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">Choose car</label>
                  <input
                    type="text"
                    readOnly
                    value={editCarRows[editingCarIndex]?.vin || ""}
                    className="w-full h-[32px] px-2.5 font-mono text-[11px] bg-slate-50 border border-[#dcdfe6] rounded-[2px] text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">Tran fee</label>
                  <input
                    type="number"
                    step="0.01"
                    value={carModalTranFee}
                    onChange={(e) =>
                      setCarModalTranFee(e.target.value === "" ? "" : parseFloat(e.target.value))
                    }
                    className="w-full h-[32px] px-2.5 font-mono text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">Container fee</label>
                  <input
                    type="number"
                    step="0.01"
                    value={carModalContainerFee}
                    onChange={(e) =>
                      setCarModalContainerFee(e.target.value === "" ? "" : parseFloat(e.target.value))
                    }
                    className="w-full h-[32px] px-2.5 font-mono text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">Labor fee</label>
                  <input
                    type="number"
                    step="0.01"
                    value={carModalLaborFee}
                    onChange={(e) =>
                      setCarModalLaborFee(e.target.value === "" ? "" : parseFloat(e.target.value))
                    }
                    className="w-full h-[32px] px-2.5 font-mono text-xs border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCarIndex(null)}
                  className="h-[30px] px-4 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-[2px] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveCarModal}
                  className="h-[30px] px-5 bg-[#409eff] hover:bg-[#337ecc] text-white rounded-[2px] text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  Save
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: "Adding new logistic company"
         ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
        <DialogContent className="sm:max-w-[540px] max-w-[95vw] w-full p-0 overflow-hidden rounded-[4px] border border-slate-200 shadow-2xl">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">
                  Company Name (EN) *
                </label>
                <input
                  type="text"
                  required
                  value={companyNameEn}
                  onChange={(e) => setCompanyNameEn(e.target.value)}
                  placeholder="GUANGZHOU ZHONGHUI TRANS CO., LTD"
                  className="w-full h-[30px] px-2.5 border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">
                  Company Name (KH)
                </label>
                <input
                  type="text"
                  value={companyNameKh}
                  onChange={(e) => setCompanyNameKh(e.target.value)}
                  placeholder="ឈ្មោះក្រុមហ៊ុនជាភាសាខ្មែរ"
                  className="w-full h-[30px] px-2.5 border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Country</label>
                <select
                  value={companyCountry}
                  onChange={(e) => setCompanyCountry(e.target.value)}
                  className="w-full h-[30px] px-2.5 border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                >
                  <option value="">-- Choose country --</option>
                  {countriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="info@logistics.com"
                  className="w-full h-[30px] px-2.5 border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Phone</label>
                <input
                  type="text"
                  value={companyPhone1}
                  onChange={(e) => setCompanyPhone1(e.target.value)}
                  placeholder="+86..."
                  className="w-full h-[30px] px-2.5 border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-700">Phone 2</label>
                <input
                  type="text"
                  value={companyPhone2}
                  onChange={(e) => setCompanyPhone2(e.target.value)}
                  placeholder="Optional second phone"
                  className="w-full h-[30px] px-2.5 border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700">Address</label>
              <textarea
                rows={2}
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Company physical address / port office..."
                className="w-full p-2 border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e4e7ed]">
              <button
                type="button"
                onClick={() => setIsCompanyDialogOpen(false)}
                className="h-[30px] px-4 border border-[#dcdfe6] text-slate-700 hover:bg-slate-50 rounded-[2px] text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={companySaving}
                className="h-[30px] px-5 bg-[#409eff] hover:bg-[#337ecc] text-white rounded-[2px] text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {companySaving ? "Saving..." : editingCompanyId ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Styled Confirmation Delete Modal */}
      <ConfirmDeleteModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={deleteDialogTitle}
        itemName={deleteItemName}
        description={deleteDialogDescription}
        loading={deleteLoading}
        onConfirm={async () => {
          if (!pendingDeleteAction) return;
          setDeleteLoading(true);
          try {
            await pendingDeleteAction();
            setDeleteConfirmOpen(false);
          } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to delete");
          } finally {
            setDeleteLoading(false);
          }
        }}
      />
    </div>
  );
}

export default function ShippingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading shipping...</div>}>
      <ShippingContent />
    </Suspense>
  );
}
