"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Wrench,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  PlusCircle,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Car,
  Settings,
} from "lucide-react";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  costService,
  settingsService,
  type LandedCostBillRecord,
} from "@/lib/api";

interface VehicleOption {
  id: string;
  vin: string;
  brand: string;
  model: string;
  madeYear: number;
  color?: string;
  status?: string;
  displayName?: string;
}

interface SupplierOption {
  id: string;
  nameEn: string;
  nameKh?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  website?: string;
  address?: string;
  note?: string;
  category?: string;
  _count?: {
    vehicles?: number;
    bills?: number;
  };
}

interface CarRepairedRow {
  id: string; // bill id or item id
  billId: string;
  costItemId?: string;
  brand: string;
  model: string;
  brandModel: string;
  vin: string;
  year: number;
  amount: number;
  payment: number;
  balance: number;
  repairDate: string;
  supplier: string;
  supplierId?: string;
  note: string;
}

interface TempLineItem {
  id: string;
  brandModel: string;
  vin: string;
  amount: number;
  payment: number;
  balance: number;
  repairDate: string;
  supplier: string;
  supplierId: string;
  itemRepair: string;
  madeYear: number;
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

export function RepairInfoView() {
  const [activeTab, setActiveTab] = useState<"car_repaired" | "repair_supplier">("car_repaired");

  // Raw data from API
  const [bills, setBills] = useState<LandedCostBillRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [countryList, setCountryList] = useState<string[]>(STANDARD_COUNTRIES);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filters for Car Repaired Tab
  const [filterBrand, setFilterBrand] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterVin, setFilterVin] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [carPage, setCarPage] = useState(1);
  const pageSize = 10;

  // Filters for Repair Supplier Tab
  const [filterSupplierName, setFilterSupplierName] = useState("");
  const [filterSupplierPhone, setFilterSupplierPhone] = useState("");
  const [supplierPage, setSupplierPage] = useState(1);

  // Modals state
  const [isAddRepairModalOpen, setIsAddRepairModalOpen] = useState(false);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [viewingRepairRow, setViewingRepairRow] = useState<CarRepairedRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New Car Repair Modal Form Fields
  const [newRepairDate, setNewRepairDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedVin, setSelectedVin] = useState("");
  const [itemRepairText, setItemRepairText] = useState("");
  const [itemAmount, setItemAmount] = useState<number | "">("");
  const [itemPayment, setItemPayment] = useState<number | "">("");
  const [tempItems, setTempItems] = useState<TempLineItem[]>([]);

  // New Repair Supplier Modal Form Fields
  const [supNameEn, setSupNameEn] = useState("");
  const [supNameKh, setSupNameKh] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supWebsite, setSupWebsite] = useState("");
  const [supCountry, setSupCountry] = useState("");
  const [supPhone1, setSupPhone1] = useState("");
  const [supPhone2, setSupPhone2] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [supNote, setSupNote] = useState("");

  // View Repair Modal Inner Filter
  const [viewModalSupplierFilter, setViewModalSupplierFilter] = useState("");

  // Dismiss feedback
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(t);
  }, [feedback]);

  // Load all necessary data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [billsData, optionsData, allSuppliers, countriesData] = await Promise.all([
        costService.getBills("REPAIR").catch(() => []),
        costService.getOptions().catch(() => ({ suppliers: [], vehicles: [] })),
        settingsService.getSuppliers().catch(() => []),
        settingsService.getCountries().catch(() => []),
      ]);

      setBills(Array.isArray(billsData) ? billsData : []);

      const safeVehicles = (optionsData?.vehicles as VehicleOption[]) || [];
      setVehicles(safeVehicles);

      const allSupList = Array.isArray(allSuppliers) ? (allSuppliers as SupplierOption[]) : [];
      setSuppliers(allSupList);

      if (Array.isArray(countriesData) && countriesData.length > 0) {
        const names = countriesData.map((c: { name: string }) => c.name.toUpperCase().trim()).filter(Boolean);
        const merged = Array.from(new Set([...STANDARD_COUNTRIES, ...names])).sort();
        setCountryList(merged);
      }
    } catch (err: unknown) {
      console.error("Failed to load repair data:", err);
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to load repair info",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Flatten repair bills into car repaired rows
  const allCarRepairedRows = useMemo<CarRepairedRow[]>(() => {
    const rows: CarRepairedRow[] = [];
    bills.forEach((bill) => {
      const repairDateStr = bill.billDate ? bill.billDate.slice(0, 10) : "";
      if (bill.vehicles && bill.vehicles.length > 0) {
        bill.vehicles.forEach((v) => {
          const allocAmount = Number(v.allocatedAmount) || Number(bill.totalAmount) || 0;
          // Approximate payment allocated proportionally or 1-to-1
          const paidRatio = bill.totalAmount > 0 ? bill.paidAmount / bill.totalAmount : 1;
          const allocPaid = Math.min(allocAmount, allocAmount * paidRatio);
          const allocBalance = Math.max(0, allocAmount - allocPaid);

          rows.push({
            id: v.id || bill.id,
            billId: bill.id,
            costItemId: v.id,
            brand: v.brand || "N/A",
            model: v.model || "N/A",
            brandModel: `${v.brand || ""} ${v.model || ""}`.trim() || "N/A",
            vin: v.vin,
            year: v.madeYear || new Date().getFullYear(),
            amount: allocAmount,
            payment: allocPaid,
            balance: allocBalance,
            repairDate: repairDateStr,
            supplier: bill.supplierName || "General",
            supplierId: bill.supplierId,
            note: bill.description || "Car repair",
          });
        });
      } else {
        // Fallback row for bills with no vehicle array parsed
        rows.push({
          id: bill.id,
          billId: bill.id,
          brand: "N/A",
          model: "N/A",
          brandModel: "N/A",
          vin: "N/A",
          year: new Date().getFullYear(),
          amount: Number(bill.totalAmount),
          payment: Number(bill.paidAmount),
          balance: Number(bill.balance),
          repairDate: repairDateStr,
          supplier: bill.supplierName || "General",
          supplierId: bill.supplierId,
          note: bill.description || "Car repair",
        });
      }
    });
    return rows;
  }, [bills]);

  // Filtered Car Repaired Rows
  const filteredCarRepaired = useMemo(() => {
    return allCarRepairedRows.filter((r) => {
      if (filterBrand.trim() && !r.brand.toLowerCase().includes(filterBrand.trim().toLowerCase())) {
        return false;
      }
      if (filterModel.trim() && !r.model.toLowerCase().includes(filterModel.trim().toLowerCase())) {
        return false;
      }
      if (filterVin.trim() && !r.vin.toLowerCase().includes(filterVin.trim().toLowerCase())) {
        return false;
      }
      if (filterYear.trim() && !String(r.year).includes(filterYear.trim())) {
        return false;
      }
      return true;
    });
  }, [allCarRepairedRows, filterBrand, filterModel, filterVin, filterYear]);

  // Paginated Car Repaired Rows
  const paginatedCarRepaired = useMemo(() => {
    const start = (carPage - 1) * pageSize;
    return filteredCarRepaired.slice(start, start + pageSize);
  }, [filteredCarRepaired, carPage, pageSize]);

  // Repair suppliers list (category === 'REPAIR' or all if none)
  const repairSuppliersList = useMemo(() => {
    const repairOnly = suppliers.filter((s) => s.category === "REPAIR");
    const list = repairOnly.length > 0 ? repairOnly : suppliers;
    return list.filter((s) => {
      const matchName =
        !filterSupplierName.trim() ||
        (s.nameEn || "").toLowerCase().includes(filterSupplierName.trim().toLowerCase()) ||
        (s.nameKh || "").includes(filterSupplierName.trim());
      const matchPhone =
        !filterSupplierPhone.trim() ||
        (s.phone || "").includes(filterSupplierPhone.trim()) ||
        (s.phone2 || "").includes(filterSupplierPhone.trim());
      return matchName && matchPhone;
    });
  }, [suppliers, filterSupplierName, filterSupplierPhone]);

  const paginatedSuppliers = useMemo(() => {
    const start = (supplierPage - 1) * pageSize;
    return repairSuppliersList.slice(start, start + pageSize);
  }, [repairSuppliersList, supplierPage, pageSize]);

  // ─────────────────────────────────────────────
  // Action Handlers
  // ─────────────────────────────────────────────

  // Add line item into temporary list in "Adding new car repair" modal
  const handleAddTempItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVin) {
      alert("Please choose a car (VIN)");
      return;
    }
    if (!selectedSupplierId) {
      alert("Please select a repair supplier");
      return;
    }
    const numAmount = typeof itemAmount === "number" ? itemAmount : 0;
    if (numAmount <= 0) {
      alert("Please enter a valid amount greater than 0");
      return;
    }
    const numPayment = typeof itemPayment === "number" ? itemPayment : numAmount;

    const matchedVeh = vehicles.find((v) => v.vin === selectedVin);
    const matchedSup = suppliers.find((s) => s.id === selectedSupplierId);

    const brandName = matchedVeh?.brand || "VEHICLE";
    const modelName = matchedVeh?.model || "";
    const brandModel = `${brandName} ${modelName}`.trim();
    const supName = matchedSup ? (matchedSup.nameKh || matchedSup.nameEn) : "Supplier";

    const newItem: TempLineItem = {
      id: `${Date.now()}-${Math.random()}`,
      brandModel,
      vin: selectedVin,
      amount: numAmount,
      payment: numPayment,
      balance: Math.max(0, numAmount - numPayment),
      repairDate: newRepairDate,
      supplier: supName,
      supplierId: selectedSupplierId,
      itemRepair: itemRepairText.trim() || "Car repair service",
      madeYear: matchedVeh?.madeYear || new Date().getFullYear(),
    };

    setTempItems((prev) => [...prev, newItem]);
    setItemRepairText("");
    setItemAmount("");
    setItemPayment("");
  };

  const handleRemoveTempItem = (id: string) => {
    setTempItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Submit all items in "Adding new car repair" modal
  const handleSaveCarRepair = async () => {
    let finalItems = [...tempItems];

    // If user filled in car & amount but did NOT click "+ Add", auto-add it before saving!
    if (selectedVin && typeof itemAmount === "number" && itemAmount > 0) {
      if (!selectedSupplierId) {
        alert("Please select a repair supplier");
        return;
      }
      const matchedVeh = vehicles.find((v) => v.vin === selectedVin);
      const matchedSup = suppliers.find((s) => s.id === selectedSupplierId);
      const brandName = matchedVeh?.brand || "VEHICLE";
      const modelName = matchedVeh?.model || "";
      const brandModel = `${brandName} ${modelName}`.trim();
      const supName = matchedSup ? (matchedSup.nameKh || matchedSup.nameEn) : "Supplier";
      const numPayment = typeof itemPayment === "number" ? itemPayment : itemAmount;

      finalItems.push({
        id: `${Date.now()}-${Math.random()}`,
        brandModel,
        vin: selectedVin,
        amount: itemAmount,
        payment: numPayment,
        balance: Math.max(0, itemAmount - numPayment),
        repairDate: newRepairDate,
        supplier: supName,
        supplierId: selectedSupplierId,
        itemRepair: itemRepairText.trim() || "Car repair service",
        madeYear: matchedVeh?.madeYear || new Date().getFullYear(),
      });
    }

    if (finalItems.length === 0) {
      alert("Please select a car and enter repair amount, then click '+ Add' (or Save).");
      return;
    }

    setSubmitting(true);
    try {
      // Group by supplier if needed or create bills per supplier
      const itemsBySupplier = new Map<string, TempLineItem[]>();
      finalItems.forEach((it) => {
        const list = itemsBySupplier.get(it.supplierId) || [];
        list.push(it);
        itemsBySupplier.set(it.supplierId, list);
      });

      for (const [supId, supItems] of itemsBySupplier.entries()) {
        const totalAmount = supItems.reduce((acc, it) => acc + it.amount, 0);
        const paidAmount = supItems.reduce((acc, it) => acc + it.payment, 0);
        const billNumber = `REP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const descriptions = supItems.map((it) => `${it.brandModel}: ${it.itemRepair}`).join(" | ");

        await costService.createBill({
          billNumber,
          supplierId: supId,
          category: "REPAIR",
          totalAmount,
          paidAmount,
          billDate: supItems[0]?.repairDate || newRepairDate,
          description: descriptions,
          allocations: supItems.map((it) => ({
            vin: it.vin,
            amount: it.amount,
            costType: "REPAIR",
            note: it.itemRepair,
          })),
        });
      }

      setFeedback({
        type: "success",
        message: `Successfully recorded ${finalItems.length} car repair item(s)!`,
      });
      setIsAddRepairModalOpen(false);
      setTempItems([]);
      setSelectedVin("");
      setItemRepairText("");
      setItemAmount("");
      setItemPayment("");
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save car repair");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit new repair supplier in "Adding new repair supplier" modal
  const handleSaveRepairSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supNameEn.trim()) {
      alert("English name is required");
      return;
    }
    if (!supPhone1.trim()) {
      alert("Phone line 1 is required");
      return;
    }

    setSubmitting(true);
    try {
      await settingsService.createSupplier({
        nameEn: supNameEn.trim(),
        nameKh: supNameKh.trim() || undefined,
        email: supEmail.trim() || undefined,
        website: supWebsite.trim() || undefined,
        country: supCountry.trim() || "CAMBODIA",
        phone: supPhone1.trim(),
        phone2: supPhone2.trim() || undefined,
        address: supAddress.trim() || undefined,
        note: supNote.trim() || undefined,
        category: "REPAIR",
      });

      setFeedback({
        type: "success",
        message: `Repair supplier "${supNameEn}" created successfully!`,
      });

      setIsAddSupplierModalOpen(false);
      setSupNameEn("");
      setSupNameKh("");
      setSupEmail("");
      setSupWebsite("");
      setSupPhone1("");
      setSupPhone2("");
      setSupAddress("");
      setSupNote("");
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create repair supplier");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete repair bill or cost item
  const handleDeleteRepairRecord = async (row: CarRepairedRow) => {
    if (!confirm(`Are you sure you want to delete repair record for "${row.brandModel} (${row.vin})"?`)) {
      return;
    }
    try {
      await costService.deleteBill(row.billId);
      setFeedback({
        type: "success",
        message: "Repair record deleted successfully!",
      });
      setViewingRepairRow(null);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete repair record");
    }
  };

  // Total amount in the temp items table
  const totalTempAmount = useMemo(() => {
    return tempItems.reduce((acc, it) => acc + it.amount, 0);
  }, [tempItems]);

  return (
    <div className="space-y-4">
      {/* ───────────────────────────────────────────────────────────
          1. HEADER & ACTION BUTTONS (Exact Screenshot)
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          Repair info
        </h1>
        <p className="text-xs text-slate-500">view and manage repair</p>
      </div>

      {/* Top Action Buttons (Red buttons) */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setTempItems([]);
            setIsAddRepairModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New car repair</span>
        </button>

        <button
          type="button"
          onClick={() => setIsAddSupplierModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New repaire supplier</span>
        </button>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`px-4 py-2 text-xs rounded border flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span className="flex items-center gap-1.5 font-medium">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            {feedback.message}
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          2. TABS: Car repaired & Repair supplier
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="flex border-b border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("car_repaired");
              setCarPage(1);
            }}
            className={`px-4 py-2.5 font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === "car_repaired"
                ? "border-[#1c64f2] text-[#1c64f2] bg-white"
                : "border-transparent text-slate-600 hover:text-slate-800 bg-slate-50/60"
            }`}
          >
            Car repaired
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("repair_supplier");
              setSupplierPage(1);
            }}
            className={`px-4 py-2.5 font-semibold transition-all border-b-2 cursor-pointer ${
              activeTab === "repair_supplier"
                ? "border-[#1c64f2] text-[#1c64f2] bg-white"
                : "border-transparent text-slate-600 hover:text-slate-800 bg-slate-50/60"
            }`}
          >
            Repair supplier
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────────
            TAB 1: CAR REPAIRED
        ───────────────────────────────────────────────────────────── */}
        {activeTab === "car_repaired" && (
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Car repaired list
              </h2>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Brand</label>
                <input
                  type="text"
                  placeholder="Brand name"
                  value={filterBrand}
                  onChange={(e) => {
                    setFilterBrand(e.target.value);
                    setCarPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Model</label>
                <input
                  type="text"
                  placeholder="Car model"
                  value={filterModel}
                  onChange={(e) => {
                    setFilterModel(e.target.value);
                    setCarPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Vin number</label>
                <input
                  type="text"
                  placeholder="vin no"
                  value={filterVin}
                  onChange={(e) => {
                    setFilterVin(e.target.value);
                    setCarPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Year</label>
                <input
                  type="text"
                  placeholder="Year"
                  value={filterYear}
                  onChange={(e) => {
                    setFilterYear(e.target.value);
                    setCarPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 pt-1">view repaired car</p>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-slate-700 font-semibold border-b border-slate-200 whitespace-nowrap">
                  <tr>
                    <th className="py-2.5 px-3 w-10">#</th>
                    <th className="py-2.5 px-3">Brand</th>
                    <th className="py-2.5 px-3">Model</th>
                    <th className="py-2.5 px-3">Vin_Number</th>
                    <th className="py-2.5 px-3">Year</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Payment</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                    <th className="py-2.5 px-3">Repair_Date</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3">Note</th>
                    <th className="py-2.5 px-3 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400">
                        កំពុងផ្ទុកទិន្នន័យ (Loading repair data)...
                      </td>
                    </tr>
                  ) : paginatedCarRepaired.length > 0 ? (
                    paginatedCarRepaired.map((row, idx) => (
                      <tr key={`${row.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {(carPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold uppercase text-slate-800">
                          {row.brand}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {row.model}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {row.vin}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {row.year}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-800 whitespace-nowrap">
                          ${row.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-emerald-600 whitespace-nowrap">
                          ${row.payment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-500 whitespace-nowrap">
                          ${row.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {row.repairDate}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {row.supplier}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={row.note}>
                          {row.note}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setViewingRepairRow(row)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="View repair details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400">
                        មិនទាន់មានទិន្នន័យជួសជុលឡាននៅឡើយទេ (No repaired car records found).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <TablePagination
                currentPage={carPage}
                totalItems={filteredCarRepaired.length}
                pageSize={pageSize}
                onPageChange={setCarPage}
              />
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────
            TAB 2: REPAIR SUPPLIER
        ───────────────────────────────────────────────────────────── */}
        {activeTab === "repair_supplier" && (
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Repair supplier list
              </h2>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs max-w-xl">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Supplier name</label>
                <input
                  type="text"
                  placeholder="Search supplier..."
                  value={filterSupplierName}
                  onChange={(e) => {
                    setFilterSupplierName(e.target.value);
                    setSupplierPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Phone number</label>
                <input
                  type="text"
                  placeholder="Search phone..."
                  value={filterSupplierPhone}
                  onChange={(e) => {
                    setFilterSupplierPhone(e.target.value);
                    setSupplierPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 pt-1">view and manage repair suppliers</p>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-slate-700 font-semibold border-b border-slate-200 whitespace-nowrap">
                  <tr>
                    <th className="py-2.5 px-3 w-10">#</th>
                    <th className="py-2.5 px-3">English Name</th>
                    <th className="py-2.5 px-3">Khmer Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Address</th>
                    <th className="py-2.5 px-3">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        កំពុងផ្ទុកទិន្នន័យ (Loading repair suppliers)...
                      </td>
                    </tr>
                  ) : paginatedSuppliers.length > 0 ? (
                    paginatedSuppliers.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {(supplierPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {s.nameEn}
                        </td>
                        <td className="py-2.5 px-3 font-khmer text-slate-700">
                          {s.nameKh || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {s.phone || s.phone2 || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {s.address || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {s.note || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        មិនទាន់មានទិន្នន័យអ្នកផ្គត់ផ្គង់ជួសជុលនៅឡើយទេ (No repair suppliers found).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <TablePagination
                currentPage={supplierPage}
                totalItems={repairSuppliersList.length}
                pageSize={pageSize}
                onPageChange={setSupplierPage}
              />
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────
          3. MODAL: ADDING NEW CAR REPAIR (Exact Screenshot 2)
      ───────────────────────────────────────────────────────────── */}
      {isAddRepairModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-300">
            {/* Dark Blue Header */}
            <div className="bg-[#112d59] text-white px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Adding new car repair</h3>
              <button
                type="button"
                onClick={() => setIsAddRepairModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Row 1: Repair date, Repair supplier, Choose car */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Repair date
                  </label>
                  <input
                    type="date"
                    value={newRepairDate}
                    onChange={(e) => setNewRepairDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 font-medium">
                      Repair supplier
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddSupplierModalOpen(true)}
                      className="text-[11px] text-[#1c64f2] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>New supplier</span>
                    </button>
                  </div>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                  >
                    <option value="">--Select--</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn} {s.nameKh ? `(${s.nameKh})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Choose car
                  </label>
                  <select
                    value={selectedVin}
                    onChange={(e) => setSelectedVin(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white font-sans text-xs"
                  >
                    <option value="">--choose car--</option>
                    {vehicles.map((v) => (
                      <option key={v.vin} value={v.vin}>
                        {v.brand} {v.model} | {v.vin} ({v.madeYear})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Item repair, Amount, Payment, Add button */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-2 border-t border-slate-100">
                <div className="sm:col-span-4">
                  <label className="block text-slate-600 font-medium mb-1">
                    Item repair
                  </label>
                  <div className="relative">
                    <Settings className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="item to repair"
                      value={itemRepairText}
                      onChange={(e) => setItemRepairText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTempItem(e);
                        }
                      }}
                      className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-600 font-medium mb-1">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-medium">$</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="total price"
                      value={itemAmount}
                      onChange={(e) => {
                        const val = e.target.value === "" ? "" : Number(e.target.value);
                        setItemAmount(val);
                        // Auto-fill payment if empty or matching previous
                        if (itemPayment === "" || itemPayment === itemAmount) {
                          setItemPayment(val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTempItem(e);
                        }
                      }}
                      className="w-full pl-6 pr-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-600 font-medium mb-1">
                    Payment
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 font-medium">$</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="pay price"
                      value={itemPayment}
                      onChange={(e) => setItemPayment(e.target.value === "" ? "" : Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTempItem(e);
                        }
                      }}
                      className="w-full pl-6 pr-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddTempItem}
                    className="w-full h-[31px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold rounded cursor-pointer transition-colors shadow-2xs text-xs whitespace-nowrap"
                    title="Add item to list"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Row 3: Items Table in Modal */}
              <div className="overflow-x-auto border border-slate-200 rounded min-h-[140px] max-h-64">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafc] text-slate-700 font-semibold border-b border-slate-200 whitespace-nowrap">
                    <tr>
                      <th className="py-2 px-2.5 w-8">#</th>
                      <th className="py-2 px-2.5">Brand Model</th>
                      <th className="py-2 px-2.5">Vin Number</th>
                      <th className="py-2 px-2.5 text-right">Amount</th>
                      <th className="py-2 px-2.5 text-right">Payment</th>
                      <th className="py-2 px-2.5 text-right">Balance</th>
                      <th className="py-2 px-2.5">Repair date</th>
                      <th className="py-2 px-2.5">Supplier</th>
                      <th className="py-2 px-2.5">Items</th>
                      <th className="py-2 px-2.5 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tempItems.length > 0 ? (
                      tempItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-2.5 font-semibold text-slate-800">{idx + 1}</td>
                          <td className="py-2 px-2.5 font-medium">{item.brandModel}</td>
                          <td className="py-2 px-2.5 font-mono text-slate-600">{item.vin}</td>
                          <td className="py-2 px-2.5 text-right font-medium">${item.amount.toFixed(2)}</td>
                          <td className="py-2 px-2.5 text-right font-medium text-emerald-600">${item.payment.toFixed(2)}</td>
                          <td className="py-2 px-2.5 text-right font-medium text-slate-500">${item.balance.toFixed(2)}</td>
                          <td className="py-2 px-2.5 whitespace-nowrap">{item.repairDate}</td>
                          <td className="py-2 px-2.5">{item.supplier}</td>
                          <td className="py-2 px-2.5">{item.itemRepair}</td>
                          <td className="py-2 px-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveTempItem(item.id)}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                              title="Remove item"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400">
                          No repair items added yet. Fill the inputs above and click &quot;+ Add&quot;.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Amount Summary Box (Yellow/Cream background) */}
              <div className="bg-[#fffbeb] border border-[#fef08a] rounded p-2.5 text-right text-xs font-bold text-slate-800">
                Total Amount : ${totalTempAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddRepairModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveCarRepair}
                  disabled={submitting || tempItems.length === 0}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#1c64f2] hover:bg-[#1a56db] rounded cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{submitting ? "Saving..." : "Save"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          4. MODAL: ADDING NEW REPAIR SUPPLIER (Exact Screenshot 3)
      ───────────────────────────────────────────────────────────── */}
      {isAddSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-300 my-auto">
            {/* Dark Blue Header */}
            <div className="bg-[#112d59] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-semibold">Adding new repair supplier</h3>
              <button
                type="button"
                onClick={() => setIsAddSupplierModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRepairSupplier} className="p-4 space-y-3 text-xs overflow-y-auto flex-1">
              {/* Row 1: English name, Khmer name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    English name *
                  </label>
                  <input
                    type="text"
                    placeholder="supplier name in english"
                    value={supNameEn}
                    onChange={(e) => setSupNameEn(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Khmer name
                  </label>
                  <input
                    type="text"
                    placeholder="supplier name in khmer"
                    value={supNameKh}
                    onChange={(e) => setSupNameKh(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                  />
                </div>
              </div>

              {/* Row 2: Email, Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="ex. example@compny.com"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Website
                  </label>
                  <input
                    type="text"
                    placeholder="www.compnyname.com"
                    value={supWebsite}
                    onChange={(e) => setSupWebsite(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                  />
                </div>
              </div>

              {/* Row 3: Country, Phone line 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Country
                  </label>
                  <select
                    value={supCountry}
                    onChange={(e) => setSupCountry(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                  >
                    <option value="">--Select--</option>
                    {countryList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Phone line 1 *
                  </label>
                  <input
                    type="text"
                    placeholder="ex. +85512 546444"
                    value={supPhone1}
                    onChange={(e) => setSupPhone1(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                  />
                </div>
              </div>

              {/* Row 4: Phone line 2, Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Phone line 2
                  </label>
                  <input
                    type="text"
                    placeholder="ex. +85512 546444"
                    value={supPhone2}
                    onChange={(e) => setSupPhone2(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="company address"
                    value={supAddress}
                    onChange={(e) => setSupAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                  />
                </div>
              </div>

              {/* Row 5: Note */}
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Note something"
                  value={supNote}
                  onChange={(e) => setSupNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#1c64f2] hover:bg-[#1a56db] rounded cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{submitting ? "Saving..." : "Save"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          5. MODAL: VIEW CAR REPARED (Exact Screenshot 1)
      ───────────────────────────────────────────────────────────── */}
      {viewingRepairRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-300">
            {/* Dark Blue Header */}
            <div className="bg-[#112d59] text-white px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold">View Car Repared</h3>
              <button
                type="button"
                onClick={() => setViewingRepairRow(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <h4 className="text-sm font-bold text-slate-800">
                Repaired car list
              </h4>

              {/* Filter by supplier's name */}
              <div className="max-w-xs">
                <label className="block text-slate-600 mb-1 font-medium">
                  Filter by supplier&apos;s name
                </label>
                <input
                  type="text"
                  placeholder="supplier's name"
                  value={viewModalSupplierFilter}
                  onChange={(e) => setViewModalSupplierFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-[#1c64f2] bg-white"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafc] text-slate-700 font-semibold border-b border-slate-200 whitespace-nowrap">
                    <tr>
                      <th className="py-2 px-2.5 w-8">#</th>
                      <th className="py-2 px-2.5">Brand Model</th>
                      <th className="py-2 px-2.5">Vin Number</th>
                      <th className="py-2 px-2.5 text-right">Amount</th>
                      <th className="py-2 px-2.5 text-right">Payment</th>
                      <th className="py-2 px-2.5 text-right">Balance</th>
                      <th className="py-2 px-2.5">Repair_Date</th>
                      <th className="py-2 px-2.5">Supplier</th>
                      <th className="py-2 px-2.5">Note</th>
                      <th className="py-2 px-2.5 text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-2 px-2.5 font-semibold text-slate-800">1</td>
                      <td className="py-2 px-2.5 font-medium">{viewingRepairRow.brandModel}</td>
                      <td className="py-2 px-2.5 font-mono text-slate-600">{viewingRepairRow.vin}</td>
                      <td className="py-2 px-2.5 text-right font-medium">${viewingRepairRow.amount.toFixed(2)}</td>
                      <td className="py-2 px-2.5 text-right font-medium text-emerald-600">${viewingRepairRow.payment.toFixed(2)}</td>
                      <td className="py-2 px-2.5 text-right font-medium text-slate-500">${viewingRepairRow.balance.toFixed(2)}</td>
                      <td className="py-2 px-2.5 whitespace-nowrap">{viewingRepairRow.repairDate}</td>
                      <td className="py-2 px-2.5">{viewingRepairRow.supplier}</td>
                      <td className="py-2 px-2.5">{viewingRepairRow.note}</td>
                      <td className="py-2 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const newPay = prompt("Enter new payment amount ($):", String(viewingRepairRow.payment));
                              if (newPay !== null && !isNaN(Number(newPay))) {
                                costService
                                  .updateBill(viewingRepairRow.billId, { paidAmount: Number(newPay) })
                                  .then(() => {
                                    setViewingRepairRow((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            payment: Number(newPay),
                                            balance: Math.max(0, prev.amount - Number(newPay)),
                                          }
                                        : null
                                    );
                                    loadData();
                                  });
                              }
                            }}
                            className="p-1 rounded bg-[#0284c7] text-white hover:bg-[#0369a1] cursor-pointer"
                            title="Edit payment"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRepairRecord(viewingRepairRow)}
                            className="p-1 rounded bg-[#dc2626] text-white hover:bg-[#b91c1c] cursor-pointer"
                            title="Delete repair record"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setViewingRepairRow(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

