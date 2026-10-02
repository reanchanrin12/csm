"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TableProperties,
  Car,
  ShoppingCart,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Tag,
  UserPlus,
  X,
  Save,
  RotateCcw,
  FileText,
} from "lucide-react";
import { salesService, customerService } from "@/lib/api";
import { cn } from "@/lib/utils";

interface VehicleOption {
  id: string;
  vin: string;
  displayName: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  interiorColor?: string;
  engineNumber?: string;
  cylinderDisp?: string;
  fuelType?: string;
  bodyStyle?: string;
  note?: string;
  coverImageUrl?: string | null;
  branch: string;
  purchaseCost: number;
  totalLandedCost: number;
  inSalePrice: number | null;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  idCard?: string;
  address?: string;
}

export default function StoreListPage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters matching Screenshot 1
  const [brandFilter, setBrandFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [vinFilter, setVinFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  // Selected vehicle for checkout (Screenshot 2 view)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);

  // 4 Payment Tabs in Screenshot 2
  type PaymentTab = "cash" | "loan" | "lease" | "tradein";
  const [activeTab, setActiveTab] = useState<PaymentTab>("cash");

  // Form Fields under Tab 1 ($ បង់ផ្តាច់)
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [paidAmount, setPaidAmount] = useState<number | "">("");
  const [returnMoneyDate, setReturnMoneyDate] = useState(new Date().toISOString().slice(0, 10));
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [paymentNotice, setPaymentNotice] = useState("");

  // Tab 2 ($ គិតតាមការប្រាក់), Tab 3 ($ ជួលរថយន្តវែងឆ្ងាយ), Tab 4 ($ ប្តូរឡានចាស់)
  const [bookPrice, setBookPrice] = useState<number | "">("");
  const [term, setTerm] = useState<number | "">("");
  const [termType, setTermType] = useState<string>("");
  const [intervalVal, setIntervalVal] = useState<number>(1);
  const [interestRate, setInterestRate] = useState<number | "">("");

  // Quick Customer Create Modal (1:1 with Screenshot)
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [custEnglishName, setCustEnglishName] = useState("");
  const [custKhmerName, setCustKhmerName] = useState("");
  const [custDob, setCustDob] = useState("");
  const [custJob, setCustJob] = useState("");
  const [custGender, setCustGender] = useState("Male");
  const [custAddress, setCustAddress] = useState("");
  const [custIdCard, setCustIdCard] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custNote, setCustNote] = useState("");
  const [custIdCardImage, setCustIdCardImage] = useState<string | null>(null);
  const [creatingCust, setCreatingCust] = useState(false);
  const custFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Submission Status
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const data = (await salesService.getOptions()) as {
        vehicles: VehicleOption[];
        customers: CustomerOption[];
      };
      setVehicles(data.vehicles || []);
      setCustomers(data.customers || []);
      if (data.customers?.length && !selectedCustomerId) {
        setSelectedCustomerId(data.customers[0]?.id ?? "");
      }
    } catch (err: unknown) {
      console.error("Failed to load store inventory", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (brandFilter && !v.brand.toLowerCase().includes(brandFilter.toLowerCase())) return false;
      if (modelFilter && !v.model.toLowerCase().includes(modelFilter.toLowerCase())) return false;
      if (vinFilter && !v.vin.toLowerCase().includes(vinFilter.toLowerCase())) return false;
      if (yearFilter && !String(v.year).includes(yearFilter)) return false;
      if (colorFilter && !v.color.toLowerCase().includes(colorFilter.toLowerCase())) return false;
      if (branchFilter !== "all" && !v.branch.toLowerCase().includes(branchFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [vehicles, brandFilter, modelFilter, vinFilter, yearFilter, colorFilter, branchFilter]);

  // When a user selects a car to sell (opens Screenshot 2 view)
  const handleSelectCarToSell = (v: VehicleOption) => {
    setSelectedVehicle(v);
    const price = v.inSalePrice || Math.round(v.totalLandedCost * 1.15) || 108000;
    setSalePrice(price);
    setPaidAmount(price);
    setBookPrice(price);
    setTerm(24);
    setTermType("Month");
    setIntervalVal(1);
    setInterestRate(8);
    setPaymentNotice("");
    setSubmitError(null);
    setSubmitSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCustImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustIdCardImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick Add Customer Handler (Screenshot 1:1)
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = custEnglishName.trim() || custKhmerName.trim();
    if (!finalName) {
      setSubmitError("សូមបញ្ចូលឈ្មោះអតិថិជន (Please enter English name or Khmer name).");
      return;
    }
    if (!custPhone.trim()) {
      setSubmitError("សូមបញ្ចូលលេខទូរស័ព្ទ (Please enter contactable phone number).");
      return;
    }
    setCreatingCust(true);
    try {
      const displayName =
        custEnglishName.trim() && custKhmerName.trim()
          ? `${custEnglishName.trim()} (${custKhmerName.trim()})`
          : custEnglishName.trim() || custKhmerName.trim();

      const created = (await customerService.create({
        name: displayName,
        phone: custPhone.trim(),
        gender: custGender,
        dob: custDob || undefined,
        idCard: custIdCard.trim() || undefined,
        address: custAddress.trim() || undefined,
        job: custJob.trim() || undefined,
        email: custEmail.trim() || undefined,
        note: custNote.trim() || undefined,
      })) as CustomerOption;

      setCustomers((prev) => [created, ...prev]);
      setSelectedCustomerId(created.id);

      // Reset
      setCustEnglishName("");
      setCustKhmerName("");
      setCustDob("");
      setCustJob("");
      setCustGender("Male");
      setCustAddress("");
      setCustIdCard("");
      setCustPhone("");
      setCustEmail("");
      setCustNote("");
      setCustIdCardImage(null);
      setShowAddCustomerModal(false);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setCreatingCust(false);
    }
  };

  // Confirm Sale Handler
  const handleConfirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    if (!selectedCustomerId) {
      setSubmitError("សូមជ្រើសរើសអតិថិជន (Please select a customer).");
      return;
    }
    if (!salePrice || Number(salePrice) <= 0) {
      setSubmitError("សូមបញ្ចូលតម្លៃលក់ជាក់ស្តែង (Please enter a valid sale price).");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      let mappedLoanType: "FULL_PAYMENT" | "INSTALLMENT_FLAT" | "INSTALLMENT_DECLINING" | "BANK_LOAN" = "FULL_PAYMENT";
      if (activeTab === "loan") mappedLoanType = "INSTALLMENT_FLAT";

      const res = (await salesService.create({
        vehicleId: selectedVehicle.id,
        customerId: selectedCustomerId,
        soldPrice: Number(salePrice),
        paidAmount: paidAmount !== "" ? Number(paidAmount) : undefined,
        bookPrice: bookPrice !== "" ? Number(bookPrice) : undefined,
        returnMoneyDate: returnMoneyDate || undefined,
        paymentNotice: paymentNotice || undefined,
        soldDate: saleDate || undefined,
        loanType: mappedLoanType,
        interestRate: activeTab === "loan" && interestRate ? Number(interestRate) : undefined,
        termMonths: activeTab === "loan" && term ? Number(term) : undefined,
      })) as { id: string; receiptNo?: string };

      setSubmitSuccess(
        `ការលក់បានជោគជ័យ! លេខវិក្កយបត្រ: ${res.receiptNo || "REC-SUCCESS"}`
      );

      // Refresh store inventory so sold car disappears
      await fetchOptions();

      // Navigate to Sales list after 1.5s
      setTimeout(() => {
        router.push("/sales");
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to process sale. Please check inputs and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW 2: CAR DETAIL & 4 PAYMENT TABS (1:1 with user's CSM 1.0 screenshot)
  // ───────────────────────────────────────────────────────────────────────────
  if (selectedVehicle) {
    const targetPrice = selectedVehicle.inSalePrice || Math.round(selectedVehicle.totalLandedCost * 1.15) || 108000;

    return (
      <div className="w-full bg-white font-sans pb-16 space-y-3">
        {/* 1. Breadcrumb bar matching Screenshot 2 */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-[#f5f5f5] border border-[#e3e3e3] rounded text-[13px] text-[#777]">
          <TableProperties className="h-4 w-4 text-[#337ab7]" />
          <Link href="/" className="text-[#337ab7] hover:underline font-normal">
            Dashboard
          </Link>
          <span className="text-[#ccc]">&gt;</span>
          <button
            type="button"
            onClick={() => setSelectedVehicle(null)}
            className="text-[#337ab7] hover:underline font-normal cursor-pointer"
          >
            Car list
          </button>
          <span className="text-[#ccc]">&gt;</span>
          <span className="text-[#777]">Car Detail</span>
        </div>

        {/* 2. Top Section: Left Car Photo + Badges, Right Specifications Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Left Column: Direct Image with Badges (No extra outer card padding) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="w-full aspect-[4/3] border border-[#ddd] bg-[#f9f9f9] overflow-hidden flex items-center justify-center">
              {selectedVehicle.coverImageUrl ? (
                <img
                  src={selectedVehicle.coverImageUrl}
                  alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <Car className="h-12 w-12 mb-2 opacity-50" />
                  <span className="text-[12px]">No cover image</span>
                </div>
              )}
            </div>

            {/* Badges matching Screenshot 2 */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 text-[11px] font-bold text-white bg-[#f0ad4e] uppercase">
                From CHINA
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold text-white bg-[#d9534f] uppercase">
                In stock at {selectedVehicle.branch.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Right Column: Title + Price Tag + Striped Specifications Table */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Header: Brand Model (Left) and Red Price Tag (Right) */}
            <div className="flex items-center justify-between pb-2 mb-1">
              <h1 className="text-[15px] font-bold text-[#333] tracking-tight uppercase">
                {selectedVehicle.brand} {selectedVehicle.model}
              </h1>

              <div className="flex items-center gap-1 text-[#d9534f] font-bold text-[15px]">
                <Tag className="h-4 w-4 fill-current" />
                <span>${Number(targetPrice).toLocaleString("en-US")}</span>
              </div>
            </div>

            {/* Striped Table matching Screenshot 2 */}
            <div className="border border-[#e7eaec] overflow-hidden">
              <table className="w-full text-left text-[12px]">
                <tbody>
                  <tr className="border-b border-[#e7eaec] bg-white">
                    <td className="py-1.5 px-3 font-bold text-[#333] w-36">Brand:</td>
                    <td className="py-1.5 px-3 text-[#555] uppercase">{selectedVehicle.brand}</td>
                  </tr>
                  <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                    <td className="py-1.5 px-3 font-bold text-[#333]">Model:</td>
                    <td className="py-1.5 px-3 text-[#555] uppercase">{selectedVehicle.model}</td>
                  </tr>
                  <tr className="border-b border-[#e7eaec] bg-white">
                    <td className="py-1.5 px-3 font-bold text-[#333]">Year:</td>
                    <td className="py-1.5 px-3 text-[#555]">{selectedVehicle.year}</td>
                  </tr>
                  <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                    <td className="py-1.5 px-3 font-bold text-[#333]">Body color:</td>
                    <td className="py-1.5 px-3 text-[#555] uppercase">{selectedVehicle.color}</td>
                  </tr>
                  <tr className="border-b border-[#e7eaec] bg-white">
                    <td className="py-1.5 px-3 font-bold text-[#333]">Inside color:</td>
                    <td className="py-1.5 px-3 text-[#555] uppercase">{selectedVehicle.interiorColor || "RED"}</td>
                  </tr>
                  <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                    <td className="py-1.5 px-3 font-bold text-[#333]">Body number:</td>
                    <td className="py-1.5 px-3 text-[#555] font-mono uppercase">{selectedVehicle.vin}</td>
                  </tr>
                  <tr className="border-b border-[#e7eaec] bg-white">
                    <td className="py-1.5 px-3 font-bold text-[#333]">Car Engine:</td>
                    <td className="py-1.5 px-3 text-[#555] font-mono">{selectedVehicle.engineNumber || "TO968032"}</td>
                  </tr>
                  <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                    <td className="py-1.5 px-3 font-bold text-[#333]">Engine number:</td>
                    <td className="py-1.5 px-3 text-[#555]">{selectedVehicle.cylinderDisp || "1497CC"}</td>
                  </tr>
                  <tr className="border-b border-[#e7eaec] bg-white">
                    <td className="py-1.5 px-3 font-bold text-[#333]">Steering type:</td>
                    <td className="py-1.5 px-3 text-[#555]">left hand</td>
                  </tr>
                  <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                    <td className="py-1.5 px-3 font-bold text-[#333]">Fuel Type:</td>
                    <td className="py-1.5 px-3 text-[#555]">{selectedVehicle.fuelType || "PHEV"}</td>
                  </tr>
                  <tr className="border-b border-[#e7eaec] bg-white">
                    <td className="py-1.5 px-3 font-bold text-[#333]">Body Style:</td>
                    <td className="py-1.5 px-3 text-[#555]">{selectedVehicle.bodyStyle || "Luxury Car"}</td>
                  </tr>
                  <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                    <td className="py-1.5 px-3 font-bold text-[#333]">Note:</td>
                    <td className="py-1.5 px-3 text-[#555]">{selectedVehicle.note || ""}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-1.5 px-3 font-bold text-[#333]">Instock:</td>
                    <td className="py-1.5 px-3 text-[#333]">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3. Bottom Section: Clean Border Box with 4 Tabs matching Screenshot 2 */}
        <div className="border border-[#e7eaec] bg-white rounded-xs mt-4">
          {/* Tab Headers */}
          <div className="flex border-b border-[#e7eaec] bg-white px-3 py-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("cash")}
              className={cn(
                "px-3.5 py-1 text-[13px] font-medium rounded-xs transition-colors cursor-pointer",
                activeTab === "cash"
                  ? "bg-[#337ab7] text-white"
                  : "text-[#337ab7] hover:bg-slate-100"
              )}
            >
              $ បង់ផ្តាច់
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("loan")}
              className={cn(
                "px-3.5 py-1 text-[13px] font-medium rounded-xs transition-colors cursor-pointer",
                activeTab === "loan"
                  ? "bg-[#337ab7] text-white"
                  : "text-[#337ab7] hover:bg-slate-100"
              )}
            >
              $ គិតតាមការប្រាក់
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("lease")}
              className={cn(
                "px-3.5 py-1 text-[13px] font-medium rounded-xs transition-colors cursor-pointer",
                activeTab === "lease"
                  ? "bg-[#337ab7] text-white"
                  : "text-[#337ab7] hover:bg-slate-100"
              )}
            >
              $ ជួលរថយន្តវែងឆ្ងាយ
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tradein")}
              className={cn(
                "px-3.5 py-1 text-[13px] font-medium rounded-xs transition-colors cursor-pointer",
                activeTab === "tradein"
                  ? "bg-[#337ab7] text-white"
                  : "text-[#337ab7] hover:bg-slate-100"
              )}
            >
              $ ប្តូរឡានចាស់
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleConfirmSale} className="p-5 space-y-4 bg-white">
            {/* Price Heading matching Screenshot 2 */}
            <div className="text-[14px] font-bold text-[#b91c1c]">
              Price : $ {Number(targetPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>

            {submitError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div className="p-2.5 bg-green-50 border border-green-200 text-green-700 rounded text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {/* TAB 1: $ បង់ផ្តាច់ */}
            {activeTab === "cash" && (
              <div className="space-y-3">
                {/* Row 1: Sale price (Left) + Return money (Right) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Sale price
                    </label>
                    <input
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="$"
                      className="w-full h-8 px-3 text-[13px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Return money
                    </label>
                    <input
                      type="date"
                      value={returnMoneyDate}
                      onChange={(e) => setReturnMoneyDate(e.target.value)}
                      className="w-full h-8 px-3 text-[13px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Row 2: Paid amount (Left) + Customer select (Right with UserPlus button) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Paid amount
                    </label>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="$"
                      className="w-full h-8 px-3 text-[13px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Customer select
                    </label>
                    <div className="flex">
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="flex-1 h-8 px-3 text-[13px] border border-[#ccc] rounded-l-xs focus:border-[#337ab7] focus:outline-none bg-white"
                      >
                        <option value="">-- Select --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ""}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => setShowAddCustomerModal(true)}
                        className="h-8 px-3 bg-[#337ab7] hover:bg-[#286090] text-white rounded-r-xs flex items-center justify-center cursor-pointer transition-colors"
                        title="Add Customer"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 3: Sale date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Sale date
                    </label>
                    <input
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full h-8 px-3 text-[13px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none bg-white"
                    />
                  </div>
                  <div></div>
                </div>

                {/* Row 4: Note */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Note
                    </label>
                    <textarea
                      rows={3}
                      value={paymentNotice}
                      onChange={(e) => setPaymentNotice(e.target.value)}
                      placeholder="payment notice"
                      className="w-full p-2.5 text-[13px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none"
                    />
                  </div>
                  <div></div>
                </div>

                {/* Submit Button for Tab 1 */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white text-[12px] font-medium rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{submitting ? "Processing..." : "Sale now"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: $ គិតតាមការប្រាក់ (Matching Screenshot 1) */}
            {activeTab === "loan" && (
              <div className="space-y-3">
                {/* Row 1: Sale price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[12px] font-bold text-[#1c3d73]">
                        តម្លៃលក់សរុប (Full Vehicle Sale Price) *
                      </label>
                      <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        មិនមែនប្រាក់បង់ប្រចាំខែទេ
                      </span>
                    </div>
                    <input
                      type="number"
                      placeholder="ឧ. $135,000"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999] font-semibold"
                    />
                    {salePrice !== "" && Number(salePrice) < selectedVehicle.totalLandedCost * 0.5 && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">
                        ⚠️ តម្លៃលក់ (${Number(salePrice).toLocaleString()}) ទាបជាងថ្លៃដើម (${Number(selectedVehicle.totalLandedCost).toLocaleString()}) ខ្លាំងណាស់! សូមកុំវាយប្រាក់បង់រំលស់ប្រចាំខែចូលកន្លែងនេះ។
                      </p>
                    )}
                  </div>
                  <div></div>
                </div>

                {/* Row 2: Book Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Book Price
                    </label>
                    <input
                      type="text"
                      placeholder="book"
                      value={bookPrice}
                      onChange={(e) => setBookPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                    />
                  </div>
                  <div></div>
                </div>

                {/* Section Header: Loan in : $108,000.00 */}
                <div className="text-[13px] font-bold text-[#b91c1c] pt-2">
                  Loan in : ${Number(salePrice || targetPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>

                {/* Row 3: Term | Term type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Term
                    </label>
                    <input
                      type="text"
                      placeholder="term"
                      value={term}
                      onChange={(e) => setTerm(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Term type
                    </label>
                    <select
                      value={termType}
                      onChange={(e) => setTermType(e.target.value)}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none bg-white"
                    >
                      <option value="">--Select--</option>
                      <option value="Month">Month</option>
                      <option value="Year">Year</option>
                      <option value="Day">Day</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Interval | Rate % */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Interval
                    </label>
                    <select
                      value={intervalVal}
                      onChange={(e) => setIntervalVal(Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none bg-white"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={6}>6</option>
                      <option value={12}>12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Rate %
                    </label>
                    <input
                      type="text"
                      placeholder="rate (%)"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                    />
                  </div>
                </div>

                {/* Row 5: Sale date | Customer select */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Sale date
                    </label>
                    <input
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Customer select
                    </label>
                    <div className="flex">
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="flex-1 h-8 px-2.5 text-[12px] border border-[#ccc] rounded-l-xs focus:border-[#337ab7] focus:outline-none bg-white"
                      >
                        <option value="">--Select--</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomerModal(true)}
                        className="h-8 px-2.5 bg-[#337ab7] hover:bg-[#286090] text-white rounded-r-xs flex items-center justify-center cursor-pointer transition-colors"
                        title="Add Customer"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Buttons: Preview (red on left) and Sale now (blue on right) matching Screenshot 1 */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => alert(`Preview loan schedule for $${salePrice || targetPrice}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#d9534f] hover:bg-[#c9302c] text-white text-[12px] font-normal rounded-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white text-[12px] font-normal rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{submitting ? "Processing..." : "Sale now"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: $ ជួលរថយន្តវែងឆ្ងាយ (Matching Screenshot 2) */}
            {activeTab === "lease" && (
              <div className="space-y-3">
                {/* Row 1: Sale price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Sale price
                    </label>
                    <input
                      type="number"
                      placeholder="$"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                    />
                  </div>
                  <div></div>
                </div>

                {/* Row 2: Book Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Book Price
                    </label>
                    <input
                      type="text"
                      placeholder="book"
                      value={bookPrice}
                      onChange={(e) => setBookPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                    />
                  </div>
                  <div></div>
                </div>

                {/* Section Header: Loan in : $108,000.00 */}
                <div className="text-[13px] font-bold text-[#b91c1c] pt-2">
                  Loan in : ${Number(salePrice || targetPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>

                {/* Row 3: Term | Term type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Term
                    </label>
                    <input
                      type="text"
                      placeholder="term"
                      value={term}
                      onChange={(e) => setTerm(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Term type
                    </label>
                    <select
                      value={termType}
                      onChange={(e) => setTermType(e.target.value)}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none bg-white"
                    >
                      <option value="">--Select--</option>
                      <option value="Month">Month</option>
                      <option value="Year">Year</option>
                      <option value="Day">Day</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Interval | Rate % */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Interval
                    </label>
                    <select
                      value={intervalVal}
                      onChange={(e) => setIntervalVal(Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none bg-white"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={6}>6</option>
                      <option value={12}>12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Rate %
                    </label>
                    <input
                      type="text"
                      placeholder="rate (%)"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                    />
                  </div>
                </div>

                {/* Row 5: Sale date | Customer select */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Sale date
                    </label>
                    <input
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Customer select
                    </label>
                    <div className="flex">
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="flex-1 h-8 px-2.5 text-[12px] border border-[#ccc] rounded-l-xs focus:border-[#337ab7] focus:outline-none bg-white"
                      >
                        <option value="">--Select--</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomerModal(true)}
                        className="h-8 px-2.5 bg-[#337ab7] hover:bg-[#286090] text-white rounded-r-xs flex items-center justify-center cursor-pointer transition-colors"
                        title="Add Customer"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Buttons: Preview (red on left) and Sale now (blue on right) matching Screenshot 2 */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => alert(`Preview rental schedule for $${salePrice || targetPrice}`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#d9534f] hover:bg-[#c9302c] text-white text-[12px] font-normal rounded-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white text-[12px] font-normal rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{submitting ? "Processing..." : "Sale now"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: $ ប្តូរឡានចាស់ (Matching Screenshot 3) */}
            {activeTab === "tradein" && (
              <div className="space-y-3">
                {/* Row 1: Sale price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Sale price
                    </label>
                    <input
                      type="number"
                      placeholder="$"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                    />
                  </div>
                  <div></div>
                </div>

                {/* Section Header: Loan in : $108,000.00 */}
                <div className="text-[13px] font-bold text-[#b91c1c] pt-2">
                  Loan in : ${Number(salePrice || targetPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>

                {/* Row 2: Book Price | (Empty right col) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Book Price
                    </label>
                    <input
                      type="text"
                      placeholder="book"
                      value={bookPrice}
                      onChange={(e) => setBookPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                    />
                  </div>
                  <div></div>
                </div>

                {/* Row 3: Rate % | Sale date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Rate %
                    </label>
                    <input
                      type="text"
                      placeholder="rate (%)"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Sale date
                    </label>
                    <input
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Row 4: Customer select | (Empty right col) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Customer select
                    </label>
                    <div className="flex">
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="flex-1 h-8 px-2.5 text-[12px] border border-[#ccc] rounded-l-xs focus:border-[#337ab7] focus:outline-none bg-white"
                      >
                        <option value="">--Select--</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.phone ? `(${c.phone})` : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomerModal(true)}
                        className="h-8 px-2.5 bg-[#337ab7] hover:bg-[#286090] text-white rounded-r-xs flex items-center justify-center cursor-pointer transition-colors"
                        title="Add Customer"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div></div>
                </div>

                {/* Submit Button on bottom-left matching Screenshot 3 */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white text-[12px] font-normal rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{submitting ? "Processing..." : "Sale now"}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Quick Add Customer Modal - 1:1 Matching Legacy CSM Screenshot */}
        {showAddCustomerModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xs shadow-2xl max-w-xl w-full overflow-hidden border border-[#ccc]">
              {/* Header: Dark blue #163b65 */}
              <div className="bg-[#163b65] text-white px-4 py-2.5 flex items-center justify-between">
                <h3 className="font-semibold text-[14px] text-white tracking-wide">
                  Adding new customer
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="text-white/80 hover:text-white text-base leading-none cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateCustomer}>
                <div className="p-5 space-y-3.5 bg-white text-[12px]">
                  {/* Row 1: English name | Khmer name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-normal text-[#333] mb-1">
                        English name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex. Chariya"
                        value={custEnglishName}
                        onChange={(e) => setCustEnglishName(e.target.value)}
                        className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-normal text-[#333] mb-1">
                        Khmer name
                      </label>
                      <input
                        type="text"
                        placeholder="Ex. ចរិយា"
                        value={custKhmerName}
                        onChange={(e) => setCustKhmerName(e.target.value)}
                        className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                      />
                    </div>
                  </div>

                  {/* Row 2: Date of birth | Job */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-normal text-[#333] mb-1">
                        Date of birth
                      </label>
                      <input
                        type="date"
                        value={custDob}
                        onChange={(e) => setCustDob(e.target.value)}
                        className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none bg-white placeholder:text-[#999]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-normal text-[#333] mb-1">
                        Job
                      </label>
                      <input
                        type="text"
                        placeholder="Ex. Sale"
                        value={custJob}
                        onChange={(e) => setCustJob(e.target.value)}
                        className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                      />
                    </div>
                  </div>

                  {/* Row 3: Gender | Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-normal text-[#333] mb-1">
                        Gender
                      </label>
                      <select
                        value={custGender}
                        onChange={(e) => setCustGender(e.target.value)}
                        className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-normal text-[#333] mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        placeholder="current address"
                        value={custAddress}
                        onChange={(e) => setCustAddress(e.target.value)}
                        className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                      />
                    </div>
                  </div>

                  {/* Row 4: ID card | Phone number */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-normal text-[#333] mb-1">
                        ID card
                      </label>
                      <input
                        type="text"
                        placeholder="personal id card"
                        value={custIdCard}
                        onChange={(e) => setCustIdCard(e.target.value)}
                        className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-normal text-[#333] mb-1">
                        Phone number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="contactable phone"
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                      />
                    </div>
                  </div>

                  {/* Row 5: Email | Note */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-normal text-[#333] mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="Ex. customer@example.com"
                        value={custEmail}
                        onChange={(e) => setCustEmail(e.target.value)}
                        className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-normal text-[#333] mb-1">
                        Note
                      </label>
                      <textarea
                        rows={2}
                        placeholder="some note for customer"
                        value={custNote}
                        onChange={(e) => setCustNote(e.target.value)}
                        className="w-full p-2 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none placeholder:text-[#999]"
                      />
                    </div>
                  </div>

                  {/* Image of ID card */}
                  <div className="pt-1">
                    <label className="block text-[12px] font-normal text-[#333] mb-1">
                      Image of ID card
                    </label>
                    <div className="w-[190px] h-[140px] border border-[#ccc] bg-[#f9f9f9] flex items-center justify-center text-[12px] text-[#999] overflow-hidden">
                      {custIdCardImage ? (
                        <img
                          src={custIdCardImage}
                          alt="ID Card"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>190x140</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => custFileInputRef.current?.click()}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-[#d9534f] hover:bg-[#c9302c] text-white text-[12px] font-normal rounded-xs cursor-pointer shadow-2xs transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Select image</span>
                    </button>
                    <input
                      type="file"
                      ref={custFileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleCustImageChange}
                    />
                  </div>
                </div>

                {/* Footer: Close and Save */}
                <div className="px-5 py-3 border-t border-[#e5e5e5] bg-white flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(false)}
                    className="px-4 py-1.5 text-[12px] font-normal text-[#333] bg-white border border-[#ccc] rounded-xs hover:bg-[#e6e6e6] cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={creatingCust}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-normal text-white bg-[#337ab7] hover:bg-[#286090] rounded-xs cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{creatingCust ? "Saving..." : "Save"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW 1: STORE LIST (Matching Screenshot 1 100%)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-white font-sans pb-16 space-y-3">
      {/* 1. Breadcrumb matching Screenshot 1 */}
      <div className="flex items-center gap-1.5 px-4 py-2 bg-[#f5f5f5] border border-[#e3e3e3] rounded text-[13px] text-[#777]">
        <TableProperties className="h-4 w-4 text-[#337ab7]" />
        <Link href="/" className="text-[#337ab7] hover:underline font-normal">
          Dashboard
        </Link>
        <span className="text-[#ccc]">&gt;</span>
        <span className="text-[#777]">Car list</span>
      </div>

      {/* 2. Heading and Subtitle matching Screenshot 1 */}
      <div className="pt-1">
        <div className="flex items-center gap-2">
          <h1 className="text-[24px] font-bold text-[#333] tracking-tight leading-tight">
            Store list
          </h1>
          <span className="bg-[#6c757d] text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
            {filteredVehicles.length}
          </span>
        </div>
        <p className="text-[12px] text-[#777] mt-0.5 mb-4">
          new sale car
        </p>
      </div>

      {/* 3. Filter Row matching Screenshot 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pb-3">
        <div>
          <label className="block text-[12px] font-semibold text-[#337ab7] mb-1">
            Brand
          </label>
          <input
            type="text"
            placeholder="brand name"
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#337ab7] mb-1">
            Model
          </label>
          <input
            type="text"
            placeholder="Car model"
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#337ab7] mb-1">
            Vin number
          </label>
          <input
            type="text"
            placeholder="vin no"
            value={vinFilter}
            onChange={(e) => setVinFilter(e.target.value)}
            className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#337ab7] mb-1">
            Year
          </label>
          <input
            type="text"
            placeholder="Year"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#337ab7] mb-1">
            Body color
          </label>
          <input
            type="text"
            placeholder="Color"
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#337ab7] mb-1">
            Branch
          </label>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full h-8 px-2.5 text-[12px] border border-[#ccc] rounded-xs focus:border-[#337ab7] focus:outline-none bg-white"
          >
            <option value="all">-- All --</option>
            <option value="phnom penh">PHNOM PENH</option>
            <option value="battambang">BATTAMBANG</option>
            <option value="bokor monivong">BOKOR MONIVONG</option>
          </select>
        </div>
      </div>

      {/* 4. 2-Column Store Grid matching Screenshot 1 */}
      {loading ? (
        <div className="p-12 text-center text-[#777]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#337ab7] border-t-transparent mx-auto mb-2" />
          <span className="text-sm">កំពុងផ្ទុកបញ្ជីរថយន្តក្នុងស្តុក (Loading Store list)...</span>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="p-12 text-center border border-[#ddd] rounded-xs bg-[#fafafa] text-[#777]">
          <Car className="h-10 w-10 mx-auto opacity-40 mb-2" />
          <p className="font-semibold text-[#333]">គ្មានរថយន្តនៅសល់ក្នុងស្តុកសម្រាប់លក់ទេ (No available cars in store)</p>
          <p className="text-xs text-[#888] mt-1">
            រថយន្តទាំងអស់ប្រហែលជាត្រូវបានលក់រួច ឬមិនត្រូវនឹងលក្ខខណ្ឌ Filter។
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          {filteredVehicles.map((v) => {
            const price = v.inSalePrice || Math.round(v.totalLandedCost * 1.15) || 108000;

            return (
              <div
                key={v.id}
                className="bg-white border border-[#e3e3e3] rounded-xs shadow-2xs overflow-hidden flex flex-col justify-between hover:border-[#337ab7] transition-colors"
              >
                {/* Card Top Strip: Badge + Title (Left) and Price Tag (Right) */}
                <div className="p-3 border-b border-[#eee] flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-[#0d6efd] rounded-xs uppercase">
                      IN STOCK: {v.branch.toUpperCase()}
                    </span>
                    <h3 className="text-[14px] font-bold text-[#337ab7] uppercase mt-1">
                      {v.brand} : {v.model}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 text-[#b91c1c] font-bold font-mono text-[16px]">
                    <Tag className="h-4 w-4 fill-current" />
                    <span>${Number(price).toLocaleString("en-US")}</span>
                  </div>
                </div>

                {/* Card Body: Thumbnail (Left) + Spec Table & Sale Now (Right) */}
                <div className="p-3 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Left: Thumbnail Image */}
                  <div className="sm:col-span-5 aspect-[4/3] border border-[#ddd] bg-[#f9f9f9] overflow-hidden flex items-center justify-center">
                    {v.coverImageUrl ? (
                      <img
                        src={v.coverImageUrl}
                        alt={`${v.brand} ${v.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="h-10 w-10 text-slate-300" />
                    )}
                  </div>

                  {/* Right: Key Specs Table + Green Sale Now Button */}
                  <div className="sm:col-span-7 flex flex-col justify-between h-full space-y-3">
                    <table className="w-full text-left text-[12px] border border-[#e7eaec] overflow-hidden">
                      <tbody>
                        <tr className="border-b border-[#e7eaec] bg-white">
                          <td className="py-1 px-2.5 font-bold text-[#555] w-24">Body color</td>
                          <td className="py-1 px-2.5 text-[#333] uppercase">{v.color}</td>
                        </tr>
                        <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                          <td className="py-1 px-2.5 font-bold text-[#555]">Inside color</td>
                          <td className="py-1 px-2.5 text-[#333] uppercase">{v.interiorColor || "RED"}</td>
                        </tr>
                        <tr className="border-b border-[#e7eaec] bg-white">
                          <td className="py-1 px-2.5 font-bold text-[#555]">Year</td>
                          <td className="py-1 px-2.5 text-[#333] font-mono">{v.year}</td>
                        </tr>
                        <tr className="bg-[#f9f9f9]">
                          <td className="py-1 px-2.5 font-bold text-[#555]">Vin number</td>
                          <td className="py-1 px-2.5 text-[#333] font-mono text-[11px] truncate max-w-[130px]" title={v.vin}>
                            {v.vin}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Green Sale Now Button matching Screenshot 1 */}
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleSelectCarToSell(v)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1ab394] hover:bg-[#18a689] text-white text-[12px] font-semibold rounded-xs shadow-2xs cursor-pointer transition-colors"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>Sale Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
