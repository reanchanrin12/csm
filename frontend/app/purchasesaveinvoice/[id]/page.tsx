"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { vehicleService } from "@/lib/api";

interface InvoiceProps {
  params: Promise<{ id: string }>;
}

export default function PurchaseSaveInvoicePage({ params }: InvoiceProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [vehicle, setVehicle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadVehicle() {
      try {
        setIsLoading(true);
        const data = await vehicleService.getById(id);
        setVehicle(data);
      } catch (err) {
        console.error("Failed to load car details for invoice", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) {
      loadVehicle();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8 text-slate-600 font-sans">
        <div className="animate-spin rounded-full h-9 w-9 border-2 border-[#337ab7] border-t-transparent mb-3" />
        <span className="text-sm font-medium">កំពុងផ្ទុកវិក្កយបត្រ (Loading Invoice)...</span>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-8 text-center text-slate-700 bg-slate-100 min-h-screen font-sans flex flex-col items-center justify-center">
        <p className="mb-4 text-base font-semibold">រកមិនឃើញទិន្នន័យរថយន្តសម្រាប់វិក្កយបត្រនេះទេ (Vehicle invoice not found)</p>
        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#337ab7] text-white rounded text-sm font-medium hover:bg-[#286090] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to car list</span>
        </Link>
      </div>
    );
  }

  const brandName =
    typeof vehicle.brand === "string"
      ? vehicle.brand
      : vehicle.model?.brand?.name || vehicle.brand?.name || vehicle.modelRel?.brand?.name || vehicle.brandName || "VOYAH";

  const modelName =
    typeof vehicle.model === "string"
      ? vehicle.model
      : vehicle.model?.name || vehicle.modelRel?.name || vehicle.modelName || "TAISHAN ULTRA";

  const supplierName =
    vehicle.supplier?.nameEn ||
    "CHINA DONG FENG MOTOR INDUSTRY IMP&EXP CO., LTD";
  const supplierAddress =
    vehicle.supplier?.address ||
    "No.2#, Chuangye 2nd Road, Wuhan Economic & Technology Development Zone Wuhan City, Hubei Province, China";
  const supplierPhone =
    vehicle.supplier?.phone || "+86-27-84921192 / +86-27-84921149";
  const invoiceNo = `BU${vehicle.id.replace(/[^0-9]/g, "").slice(0, 8) || "55091892"}${vehicle.madeYear || "2026"}16`;

  const purchasePrice = Number(vehicle.purchaseCost || 0);
  const paidAmount = Number(vehicle.paidAmount || purchasePrice);
  const balanceAmount = Number(vehicle.balanceAmount || 0);

  const purchaseDate = vehicle.purchasedDate
    ? new Date(vehicle.purchasedDate)
    : new Date(vehicle.createdAt);
  const day = String(purchaseDate.getDate()).padStart(2, "0");
  const month = String(purchaseDate.getMonth() + 1).padStart(2, "0");
  const year = purchaseDate.getFullYear();

  return (
    <div className="min-h-screen bg-[#525659] print:bg-white text-black font-sans py-0 sm:py-6 flex flex-col items-center">
      {/* Floating Top Action Bar (Hidden on Print) */}
      <div className="print:hidden w-full max-w-[900px] bg-white border-b sm:border border-[#ddd] sm:rounded-t px-6 py-3 flex items-center justify-between shadow-md mb-0 sm:mb-2">
        <div className="flex items-center gap-3">
          <Link
            href={`/inventory/${vehicle.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f5f5] border border-[#ccc] hover:bg-slate-200 text-[13px] font-medium text-[#333] rounded transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>ត្រឡប់ក្រោយ (Back to detail)</span>
          </Link>
          <span className="text-[13px] text-slate-600 font-mono hidden sm:inline">
            Invoice: <strong className="text-black">{invoiceNo}</strong>
          </span>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white text-[13px] font-semibold rounded shadow transition-colors cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>បោះពុម្ព (Print Invoice)</span>
        </button>
      </div>

      {/* Official Khmer Printable Invoice Container matching Screenshot 5 */}
      <div className="w-full max-w-[900px] bg-white shadow-2xl print:shadow-none p-8 sm:p-12 print:p-0 text-[13px] leading-relaxed text-[#111]">
        {/* Top Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="text-left font-bold text-[14px]">
            <p className="text-[15px]">ហាងលក់រថយន្ត</p>
          </div>

          <div className="text-center font-bold text-[13px] leading-snug">
            <p className="tracking-wide">ព្រះរាជាណាចក្រកម្ពុជា</p>
            <p className="tracking-wide">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
          </div>
        </div>

        {/* Center Title */}
        <div className="text-center my-3 relative">
          <h1 className="text-[20px] font-bold tracking-normal inline-block text-black">
            លិខិតលក់រថយន្ត
          </h1>
          <div className="text-right text-[12px] text-slate-800 -mt-2">
            <span className="font-semibold">No:</span> {invoiceNo}
          </div>
        </div>

        <hr className="border-t-2 border-black my-3" />

        {/* Two-column Structured Key-Value Grid matching Screenshot 5 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 mt-4 text-[13px]">
          {/* Row 1 */}
          <div>
            <span className="font-bold">ឈ្មោះក្រុមហ៊ុន/អ្នកលក់ : </span>
            <span>{supplierName}</span>
          </div>
          <div className="flex gap-4">
            <div>
              <span className="font-bold">ភេទ : </span>
              <span>ប្រុស</span>
            </div>
            <div>
              <span className="font-bold">សញ្ជាតិ : </span>
              <span>{vehicle.supplier?.country || "CHINA"}</span>
            </div>
          </div>

          {/* Row 2 */}
          <div>
            <span className="font-bold">មុខងារ/ប្រភេទ : </span>
            <span>SUPPLIER</span>
          </div>
          <div>
            <span className="font-bold">លេខទូរស័ព្ទទំនាក់ទំនង : </span>
            <span>{supplierPhone}</span>
          </div>

          {/* Row 3 */}
          <div>
            <span className="font-bold">អាសយដ្ឋាន : </span>
            <span>{supplierAddress}</span>
          </div>
          <div>
            <span className="font-bold">ម៉ាក : </span>
            <span className="font-bold uppercase">{brandName} {modelName}</span>
          </div>

          {/* Row 4 */}
          <div>
            <span className="font-bold">អត្តសញ្ញាណប័ណ្ណ : </span>
            <span>N/A</span>
          </div>
          <div className="flex gap-6">
            <div>
              <span className="font-bold">លេខម៉ាស៊ីន : </span>
              <span className="font-mono uppercase">{vehicle.engineNumber || "N/A"}</span>
            </div>
            <div>
              <span className="font-bold">ពណ៌ : </span>
              <span className="uppercase">{vehicle.exteriorColor || "GREEN"}</span>
            </div>
          </div>

          {/* Row 5 */}
          <div>
            <span className="font-bold">បានទិញរថយន្តចំនួន : </span>
            <span className="font-semibold">1 គ្រឿង</span>
          </div>
          <div>
            <span className="font-bold">លេខកុងទ័រ : </span>
            <span>N/A</span>
          </div>

          {/* Row 6 */}
          <div>
            <span className="font-bold">លេខតួ : </span>
            <span className="font-mono font-semibold uppercase">{vehicle.vin}</span>
          </div>
          <div className="flex gap-4">
            <div>
              <span className="font-bold">ភេទ : </span>
              <span></span>
            </div>
            <div>
              <span className="font-bold">សញ្ជាតិ : </span>
              <span></span>
            </div>
          </div>

          {/* Row 7 */}
          <div>
            <span className="font-bold">ផ្លាកលេខសំគាល់ : </span>
            <span>{vehicle.plateNumber || "N/A"}</span>
          </div>
          <div>
            <span className="font-bold">លេខទូរស័ព្ទទំនាក់ទំនង : </span>
            <span></span>
          </div>

          {/* Row 8 */}
          <div>
            <span className="font-bold">ចុះឈ្មោះកុងត្រា : </span>
            <span></span>
          </div>
          <div></div>

          {/* Row 9 */}
          <div>
            <span className="font-bold">ចុះឈ្មោះប្រគល់ : </span>
            <span></span>
          </div>
          <div></div>

          {/* Row 10 */}
          <div>
            <span className="font-bold">អាសយដ្ឋាន : </span>
            <span></span>
          </div>
          <div></div>

          {/* Row 11 */}
          <div>
            <span className="font-bold">អត្តសញ្ញាណប័ណ្ណ : </span>
            <span></span>
          </div>
          <div></div>

          {/* Row 12 - Pricing */}
          <div>
            <span className="font-bold">តំលៃរថយន្ត : </span>
            <span className="font-bold font-mono">
              $ {purchasePrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex gap-6">
            <div>
              <span className="font-bold">ប្រាក់បង់ : </span>
              <span className="font-bold font-mono">
                $ {paidAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="font-bold">នៅខ្វះ : </span>
              <span className="font-bold font-mono">
                $ {balanceAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Row 13 */}
          <div>
            <span className="font-bold">អត្រាប្រាក់បង់ : </span>
            <span>1 $ ស្មើ</span>
          </div>
          <div></div>

          {/* Row 14 */}
          <div>
            <span className="font-bold">លេខវិក្កយបត្រ : </span>
            <span>{vehicle.note || "DF26PV-030KH102"}</span>
          </div>
          <div></div>

          {/* Row 15 */}
          <div>
            <span className="font-bold">ចំណាំ : </span>
            <span></span>
          </div>
          <div></div>

          {/* Row 16 */}
          <div className="pt-2 text-[12px] text-slate-700 italic">
            មេធាវី/សាក្សីដែលមានសិទ្ធិចុះហត្ថលេខា
          </div>
          <div></div>
        </div>

        {/* Date line matching Screenshot 5 */}
        <div className="text-right mt-10 mb-6 pr-4 text-[13px]">
          <p>
            {vehicle.currentBranch?.name === "BATTAMBANG" ? "បាត់ដំបង" : "ភ្នំពេញ"} ថ្ងៃទី {day} ខែ {month} ឆ្នាំ {year}
          </p>
        </div>

        {/* 4 Signature Columns matching Screenshot 5 */}
        <div className="grid grid-cols-4 gap-4 text-center mt-10 pt-4">
          <div className="flex flex-col items-center">
            <span className="font-bold mb-16">អ្នកលក់</span>
            <div className="w-full border-b border-dotted border-black/80" />
          </div>

          <div className="flex flex-col items-center">
            <span className="font-bold mb-16">សាក្សីអ្នកលក់</span>
            <div className="w-full border-b border-dotted border-black/80" />
          </div>

          <div className="flex flex-col items-center">
            <span className="font-bold mb-16">សាក្សីសងខាង</span>
            <div className="w-full border-b border-dotted border-black/80" />
          </div>

          <div className="flex flex-col items-center">
            <span className="font-bold mb-16">អ្នកទិញ</span>
            <div className="w-full border-b border-dotted border-black/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
