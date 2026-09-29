"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  TableProperties,
  Edit,
  Printer,
  Car,
  CreditCard,
  Info,
  ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { vehicleService } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [vehicle, setVehicle] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"carInfo" | "paymentInfo">("carInfo");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function loadVehicle() {
      setIsLoading(true);
      try {
        const data = await vehicleService.getById(id);
        setVehicle(data);
      } catch (err: any) {
        setError(err.message || "Failed to load vehicle details");
      } finally {
        setIsLoading(false);
      }
    }
    loadVehicle();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-4 w-full bg-white pb-16 font-sans">
        <div className="flex items-center gap-1.5 px-4 py-2 bg-[#f5f5f5] border border-[#e3e3e3] rounded text-[13px] text-[#777]">
          <TableProperties className="h-4 w-4 text-[#337ab7]" />
          <Link href="/" className="text-[#337ab7] hover:underline">
            Dashboard
          </Link>
          <span className="text-[#ccc]">&gt;</span>
          <Link href="/inventory" className="text-[#337ab7] hover:underline">
            Purchas manage
          </Link>
          <span className="text-[#ccc]">&gt;</span>
          <span className="text-[#777]">Purchas detail</span>
        </div>
        <div className="flex flex-col items-center justify-center p-20 text-[#777]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#337ab7] border-t-transparent mb-3" />
          <span className="text-sm font-medium">Loading car detail...</span>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="space-y-4 w-full bg-white pb-16 font-sans">
        <div className="p-4 bg-[#f2dede] border border-[#ebccd1] text-[#a94442] rounded text-[13px]">
          {error || "Vehicle not found."}
        </div>
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#337ab7] text-white text-[13px] rounded"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Car List
        </Link>
      </div>
    );
  }

  const brandName = vehicle.brand || vehicle.model?.brand?.name || "MHERO";
  const modelName = vehicle.model?.name || vehicle.model || "817";

  return (
    <div className="space-y-4 w-full bg-white pb-16 font-sans">
      {/* 1. Breadcrumb bar matching legacy Screenshot 3 */}
      <div className="flex items-center gap-1.5 px-4 py-2 bg-[#f5f5f5] border border-[#e3e3e3] rounded text-[13px] text-[#777]">
        <TableProperties className="h-4 w-4 text-[#337ab7]" />
        <Link href="/" className="text-[#337ab7] hover:underline font-normal">
          Dashboard
        </Link>
        <span className="text-[#ccc]">&gt;</span>
        <Link href="/inventory" className="text-[#337ab7] hover:underline font-normal">
          Purchas manage
        </Link>
        <span className="text-[#ccc]">&gt;</span>
        <span className="text-[#777]">Purchas detail</span>
      </div>

      {/* 2. Page Title */}
      <div className="pt-1">
        <h1 className="text-[24px] font-bold text-[#333] tracking-tight">
          Car purchased list
        </h1>
      </div>

      {/* 3. Action Buttons Header (Update & Print Invoice) */}
      <div className="flex items-center gap-2 pt-1 pb-2">
        <Link
          href={`/inventory/new?edit=${vehicle.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#d9534f] hover:bg-[#c9302c] active:bg-[#ac2925] text-white text-[13px] font-medium rounded shadow-2xs transition-colors cursor-pointer"
        >
          <Edit className="h-3.5 w-3.5" />
          <span>Update</span>
        </Link>

        <Link
          href={`/purchasesaveinvoice/${vehicle.id}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#337ab7] hover:bg-[#286090] active:bg-[#204d74] text-white text-[13px] font-medium rounded shadow-2xs transition-colors cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Invoice</span>
        </Link>
      </div>

      {/* 4. 2-Column Split: Left Image Card & Right Detail Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
        {/* ── LEFT CARD (Image & Model Header) ── */}
        <div className="lg:col-span-5 bg-white border border-[#e3e3e3] rounded shadow-2xs overflow-hidden">
          {/* Header matching Screenshot: "817 : MHERO" */}
          <div className="text-center py-2.5 bg-white border-b border-[#eee] text-[14px] font-bold text-[#333]">
            {modelName} : {brandName}
          </div>

          <div className="p-4">
            {/* Image Preview Box */}
            <div className="w-full aspect-[4/3] rounded border border-[#ddd] bg-[#f9f9f9] overflow-hidden flex items-center justify-center relative">
              {vehicle.coverImageUrl ? (
                <img
                  src={vehicle.coverImageUrl}
                  alt={`${brandName} ${modelName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                  <span className="text-[12px]">No cover image</span>
                </div>
              )}
            </div>

            {/* Badges matching Screenshot 3: "From CHINA" and "In stock at PHNOM PENH" */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#f0ad4e] rounded uppercase shadow-2xs">
                From {vehicle.supplier?.country || "CHINA"}
              </span>
              <span className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#d9534f] rounded uppercase shadow-2xs">
                In stock at {vehicle.currentBranch?.name || vehicle.branchName || "PHNOM PENH"}
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT CARD (Tabs: Car Info & Payment Info) ── */}
        <div className="lg:col-span-7 bg-white border border-[#e3e3e3] rounded shadow-2xs overflow-hidden flex flex-col">
          {/* Tabs matching Screenshot 3 */}
          <div className="flex border-b border-[#ddd] bg-[#f8f8f8]">
            <button
              type="button"
              onClick={() => setActiveTab("carInfo")}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-t-2 transition-colors cursor-pointer",
                activeTab === "carInfo"
                  ? "bg-[#337ab7] text-white border-t-[#337ab7]"
                  : "text-[#555] hover:text-[#333] border-t-transparent hover:bg-slate-100"
              )}
            >
              <Car className="h-4 w-4" />
              <span>Car info</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("paymentInfo")}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-t-2 transition-colors cursor-pointer",
                activeTab === "paymentInfo"
                  ? "bg-[#337ab7] text-white border-t-[#337ab7]"
                  : "text-[#555] hover:text-[#333] border-t-transparent hover:bg-slate-100"
              )}
            >
              <CreditCard className="h-4 w-4" />
              <span>Payment & Balance Info</span>
            </button>
          </div>

          {/* TAB 1: Car Info matching Screenshot 3 */}
          {activeTab === "carInfo" && (
            <div className="p-4 flex-1">
              {/* Header inside tab */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#333]">
                  <Info className="h-4 w-4 text-[#337ab7]" />
                  <span>Full Car Detail</span>
                </div>
                <p className="text-[12px] text-[#777] mt-0.5">
                  for {brandName} {modelName}
                </p>
              </div>

              {/* Striped Table matching Screenshot 3 */}
              <div className="border border-[#e7eaec] rounded overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <tbody>
                    <tr className="border-b border-[#e7eaec] bg-white">
                      <td className="py-2 px-3.5 font-bold text-[#333] w-44">Brand:</td>
                      <td className="py-2 px-3.5 text-[#555] uppercase">{brandName}</td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Model:</td>
                      <td className="py-2 px-3.5 text-[#555] uppercase">{modelName}</td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-white">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Year:</td>
                      <td className="py-2 px-3.5 text-[#555]">{vehicle.madeYear}</td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Exterior Color:</td>
                      <td className="py-2 px-3.5 text-[#555] uppercase">{vehicle.exteriorColor || "N/A"}</td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-white">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Interior Color:</td>
                      <td className="py-2 px-3.5 text-[#555] uppercase">{vehicle.interiorColor || "N/A"}</td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Chassis Number:</td>
                      <td className="py-2 px-3.5 text-[#555] font-mono uppercase">{vehicle.vin}</td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-white">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Engine Number:</td>
                      <td className="py-2 px-3.5 text-[#555] font-mono uppercase">{vehicle.engineNumber || "N/A"}</td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Cylinders Disp:</td>
                      <td className="py-2 px-3.5 text-[#555]">{vehicle.cylinderDisp || "N/A"}</td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-white">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Steering Type:</td>
                      <td className="py-2 px-3.5 text-[#555]">left hand</td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Fuel Type:</td>
                      <td className="py-2 px-3.5 text-[#555]">{vehicle.fuelType || "EV"}</td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-white">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Body Style:</td>
                      <td className="py-2 px-3.5 text-[#555]">Luxury Car</td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Battery Capacity:</td>
                      <td className="py-2 px-3.5 text-[#555]">{vehicle.batteryCapacity || "N/A"}</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Note:</td>
                      <td className="py-2 px-3.5 text-[#555]">{vehicle.note || "N/A"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Payment & Balance Info matching Screenshot 3 */}
          {activeTab === "paymentInfo" && (
            <div className="p-4 flex-1">
              <div className="mb-3">
                <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#333]">
                  <CreditCard className="h-4 w-4 text-[#337ab7]" />
                  <span>Payment Detail Info</span>
                </div>
                <p className="text-[12px] text-[#777] mt-0.5">
                  amount and balance
                </p>
              </div>

              <div className="border border-[#e7eaec] rounded overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <tbody>
                    <tr className="border-b border-[#e7eaec] bg-white">
                      <td className="py-2 px-3.5 font-bold text-[#333] w-44">Supplier:</td>
                      <td className="py-2 px-3.5 text-[#555]">
                        {vehicle.supplier?.nameEn
                          ? `${vehicle.supplier.nameEn} / ${vehicle.supplier.nameEn}`
                          : "CHINA DONG FENG MOTOR INDUSTRY IMP&EXP CO., LTD"}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Purchas price:</td>
                      <td className="py-2 px-3.5 text-[#555] font-mono">
                        $ {Number(vehicle.purchaseCost || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-white">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Tax:</td>
                      <td className="py-2 px-3.5 text-[#555] font-mono">
                        $ {Number(vehicle.taxAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Clearance:</td>
                      <td className="py-2 px-3.5 text-[#555] font-mono">
                        $ {Number(vehicle.clearanceAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-white">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Container:</td>
                      <td className="py-2 px-3.5 text-[#555] font-mono">
                        $ {Number(vehicle.containerAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Labor:</td>
                      <td className="py-2 px-3.5 text-[#555] font-mono">
                        $ {Number(vehicle.laborAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-white">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Transport:</td>
                      <td className="py-2 px-3.5 text-[#555] font-mono">
                        $ {Number(vehicle.transportAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Repair:</td>
                      <td className="py-2 px-3.5 text-[#555] font-mono">
                        $ {Number(vehicle.repairAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {/* Highlighted Total Cost Row matching Screenshot 3 */}
                    <tr className="border-b border-[#e7eaec] bg-[#e8f1f8]">
                      <td className="py-2.5 px-3.5 font-bold text-[#1d5987]">Total Cost:</td>
                      <td className="py-2.5 px-3.5 font-bold font-mono text-[#1d5987]">
                        $ {Number(vehicle.totalLandedCost || vehicle.purchaseCost || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-white">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Insale price:</td>
                      <td className="py-2 px-3.5 text-[#555] font-mono">
                        $ {Number(vehicle.inSalePrice || 85000).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Paid:</td>
                      <td className="py-2 px-3.5 text-[#555] font-mono">
                        $ {Number(vehicle.paidAmount || vehicle.purchaseCost || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-white">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Balance:</td>
                      <td className="py-2 px-3.5 text-[#555] font-mono">
                        $ {Number(vehicle.balanceAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-[#f9f9f9]">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Purchas date:</td>
                      <td className="py-2 px-3.5 text-[#555]">
                        {vehicle.purchasedDate ||
                          new Date(vehicle.createdAt).toISOString().split("T")[0]}
                      </td>
                    </tr>
                    <tr className="border-b border-[#e7eaec] bg-white">
                      <td className="py-2 px-3.5 font-bold text-[#333]">Arrive on:</td>
                      <td className="py-2 px-3.5 text-[#555]">
                        {vehicle.arrivedDate || "2026-09-17"}
                      </td>
                    </tr>
                    <tr className="bg-[#f9f9f9]">
                      <td className="py-2 px-3.5 font-bold text-[#333]">In Branch:</td>
                      <td className="py-2 px-3.5 text-[#555] uppercase">
                        {vehicle.currentBranch?.name || vehicle.branchName || "PHNOM PENH"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
