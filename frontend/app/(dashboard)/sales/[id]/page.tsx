"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  TableProperties,
  ArrowLeft,
  Printer,
  ShoppingCart,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  Car,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { salesService } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SaleDetailData {
  id: string;
  receiptNo: string;
  soldDate: string;
  soldPrice: number;
  totalLandedCost: number;
  grossProfit: number;
  loanType: string;
  interestRate: number;
  termMonths: number;
  customer: {
    id: string;
    name: string;
    phone: string;
    idCard?: string;
    address?: string;
    gender?: string;
    email?: string;
    dob?: string;
    job?: string;
    note?: string;
  };
  seller: {
    id: string;
    englishName: string;
    khmerName?: string;
    phone: string;
    branch: string;
  } | null;
  vehicle: {
    id: string;
    vin: string;
    brand: string;
    model: string;
    madeYear: number;
    plateNumber?: string;
    color: string;
    interiorColor?: string;
    engineNumber?: string;
    cylinderDisp?: string;
    fuelType: string;
    batteryCapacity?: string;
    branch: string;
    coverImageUrl?: string | null;
    purchaseCost: number;
    inSalePrice?: number | null;
  };
  schedules: {
    id: string;
    installmentNo: number;
    dueDate: string;
    principal: number;
    interest: number;
    totalDue: number;
    paidAmount: number;
    status: string;
    paidDate?: string;
  }[];
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  idCard?: string;
  address?: string;
}

export default function SoldCarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [order, setOrder] = useState<SaleDetailData | null>(null);
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for the 3 update panels
  const [soldPriceInput, setSoldPriceInput] = useState<number>(0);
  const [paidAmountInput, setPaidAmountInput] = useState<number>(0);
  const [noteInput, setNoteInput] = useState<string>("");

  const [soldDateInput, setSoldDateInput] = useState<string>("");

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Submitting states
  const [updatingInfo, setUpdatingInfo] = useState(false);
  const [updatingDate, setUpdatingDate] = useState(false);
  const [updatingCustomer, setUpdatingCustomer] = useState(false);

  // View toggle: 'details' (Legacy CSM 1.0) vs 'invoice' (Printable receipt)
  const [viewMode, setViewMode] = useState<"details" | "invoice">("details");

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [orderRes, optionsRes] = await Promise.all([
        salesService.getById(id) as Promise<SaleDetailData>,
        salesService.getOptions() as Promise<{ customers?: CustomerOption[] }>,
      ]);

      setOrder(orderRes);
      setSoldPriceInput(orderRes.soldPrice || 0);
      setPaidAmountInput(orderRes.soldPrice || 0);
      setSoldDateInput(
        orderRes.soldDate ? orderRes.soldDate.substring(0, 10) : ""
      );
      setSelectedCustomerId(orderRes.customer?.id || "");

      if (optionsRes && optionsRes.customers) {
        setCustomerOptions(optionsRes.customers);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load sold car detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // 1. Update Sold Information
  const handleUpdateSoldInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingInfo(true);
    setSuccessMsg(null);
    try {
      await salesService.update(id, {
        soldPrice: Number(soldPriceInput),
      });
      setSuccessMsg("Successfully updated sold information!");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update sold information");
    } finally {
      setUpdatingInfo(false);
    }
  };

  // 2. Update Sold Date
  const handleUpdateSoldDate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingDate(true);
    setSuccessMsg(null);
    try {
      await salesService.update(id, {
        soldDate: soldDateInput,
      });
      setSuccessMsg("Successfully updated sold date!");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update sold date");
    } finally {
      setUpdatingDate(false);
    }
  };

  // 3. Update Customer
  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    setUpdatingCustomer(true);
    setSuccessMsg(null);
    try {
      await salesService.update(id, {
        customerId: selectedCustomerId,
      });
      setSuccessMsg("Successfully updated customer!");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update customer");
    } finally {
      setUpdatingCustomer(false);
    }
  };

  // 4. Void / Cancel Sale Order (Reverts vehicle to IN_STOCK)
  const [cancellingSale, setCancellingSale] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleCancelSale = async () => {
    setCancellingSale(true);
    setError(null);
    try {
      await salesService.delete(id);
      router.push("/sales?cancelled=true");
    } catch (err: any) {
      setError(err.message || "Failed to cancel sale order");
      setCancellingSale(false);
      setShowCancelDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-[500px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <div className="h-5 w-5 border-2 border-[#337ab7] border-t-transparent rounded-full animate-spin" />
          Loading sold car details...
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="p-6 bg-white space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
        <Link
          href="/sales"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 border rounded text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Sold List
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const totalPaid =
    order.loanType === "FULL_PAYMENT"
      ? order.soldPrice
      : order.schedules?.reduce(
          (sum, s) => sum + (s.status === "PAID" ? s.paidAmount : 0),
          0
        ) || 0;
  const balance = Math.max(0, order.soldPrice - totalPaid);

  return (
    <div className="p-6 bg-white min-h-screen text-[#333333] space-y-5 print:p-0 print:m-0 print:space-y-0 print:min-h-0">
      {/* 1. Breadcrumb Bar */}
      <div className="bg-[#f5f5f5] border border-[#e3e3e3] rounded px-4 py-2.5 flex items-center justify-between text-xs text-[#777777] print:hidden">
        <div className="flex items-center gap-1.5 font-sans">
          <TableProperties className="h-3.5 w-3.5 text-[#337ab7]" />
          <Link href="/" className="text-[#337ab7] hover:underline">
            Dashboard
          </Link>
          <span className="text-[#cccccc]">&gt;</span>
          <Link href="/sales" className="text-[#337ab7] hover:underline">
            Manage sold cars
          </Link>
          <span className="text-[#cccccc]">&gt;</span>
          <span className="text-[#555555]">Car Detail</span>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setViewMode("details")}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded border transition-colors flex items-center gap-1.5",
              viewMode === "details"
                ? "bg-[#337ab7] text-white border-[#2e6da4]"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            )}
          >
            <Car className="h-3.5 w-3.5" /> Details &amp; Edit
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("invoice");
              setTimeout(() => window.print(), 200);
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded border bg-white text-slate-700 border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" /> Print Invoice
          </button>
          <button
            type="button"
            onClick={() => setShowCancelDialog(true)}
            className="px-2.5 py-1 text-xs font-semibold rounded border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
            title="Void this sale order and restore vehicle to IN_STOCK"
          >
            <Trash2 className="h-3.5 w-3.5" /> មោឃភាពការលក់ (Void Sale)
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2 print:hidden">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded flex items-center gap-2 print:hidden">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Top Header & Title Banner (Only in Details mode) */}
      {viewMode === "details" && (
        <div className="flex items-start justify-between border-b pb-4 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-[#333333] tracking-tight">
              {order.vehicle.brand} : {order.vehicle.model}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="inline-flex items-center gap-1 bg-[#d9534f] text-white font-bold px-2.5 py-1 rounded text-xs shadow-sm">
                <ShoppingCart className="h-3.5 w-3.5" /> Sold out: $
                {order.soldPrice.toLocaleString()}
              </span>
              <span className="text-[#777777] font-medium">
                Price: $
                {(
                  order.vehicle.inSalePrice || order.soldPrice
                ).toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                | Balance: ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <Link
            href="/sales"
            className="px-3 py-1.5 text-xs bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 flex items-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to list
          </Link>
        </div>
      )}

      {viewMode === "details" ? (
        <>
          {/* 3. Specs & Customer 2-Column Table */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Vehicle Image */}
            <div className="md:col-span-4 bg-[#f9f9f9] border border-[#e3e3e3] rounded p-2 text-center">
              <div className="relative aspect-[4/3] bg-slate-100 rounded overflow-hidden flex items-center justify-center border border-slate-200">
                {order.vehicle.coverImageUrl ? (
                  <img
                    src={order.vehicle.coverImageUrl}
                    alt={order.vehicle.model}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Car className="h-14 w-14 text-slate-300 mx-auto mb-2" />
                    <span className="text-xs text-slate-400 font-medium">
                      No Vehicle Image
                    </span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-[#d9534f] text-white text-[11px] font-bold px-2 py-0.5 rounded shadow">
                  SOLD OUT
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">
                  {order.vehicle.branch}
                </div>
              </div>
            </div>

            {/* Car Specs Info Table */}
            <div className="md:col-span-4 border border-[#e3e3e3] rounded overflow-hidden bg-white">
              <div className="bg-[#f5f5f5] px-3 py-2 border-b border-[#e3e3e3] font-bold text-xs text-[#333333]">
                Car Specifications
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-[#eeeeee]">
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666] w-1/2">Brand</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">{order.vehicle.brand}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Model</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">{order.vehicle.model}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Year</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">{order.vehicle.madeYear}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Body color</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">{order.vehicle.color}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Inside color</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">{order.vehicle.interiorColor || "N/A"}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Body number</td>
                    <td className="px-3 py-1.5 font-mono text-[#333333] font-semibold">{order.vehicle.vin}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Car Engine</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">{order.vehicle.cylinderDisp || "N/A"}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Engine number</td>
                    <td className="px-3 py-1.5 font-mono text-[#333333]">{order.vehicle.engineNumber || "N/A"}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Steering type</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">Left Hand Drive</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Fuel Type</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">{order.vehicle.fuelType}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Instock</td>
                    <td className="px-3 py-1.5 font-bold text-[#d9534f]">No</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Customer Details Table */}
            <div className="md:col-span-4 border border-[#e3e3e3] rounded overflow-hidden bg-white">
              <div className="bg-[#f5f5f5] px-3 py-2 border-b border-[#e3e3e3] font-bold text-xs text-[#333333]">
                Customer Information
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-[#eeeeee]">
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666] w-1/2">Customer name</td>
                    <td className="px-3 py-1.5 font-bold text-[#337ab7]">{order.customer.name}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Gender</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">{order.customer.gender || "male"}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Email</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">{order.customer.email || "N/A"}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Address</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">{order.customer.address || "Phnom Penh"}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Phone</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">{order.customer.phone}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Id card</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">{order.customer.idCard || "N/A"}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Date of birth</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">
                      {order.customer.dob
                        ? new Date(order.customer.dob).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Receipt No</td>
                    <td className="px-3 py-1.5 font-mono font-semibold text-[#333333]">{order.receiptNo}</td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Payment Type</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">
                      {order.loanType === "FULL_PAYMENT" ? "បង់ផ្តាច់ (Full Payment)" : order.loanType}
                    </td>
                  </tr>
                  <tr className="hover:bg-[#f9f9f9]">
                    <td className="px-3 py-1.5 font-semibold text-[#666666]">Sold Date</td>
                    <td className="px-3 py-1.5 font-medium text-[#333333]">
                      {new Date(order.soldDate).toLocaleDateString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Three Legacy Update Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* Panel 1: Update Sold Information */}
            <div className="border border-[#bce8f1] rounded shadow-sm bg-white overflow-hidden">
              <div className="bg-[#d9edf7] border-b border-[#bce8f1] px-4 py-2.5 text-[#31708f] font-bold text-xs flex items-center justify-between">
                <span>Update Sold Information (បង់ផ្តាច់)</span>
              </div>
              <form onSubmit={handleUpdateSoldInfo} className="p-4 space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Price</label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={`$ ${(
                      order.vehicle.inSalePrice || order.soldPrice
                    ).toLocaleString()}`}
                    className="w-full h-8 px-2 bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Sale price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={soldPriceInput}
                    onChange={(e) => setSoldPriceInput(parseFloat(e.target.value) || 0)}
                    className="w-full h-8 px-2 border border-slate-300 rounded text-xs focus:outline-none focus:border-[#337ab7]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Paid amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(parseFloat(e.target.value) || 0)}
                    className="w-full h-8 px-2 border border-slate-300 rounded text-xs focus:outline-none focus:border-[#337ab7]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Note</label>
                  <textarea
                    rows={3}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="some node about this car was sold"
                    className="w-full p-2 border border-slate-300 rounded text-xs focus:outline-none focus:border-[#337ab7]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updatingInfo}
                    className="px-4 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white font-semibold rounded text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {updatingInfo ? "Updating..." : "Update"}
                  </button>
                </div>
              </form>
            </div>

            {/* Panel 2: Update Sold Date */}
            <div className="border border-[#bce8f1] rounded shadow-sm bg-white overflow-hidden">
              <div className="bg-[#d9edf7] border-b border-[#bce8f1] px-4 py-2.5 text-[#31708f] font-bold text-xs flex items-center justify-between">
                <span>Update Sold Date</span>
              </div>
              <form onSubmit={handleUpdateSoldDate} className="p-4 space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Sale date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={soldDateInput}
                    onChange={(e) => setSoldDateInput(e.target.value)}
                    className="w-full h-8 px-2 border border-slate-300 rounded text-xs focus:outline-none focus:border-[#337ab7]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updatingDate}
                    className="px-4 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white font-semibold rounded text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {updatingDate ? "Updating..." : "Update"}
                  </button>
                </div>
              </form>
            </div>

            {/* Panel 3: Update Customer */}
            <div className="border border-[#bce8f1] rounded shadow-sm bg-white overflow-hidden">
              <div className="bg-[#d9edf7] border-b border-[#bce8f1] px-4 py-2.5 text-[#31708f] font-bold text-xs flex items-center justify-between">
                <span>Update Customer</span>
              </div>
              <form onSubmit={handleUpdateCustomer} className="p-4 space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Customer select <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full h-8 px-2 border border-slate-300 rounded text-xs focus:outline-none focus:border-[#337ab7] bg-white"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customerOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={updatingCustomer || !selectedCustomerId}
                    className="px-4 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white font-semibold rounded text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <User className="h-3.5 w-3.5" />
                    {updatingCustomer ? "Updating..." : "Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      ) : (
        /* Printable Official Invoice View */
        <div className="space-y-4 print:space-y-0">
          <div className="flex items-center justify-between bg-slate-100 border border-slate-200 rounded px-4 py-2.5 text-xs print:hidden">
            <button
              type="button"
              onClick={() => setViewMode("details")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded text-slate-700 font-semibold transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Details &amp; Edit
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white font-semibold rounded shadow-sm transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print Invoice
            </button>
          </div>

          <div className="bg-white border rounded p-8 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 w-full max-w-[850px] mx-auto print:max-w-none">
          <div className="flex justify-between items-start border-b pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded bg-[#163b65] text-white flex items-center justify-center font-bold text-xl">
                  C
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-[#163b65]">
                    CSM AUTO SHOWROOM
                  </h1>
                  <p className="text-xs text-slate-500">
                    Official Luxury EV &amp; Auto Sales | Phnom Penh, Cambodia
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 pt-2">
                Branch: <strong>{order.vehicle.branch}</strong> | Tel: +855 61 95 5555
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block border border-slate-300 px-3 py-1 font-mono text-sm font-bold rounded">
                {order.receiptNo}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Date: <strong>{new Date(order.soldDate).toLocaleDateString()}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Payment: <strong>{order.loanType.replace("_", " ")}</strong>
              </p>
            </div>
          </div>

          {/* Customer & Vehicle Info */}
          <div className="grid grid-cols-2 gap-8 py-6 border-b text-xs">
            <div className="space-y-1.5">
              <div className="font-bold text-slate-400 uppercase tracking-wider">
                Customer Information
              </div>
              <p className="font-bold text-sm text-[#333333]">{order.customer.name}</p>
              <p className="text-slate-600">
                Phone: <strong>{order.customer.phone}</strong>
              </p>
              {order.customer.idCard && (
                <p className="text-slate-600">
                  National ID / Passport: <strong>{order.customer.idCard}</strong>
                </p>
              )}
              {order.customer.address && (
                <p className="text-slate-600">Address: {order.customer.address}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-slate-400 uppercase tracking-wider">
                Vehicle Sold
              </div>
              <p className="font-bold text-sm text-[#333333]">
                {order.vehicle.madeYear} {order.vehicle.brand} {order.vehicle.model}
              </p>
              <p className="font-mono text-slate-600">
                VIN: <strong>{order.vehicle.vin}</strong>
              </p>
              <div className="grid grid-cols-2 gap-1 text-slate-600">
                <div>Color: {order.vehicle.color}</div>
                <div>Fuel: {order.vehicle.fuelType}</div>
                {order.vehicle.plateNumber && (
                  <div>Plate: {order.vehicle.plateNumber}</div>
                )}
                {order.vehicle.engineNumber && (
                  <div>Engine: {order.vehicle.engineNumber}</div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="py-6 border-b">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-slate-500 font-semibold">
                  <th className="text-left pb-2">Item Description</th>
                  <th className="text-left pb-2">Terms</th>
                  <th className="text-right pb-2">Amount (USD)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 font-medium">
                    {order.vehicle.madeYear} {order.vehicle.brand} {order.vehicle.model}
                    <div className="text-[11px] text-slate-400 font-mono">
                      VIN: {order.vehicle.vin}
                    </div>
                  </td>
                  <td className="py-3">
                    {order.loanType === "FULL_PAYMENT"
                      ? "100% Cash / Lump-sum"
                      : `${order.termMonths} Months @ ${order.interestRate}% APR`}
                  </td>
                  <td className="py-3 text-right font-bold text-sm">
                    ${order.soldPrice.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end pt-4">
              <div className="w-64 space-y-2 text-xs border-t pt-2">
                <div className="flex justify-between font-bold text-sm">
                  <span>Total Sold Price:</span>
                  <span>${order.soldPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs">
            <div className="space-y-12">
              <p className="font-semibold text-slate-700">Customer Signature</p>
              <div className="border-b border-dashed border-slate-300" />
              <p className="text-slate-500">{order.customer.name}</p>
            </div>

            <div className="space-y-12">
              <p className="font-semibold text-slate-700">Sales Representative</p>
              <div className="border-b border-dashed border-slate-300" />
              <p className="text-slate-500">
                {order.seller?.khmerName || order.seller?.englishName || "Sales Rep"}
              </p>
            </div>

            <div className="space-y-12">
              <p className="font-semibold text-slate-700">Authorized Showroom Manager</p>
              <div className="border-b border-dashed border-slate-300" />
              <p className="text-slate-500">CSM Auto Management</p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Cancel/Void Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[460px] p-5">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5" />
              តើអ្នកពិតជាចង់មោឃភាពការលក់នេះមែនទេ?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-2">
              ការលុប/មោឃភាពវិក្កយបត្រ <span className="font-bold text-slate-900">{order.receiptNo}</span> នេះ នឹងប្តូរស្ថានភាពរថយន្ត <span className="font-bold text-slate-900">{order.vehicle.brand} {order.vehicle.model} ({order.vehicle.vin})</span> ត្រឡប់មកជា <strong>IN_STOCK</strong> (ក្នុងស្តុក) វិញដោយស្វ័យប្រវត្ត ហើយលុបតារាងបង់រំលស់ទាំងអស់ដែលពាក់ព័ន្ធចេញពីប្រព័ន្ធ។
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <button
              type="button"
              onClick={() => setShowCancelDialog(false)}
              disabled={cancellingSale}
              className="px-3.5 py-1.5 text-xs border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-medium"
            >
              បោះបង់ (Cancel)
            </button>
            <button
              type="button"
              onClick={handleCancelSale}
              disabled={cancellingSale}
              className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded font-medium flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{cancellingSale ? "កំពុងដំណើរការ..." : "យល់ព្រមមោឃភាព (Confirm Void)"}</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

