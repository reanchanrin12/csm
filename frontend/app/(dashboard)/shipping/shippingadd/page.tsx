"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowLeft,
  Ship,
} from "lucide-react";
import {
  costService,
  settingsService,
  vehicleService,
  type LandedCostBillRecord,
} from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface VehicleOption {
  id: string;
  vin: string;
  brand: string;
  model: string;
  madeYear: number;
  color?: string;
  displayName: string;
}

interface SupplierOption {
  id: string;
  nameEn: string;
  nameKh?: string | undefined;
}

interface AddedCarItem {
  carId?: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  tranFee: number;
  containerFee: number;
  laborFee: number;
  total: number;
}

export default function AddNewShippingFeePage() {
  const router = useRouter();

  // Reference data
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form states matching Screenshot media_1794536389119_a7a32b33.png
  const [invoiceNumber, setInvoiceNumber] = useState(
    () => `IN${Math.floor(100000000 + Math.random() * 900000000)}`
  );
  const [shippingDate, setShippingDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [transportCompanyId, setTransportCompanyId] = useState("");

  // Inline "Choose car" + fee inputs row
  const [selectedCarVin, setSelectedCarVin] = useState("");
  const [inputTranFee, setInputTranFee] = useState<number | "">("");
  const [inputContainerFee, setInputContainerFee] = useState<number | "">("");
  const [inputLaborFee, setInputLaborFee] = useState<number | "">("");

  // Added cars list
  const [addedCars, setAddedCars] = useState<AddedCarItem[]>([]);

  // Bottom form fields
  const [paidAmount, setPaidAmount] = useState<number | "">(0);
  const [description, setDescription] = useState("");

  // Submission & feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick-add Logistic Company Modal
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);

  // Load vehicles and suppliers
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true);
        const optionsData = await costService.getOptions();
        const opts = optionsData as {
          suppliers?: SupplierOption[];
          vehicles?: VehicleOption[];
        };
        setVehicles(opts?.vehicles ?? []);
        setSuppliers(opts?.suppliers ?? []);
      } catch (err) {
        console.error("Failed to load initial data for shipping add:", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  // Compute Grand Total of Added Cars
  const grandTotal = useMemo(() => {
    return addedCars.reduce((sum, item) => sum + item.total, 0);
  }, [addedCars]);

  // Compute Balance = Grand Total - Paid Amount
  const balance = useMemo(() => {
    const paid = typeof paidAmount === "number" ? paidAmount : 0;
    return Math.max(0, grandTotal - paid);
  }, [grandTotal, paidAmount]);

  // Handle "+ Add to list" green button
  const handleAddCarToList = () => {
    if (!selectedCarVin) {
      setErrorMessage("Please select a car from the inventory.");
      return;
    }

    const tFee = typeof inputTranFee === "number" ? inputTranFee : 0;
    const cFee = typeof inputContainerFee === "number" ? inputContainerFee : 0;
    const lFee = typeof inputLaborFee === "number" ? inputLaborFee : 0;
    const lineTotal = tFee + cFee + lFee;

    const matchedVehicle = vehicles.find((v) => v.vin === selectedCarVin);
    if (!matchedVehicle) return;

    // Check if already added
    const existingIndex = addedCars.findIndex((c) => c.vin === selectedCarVin);
    if (existingIndex >= 0) {
      setAddedCars((prev) => {
        const next = [...prev];
        const cur = next[existingIndex];
        if (cur) {
          next[existingIndex] = {
            ...cur,
            tranFee: tFee,
            containerFee: cFee,
            laborFee: lFee,
            total: lineTotal,
          };
        }
        return next;
      });
    } else {
      const newItem: AddedCarItem = {
        carId: matchedVehicle.id,
        vin: matchedVehicle.vin,
        brand: matchedVehicle.brand,
        model: matchedVehicle.model,
        year: matchedVehicle.madeYear,
        color: matchedVehicle.color || "Black",
        tranFee: tFee,
        containerFee: cFee,
        laborFee: lFee,
        total: lineTotal,
      };
      setAddedCars((prev) => {
        const next = [...prev, newItem];
        const newTotal = next.reduce((sum, c) => sum + c.total, 0);
        // Automatically default Paid Amount to Grand Total if it was equal to prev total
        setPaidAmount(newTotal);
        return next;
      });
    }

    // Reset row inputs
    setSelectedCarVin("");
    setInputTranFee("");
    setInputContainerFee("");
    setInputLaborFee("");
    setErrorMessage(null);
  };

  // Remove car from list
  const handleRemoveCar = (vin: string) => {
    setAddedCars((prev) => {
      const next = prev.filter((c) => c.vin !== vin);
      const newTotal = next.reduce((sum, c) => sum + c.total, 0);
      setPaidAmount(newTotal);
      return next;
    });
  };

  // Handle Save Now
  const handleSaveNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!invoiceNumber.trim()) {
      setErrorMessage("Invoice Number is required.");
      return;
    }
    if (!transportCompanyId) {
      setErrorMessage("Please select a transport company.");
      return;
    }

    let finalCars = [...addedCars];

    // If user filled row inputs but forgot to click "+ Add to list", auto-add it!
    if (selectedCarVin) {
      const tFee = typeof inputTranFee === "number" ? inputTranFee : 0;
      const cFee = typeof inputContainerFee === "number" ? inputContainerFee : 0;
      const lFee = typeof inputLaborFee === "number" ? inputLaborFee : 0;
      if (tFee > 0 || cFee > 0 || lFee > 0) {
        const matched = vehicles.find((v) => v.vin === selectedCarVin);
        if (matched && !finalCars.some((c) => c.vin === selectedCarVin)) {
          finalCars.push({
            carId: matched.id,
            vin: matched.vin,
            brand: matched.brand,
            model: matched.model,
            year: matched.madeYear,
            color: matched.color || "Black",
            tranFee: tFee,
            containerFee: cFee,
            laborFee: lFee,
            total: tFee + cFee + lFee,
          });
        }
      }
    }

    if (finalCars.length === 0) {
      setErrorMessage("Please select a car and fees, then click '+ Add to list' before saving.");
      return;
    }

    const calculatedTotal = finalCars.reduce((s, c) => s + c.total, 0);

    setSubmitting(true);
    try {
      // Build allocations
      const allocations: { vin: string; amount: number; costType?: any; note?: string }[] = [];
      for (const car of finalCars) {
        if (car.tranFee > 0) {
          allocations.push({
            vin: car.vin,
            amount: car.tranFee,
            costType: "TRANSPORT",
            note: `Transport fee for ${car.brand} ${car.model} (${car.vin})`,
          });
        }
        if (car.containerFee > 0) {
          allocations.push({
            vin: car.vin,
            amount: car.containerFee,
            costType: "CONTAINER",
            note: `Container fee for ${car.brand} ${car.model} (${car.vin})`,
          });
        }
        if (car.laborFee > 0) {
          allocations.push({
            vin: car.vin,
            amount: car.laborFee,
            costType: "LABOR",
            note: `Labor fee for ${car.brand} ${car.model} (${car.vin})`,
          });
        }
      }

      const dto = {
        billNumber: invoiceNumber.trim(),
        supplierId: transportCompanyId,
        category: "LOGISTICS",
        type: "shipping" as const,
        billDate: new Date(shippingDate).toISOString(),
        paidAmount: typeof paidAmount === "number" ? paidAmount : 0,
        currency: "USD",
        notes: description.trim() || undefined,
        items: [
          {
            description: `Shipping bill ${invoiceNumber.trim()} (${finalCars.length} vehicles)`,
            amount: calculatedTotal,
            quantity: 1,
            unitPrice: calculatedTotal,
          },
        ],
        allocations,
      };

      await costService.createBill(dto as any);
      setSuccessMessage("Shipping fee invoice saved successfully!");
      setTimeout(() => {
        router.push("/shipping");
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save shipping fee bill."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Quick create company
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setSavingCompany(true);
    try {
      const created = (await settingsService.createSupplier({
        nameEn: newCompanyName.trim(),
        category: "LOGISTICS",
      })) as { id: string; nameEn: string; nameKh?: string };
      setSuppliers((prev) => [
        ...prev,
        { id: created.id, nameEn: created.nameEn, nameKh: created.nameKh },
      ]);
      setTransportCompanyId(created.id);
      setIsCompanyModalOpen(false);
      setNewCompanyName("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create company");
    } finally {
      setSavingCompany(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link
          href="/shipping"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Shipping info</span>
        </Link>
      </div>

      {/* Main Card (Matching Screenshot media_1794536389119_a7a32b33.png) */}
      <div className="bg-white rounded-[2px] border border-[#e4e7ed] p-6 shadow-xs space-y-6">
        {/* Header: Title Left, Invoice Number Right */}
        <div className="flex flex-wrap items-end justify-between gap-4 pb-2 border-b border-slate-100">
          <h1 className="text-[20px] font-bold text-[#2c3e50] tracking-tight">
            Add new shipping fee
          </h1>

          {/* Invoice Number Input on Top Right */}
          <div className="flex flex-col items-start sm:items-end space-y-1">
            <label className="text-[12px] font-medium text-slate-700">
              Invoice Number
            </label>
            <input
              type="text"
              required
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="IN392841533"
              className="w-64 sm:w-72 h-[32px] px-2.5 text-xs font-mono border border-[#dcdfe6] rounded-[2px] bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
            />
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-[2px] bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-[2px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage} Redirecting to shipping list...</span>
          </div>
        )}

        <form onSubmit={handleSaveNow} className="space-y-6">
          {/* Row 1: Shipping date | Transport company */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
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
                  <option value="">--Select--</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameEn} {s.nameKh ? `(${s.nameKh})` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(true)}
                  title="Add new logistic company"
                  className="h-[32px] px-2.5 bg-[#409eff] hover:bg-[#337ecc] text-white rounded-[2px] cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Choose car | Transport fee | Container fee | Labor fee | + Add to list */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs">
            {/* Choose car */}
            <div className="sm:col-span-4 space-y-1">
              <label className="text-[12px] font-medium text-slate-700">
                Choose car
              </label>
              <select
                value={selectedCarVin}
                onChange={(e) => setSelectedCarVin(e.target.value)}
                className="w-full h-[32px] px-2 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
              >
                <option value="">choose car</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.vin}>
                    {v.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Transport fee */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[12px] font-medium text-slate-700">
                Transport fee
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="clearance fee"
                value={inputTranFee}
                onChange={(e) =>
                  setInputTranFee(
                    e.target.value === "" ? "" : parseFloat(e.target.value)
                  )
                }
                className="w-full h-[32px] px-2.5 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 font-mono focus:outline-none focus:border-[#409eff]"
              />
            </div>

            {/* Container fee */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[12px] font-medium text-slate-700">
                Container fee
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="clearance fee"
                value={inputContainerFee}
                onChange={(e) =>
                  setInputContainerFee(
                    e.target.value === "" ? "" : parseFloat(e.target.value)
                  )
                }
                className="w-full h-[32px] px-2.5 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 font-mono focus:outline-none focus:border-[#409eff]"
              />
            </div>

            {/* Labor fee */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[12px] font-medium text-slate-700">
                Labor fee
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="$ tax payment"
                value={inputLaborFee}
                onChange={(e) =>
                  setInputLaborFee(
                    e.target.value === "" ? "" : parseFloat(e.target.value)
                  )
                }
                className="w-full h-[32px] px-2.5 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 font-mono focus:outline-none focus:border-[#409eff]"
              />
            </div>

            {/* Green button: + Add to list */}
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={handleAddCarToList}
                className="w-full h-[32px] bg-[#13ce66] hover:bg-[#10b981] text-white text-xs font-semibold rounded-[2px] cursor-pointer flex items-center justify-center gap-1 shadow-2xs transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add to list</span>
              </button>
            </div>
          </div>

          {/* Car list Header with Total on Right */}
          <div className="pt-2">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-[14px] font-bold text-slate-800">
                Car list
              </h2>
              <div className="text-[14px] font-bold text-slate-800">
                Total: $
                {grandTotal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            {/* Car list Table */}
            <div className="border border-[#e4e7ed] rounded-[2px] overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f5f7fa] text-slate-700 font-semibold border-b border-[#e4e7ed]">
                    <th className="p-2.5 w-10 text-center">#</th>
                    <th className="p-2.5">Brand</th>
                    <th className="p-2.5">Model</th>
                    <th className="p-2.5">Vin</th>
                    <th className="p-2.5">Year</th>
                    <th className="p-2.5">Color</th>
                    <th className="p-2.5 text-right">Tran fee</th>
                    <th className="p-2.5 text-right">Container fee</th>
                    <th className="p-2.5 text-right">Labor fee</th>
                    <th className="p-2.5 text-right">Total</th>
                    <th className="p-2.5 w-14 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {addedCars.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="p-6 text-center text-slate-400 text-xs italic"
                      >
                        No cars added yet. Choose a car above and click &quot;+ Add to list&quot;.
                      </td>
                    </tr>
                  ) : (
                    addedCars.map((car, idx) => (
                      <tr
                        key={car.vin}
                        className="border-b border-[#e4e7ed] hover:bg-slate-50/50"
                      >
                        <td className="p-2.5 text-center text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 font-medium text-slate-800">
                          {car.brand}
                        </td>
                        <td className="p-2.5 text-slate-700">{car.model}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-800">
                          {car.vin}
                        </td>
                        <td className="p-2.5 text-slate-700">{car.year}</td>
                        <td className="p-2.5 text-slate-700">{car.color}</td>
                        <td className="p-2.5 text-right font-mono text-slate-700">
                          $ {car.tranFee.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-700">
                          $ {car.containerFee.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-700">
                          $ {car.laborFee.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                          $ {car.total.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveCar(car.vin)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                            title="Remove"
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

          {/* Paid Amount & Balance */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-slate-700">
                Paid Amount
              </label>
              <div className="relative max-w-sm">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paidAmount}
                  onChange={(e) =>
                    setPaidAmount(
                      e.target.value === "" ? "" : parseFloat(e.target.value)
                    )
                  }
                  className="w-full h-[32px] pl-6 pr-2.5 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 font-mono focus:outline-none focus:border-[#409eff]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-medium text-slate-700">
                Balance
              </label>
              <div className="relative max-w-sm">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                  $
                </span>
                <input
                  type="text"
                  readOnly
                  value={balance.toFixed(2)}
                  className="w-full h-[32px] pl-6 pr-2.5 border border-[#dcdfe6] rounded-[2px] text-xs bg-slate-50 text-slate-600 font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-medium text-slate-700">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="other description"
                className="w-full p-2.5 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
              />
            </div>
          </div>

          {/* Save Now Button (Bottom Left, Exact Screenshot) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="h-[34px] px-6 bg-[#409eff] hover:bg-[#337ecc] text-white rounded-[2px] text-xs font-semibold cursor-pointer shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{submitting ? "Saving..." : "Save Now"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Add Logistic Company Modal */}
      <Dialog open={isCompanyModalOpen} onOpenChange={setIsCompanyModalOpen}>
        <DialogContent className="sm:max-w-[420px] max-w-[95vw] w-full p-0 overflow-hidden rounded-[4px] border border-slate-200 shadow-2xl">
          <div className="bg-[#102a4e] text-white px-5 py-3 flex items-center justify-between">
            <DialogTitle className="text-[14px] font-semibold tracking-wide text-white">
              Adding new logistic company
            </DialogTitle>
            <button
              type="button"
              onClick={() => setIsCompanyModalOpen(false)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleCreateCompany} className="p-5 space-y-4 bg-white text-xs">
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-slate-700">
                Company Name (English)
              </label>
              <input
                type="text"
                required
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="e.g. GUANGZHOU ZHONGHUI TRANS CO., LTD"
                className="w-full h-[32px] px-2.5 border border-[#dcdfe6] rounded-[2px] text-xs bg-white text-slate-800 focus:outline-none focus:border-[#409eff]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCompanyModalOpen(false)}
                className="h-[30px] px-3.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-[2px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingCompany}
                className="h-[30px] px-4 bg-[#409eff] hover:bg-[#337ecc] text-white text-xs font-semibold rounded-[2px] cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {savingCompany ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
