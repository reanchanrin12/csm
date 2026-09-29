"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TableProperties,
  User,
  UserPlus,
  Car,
  Calendar,
  Settings,
  Edit,
  RotateCcw,
  ShoppingCart,
  CircleDot,
  Check,
  AlertCircle,
  Menu,
  X,
  Plus,
  Save,
} from "lucide-react";
import { vehicleService, settingsService } from "@/lib/api";
import type { CreateVehicleDto } from "@csm/contracts";

interface FormOptions {
  branches: { id: string; name: string }[];
  brands: { id: string; name: string; models: { id: string; name: string }[] }[];
  suppliers: { id: string; nameEn: string; nameKh: string | null }[];
}

function CarPurchasingForm() {
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("edit");
      if (id) {
        setEditId(id);
        setIsLoadingVehicle(true);
      }
    }
  }, []);

  const isEditMode = Boolean(editId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [options, setOptions] = useState<FormOptions>({
    branches: [
      { id: "1", name: "BATTAMBANG" },
      { id: "2", name: "PHNOM PENH" },
      { id: "7", name: "BOKOR MONIVONG" },
    ],
    brands: [
      { id: "149", name: "MHERO", models: [{ id: "1", name: "817" }] },
      {
        id: "150",
        name: "VOYAH",
        models: [
          { id: "2", name: "DREAM PHEV" },
          { id: "3", name: "FREE RWD" },
          { id: "4", name: "TAISHAN ULTRA" },
          { id: "5", name: "TAISHAN BLACK EDITION" },
        ],
      },
    ],
    suppliers: [
      {
        id: "1",
        nameEn: "CHINA DONG FENG MOTOR INDUSTRY IMP&EXP CO., LTD CHINA DONG FENG MOTOR INDUSTRY IMP&EXP CO., LTD",
        nameKh: "CHINA DONG FENG MOTOR INDUSTRY",
      },
      { id: "2", nameEn: "លោក ទៀ សុខា Mr.TEA SOKHA", nameKh: "លោក ទៀ សុខា" },
      { id: "3", nameEn: "លោក ម៉ែន សុខ Mr.MEN SOK", nameKh: "លោក ម៉ែន សុខ" },
    ],
  });

  // Form State
  const [formData, setFormData] = useState<CreateVehicleDto>({
    vin: "",
    brand: "",
    model: "",
    madeYear: 2026,
    exteriorColor: "",
    purchaseCost: 0,
    payAmount: 0,
    inSalePrice: undefined,
    branchId: "",
    supplierId: "",
    fuelType: "EV",
    cylinderDisp: "",
    engineNumber: "",
    interiorColor: "",
    batteryCapacity: "",
    plateNumber: "",
    registrationCard: "",
    witness: "",
    arrivalDate: "",
    purchasingDate: new Date().toISOString().slice(0, 10),
    note: "",
    coverImageUrl: "",
    galleryImages: [],
  });

  const [chassisNote, setChassisNote] = useState("");

  // Quick Add Supplier Modal State (prevents navigating away and losing data)
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [newSupplierNameEn, setNewSupplierNameEn] = useState("");
  const [newSupplierNameKh, setNewSupplierNameKh] = useState("");
  const [newSupplierPhone, setNewSupplierPhone] = useState("");
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);

  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // 1. Restore draft on mount ONLY when NOT in edit mode
  useEffect(() => {
    if (isEditMode) return;
    try {
      const saved = localStorage.getItem("csm_purchasing_car_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          if (parsed.formData) {
            setFormData((prev) => ({ ...prev, ...parsed.formData }));
          }
          if (parsed.chassisNote) setChassisNote(parsed.chassisNote);
          if (parsed.previewUrl) setPreviewUrl(parsed.previewUrl);
          if (parsed.imageDimensions) setImageDimensions(parsed.imageDimensions);
        }
      }
    } catch (e) {
      console.error("Failed to restore draft:", e);
    }
  }, [isEditMode]);

  // 2. Autosave draft on every keystroke ONLY when NOT in edit mode
  useEffect(() => {
    if (isEditMode) return;
    try {
      if (formData.vin || formData.brand || formData.purchaseCost || chassisNote) {
        localStorage.setItem(
          "csm_purchasing_car_draft",
          JSON.stringify({ formData, chassisNote, previewUrl, imageDimensions })
        );
      }
    } catch (e) {
      console.error("Failed to autosave draft:", e);
    }
  }, [formData, chassisNote, previewUrl, imageDimensions, isEditMode]);

  // 3. Load vehicle details if in edit mode (Edit instead of Create New)
  useEffect(() => {
    if (!editId) {
      setIsLoadingVehicle(false);
      return;
    }
    const targetId: string = editId;

    async function loadVehicleToEdit(id: string) {
      setIsLoadingVehicle(true);
      try {
        const v = (await vehicleService.getById(id).catch(() => null)) as any;
        if (v) {
          const brandName =
            (typeof v.brand === "string" && v.brand) ||
            v.model?.brand?.name ||
            "";
          const modelName =
            (typeof v.model === "string" && v.model) ||
            v.model?.name ||
            "";
          const resolvedBranchId =
            v.branchId ||
            v.currentBranch?.id ||
            "";
          const resolvedSupplierId =
            v.supplierId ||
            v.supplier?.id ||
            "";

          // Ensure current branch and supplier are available in select options
          if (v.currentBranch) {
            setOptions((prev) => {
              const exists = prev.branches.some((b) => b.id === v.currentBranch.id);
              return exists ? prev : { ...prev, branches: [...prev.branches, v.currentBranch] };
            });
          }
          if (v.supplier) {
            setOptions((prev) => {
              const exists = prev.suppliers.some((s) => s.id === v.supplier.id);
              return exists ? prev : { ...prev, suppliers: [...prev.suppliers, v.supplier] };
            });
          }
          if (brandName) {
            setOptions((prev) => {
              const brandExists = prev.brands.some((b) => b.name === brandName);
              if (!brandExists) {
                return {
                  ...prev,
                  brands: [
                    ...prev.brands,
                    {
                      id: v.model?.brand?.id || "brand-" + brandName,
                      name: brandName,
                      models: modelName ? [{ id: v.model?.id || "model-" + modelName, name: modelName }] : [],
                    },
                  ],
                };
              }
              return {
                ...prev,
                brands: prev.brands.map((b) => {
                  if (b.name !== brandName) return b;
                  const modelExists = b.models.some((m) => m.name === modelName);
                  if (modelExists || !modelName) return b;
                  return {
                    ...b,
                    models: [...b.models, { id: v.model?.id || "model-" + modelName, name: modelName }],
                  };
                }),
              };
            });
          }

          setFormData({
            vin: v.vin || "",
            brand: brandName,
            model: modelName,
            madeYear: v.madeYear || 2026,
            exteriorColor: v.exteriorColor || "",
            purchaseCost: Number(v.purchaseCost) || 0,
            payAmount: Number(v.payAmount || v.purchaseCost) || 0,
            inSalePrice: v.inSalePrice != null ? Number(v.inSalePrice) : undefined,
            branchId: resolvedBranchId,
            supplierId: resolvedSupplierId,
            fuelType: v.fuelType || "EV",
            cylinderDisp: v.cylinderDisp || "",
            engineNumber: v.engineNumber || "",
            interiorColor: v.interiorColor || "",
            batteryCapacity: v.batteryCapacity || "",
            plateNumber: v.plateNumber || "",
            registrationCard: v.registrationCard || "",
            witness: v.witness || "",
            arrivalDate: v.arrivalDate ? v.arrivalDate.slice(0, 10) : "",
            purchasingDate: v.purchasingDate
              ? v.purchasingDate.slice(0, 10)
              : v.createdAt
              ? v.createdAt.slice(0, 10)
              : new Date().toISOString().slice(0, 10),
            note: v.note || "",
            coverImageUrl: v.coverImageUrl || "",
            galleryImages: v.galleryImages || [],
          });

          if (v.coverImageUrl) {
            setPreviewUrl(v.coverImageUrl);
            const img = new Image();
            img.onload = () => {
              setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.src = v.coverImageUrl;
          }
        }
      } catch (err) {
        console.error("Failed to load vehicle for editing:", err);
      } finally {
        setIsLoadingVehicle(false);
      }
    }
    loadVehicleToEdit(targetId);
  }, [editId]);

  // Load master options from backend
  useEffect(() => {
    async function loadOptions() {
      try {
        const data = (await vehicleService.getOptions().catch(() => null)) as any;
        if (data) {
          setOptions((prev) => ({
            branches: Array.isArray(data.branches) && data.branches.length > 0 ? data.branches : prev.branches,
            brands: Array.isArray(data.brands) && data.brands.length > 0 ? data.brands : prev.brands,
            suppliers: Array.isArray(data.suppliers) && data.suppliers.length > 0 ? data.suppliers : prev.suppliers,
          }));
        }
      } catch (err) {
        console.error("Failed to load options:", err);
      }
    }
    loadOptions();
  }, []);

  const handleChange = (field: keyof CreateVehicleDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const [optimizedImageBase64, setOptimizedImageBase64] = useState<string>("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side automatic optimization to prevent payload issues with large phone photos
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", 0.82);
        setPreviewUrl(compressed);
        setOptimizedImageBase64(compressed);
        setImageDimensions({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setPreviewUrl("");
    setOptimizedImageBase64("");
    setImageDimensions(null);
    setGalleryFiles([]);
  };

  const handleQuickAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierNameEn.trim()) return;
    setIsAddingSupplier(true);
    try {
      const res = await settingsService
        .createSupplier({
          nameEn: newSupplierNameEn.trim(),
          nameKh: newSupplierNameKh.trim() || undefined,
          phone: newSupplierPhone.trim() || undefined,
          category: "VEHICLE",
        })
        .catch(() => null);

      const createdSup = (res as any) || {
        id: String(Date.now()),
        nameEn: newSupplierNameEn.trim(),
        nameKh: newSupplierNameKh.trim() || null,
      };

      setOptions((prev) => ({
        ...prev,
        suppliers: [createdSup, ...prev.suppliers],
      }));
      handleChange("supplierId", createdSup.id);
      setNewSupplierNameEn("");
      setNewSupplierNameKh("");
      setNewSupplierPhone("");
      setIsAddSupplierOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to add supplier");
    } finally {
      setIsAddingSupplier(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.vin || formData.vin.trim().length === 0) {
      setErrorMessage("Please enter Chassis number.");
      setIsSubmitting(false);
      return;
    }

    try {
      let finalImage = optimizedImageBase64;
      const firstFile = galleryFiles[0];

      if (!finalImage && firstFile) {
        finalImage = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new window.Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const MAX_DIM = 1200;
              let width = img.width;
              let height = img.height;

              if (width > height && width > MAX_DIM) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else if (height > MAX_DIM) {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL("image/jpeg", 0.82));
            };
            img.onerror = () => resolve("");
            img.src = event.target?.result as string;
          };
          reader.onerror = () => resolve("");
          reader.readAsDataURL(firstFile);
        });
      } else if (!finalImage && previewUrl && previewUrl.startsWith("data:image")) {
        finalImage = previewUrl;
      }

      if (isEditMode && editId) {
        await vehicleService.update(editId, {
          vin: formData.vin,
          brand: formData.brand || undefined,
          model: formData.model || undefined,
          madeYear: formData.madeYear ? Number(formData.madeYear) : undefined,
          cylinderDisp: formData.cylinderDisp || undefined,
          exteriorColor: formData.exteriorColor || undefined,
          interiorColor: formData.interiorColor || undefined,
          fuelType: formData.fuelType || undefined,
          batteryCapacity: formData.batteryCapacity || undefined,
          plateNumber: formData.plateNumber || undefined,
          registrationCard: formData.registrationCard || undefined,
          arrivalDate: formData.arrivalDate || undefined,
          purchasingDate: formData.purchasingDate || undefined,
          coverImageUrl: finalImage || formData.coverImageUrl || undefined,
          galleryImages: finalImage ? [finalImage] : (formData.galleryImages || []),
          purchaseCost: formData.purchaseCost != null ? Number(formData.purchaseCost) : undefined,
          payAmount: formData.payAmount != null ? Number(formData.payAmount) : undefined,
          inSalePrice: formData.inSalePrice != null ? Number(formData.inSalePrice) : undefined,
          branchId: formData.branchId || undefined,
          supplierId: formData.supplierId || undefined,
          engineNumber: formData.engineNumber || undefined,
          witness: formData.witness || undefined,
          note: chassisNote ? `${formData.note || ""} (Chassis Note: ${chassisNote})`.trim() : (formData.note || undefined),
        });

        setSuccessMessage(`Car ${formData.brand || ""} ${formData.model || ""} updated successfully!`);
        setTimeout(() => {
          router.push("/inventory");
        }, 1200);
        return;
      }

      await vehicleService.create({
        ...formData,
        note: chassisNote ? `${formData.note || ""} (Chassis Note: ${chassisNote})`.trim() : formData.note,
        coverImageUrl: finalImage || "",
        galleryImages: finalImage ? [finalImage] : [],
      });

      // Clear draft on successful purchase
      try {
        localStorage.removeItem("csm_purchasing_car_draft");
      } catch {}

      setSuccessMessage(`Car ${formData.brand || "MHERO"} ${formData.model || ""} purchased successfully!`);
      setTimeout(() => {
        router.push("/inventory");
      }, 1200);
    } catch (err: any) {
      // NOTE: Form state is strictly preserved here so user never loses entered data
      const detailedError =
        Array.isArray(err.errors) && err.errors.length > 0
          ? `${err.message}: ${err.errors.join(", ")}`
          : err.message || "Failed to save car. Please check inputs and try again.";
      setErrorMessage(detailedError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBrandObj = options.brands.find((b) => b.name === formData.brand);

  if (isLoadingVehicle) {
    return (
      <div className="space-y-3 w-full bg-white pb-16 font-sans">
        <div className="flex items-center gap-1.5 px-4 py-2 bg-[#f5f5f5] border border-[#e3e3e3] rounded text-[13px] text-[#777]">
          <TableProperties className="h-4 w-4 text-[#337ab7]" />
          <Link href="/" className="text-[#337ab7] hover:underline font-normal">
            Dashboard
          </Link>
          <span className="text-[#ccc]">&gt;</span>
          <Link href="/inventory" className="text-[#337ab7] hover:underline font-normal">
            Manage purchased car
          </Link>
          <span className="text-[#ccc]">&gt;</span>
          <span className="text-[#777]">Edit Car</span>
        </div>
        <div className="pt-2">
          <h1 className="text-[26px] font-bold text-[#333] tracking-tight leading-tight">
            Update Purchased Car
          </h1>
          <p className="text-[12px] text-[#777] mt-0.5 mb-6">
            loading vehicle information for editing...
          </p>
        </div>
        <div className="flex flex-col items-center justify-center p-16 text-[#777]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#337ab7] border-t-transparent mb-3" />
          <span className="text-sm font-medium">កំពុងផ្ទុកទិន្នន័យរថយន្តសម្រាប់កែប្រែ (Loading car details)...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full bg-white pb-16 font-sans">
      {/* 1. Breadcrumb bar matching legacy Bootstrap 3 */}
      <div className="flex items-center gap-1.5 px-4 py-2 bg-[#f5f5f5] border border-[#e3e3e3] rounded text-[13px] text-[#777]">
        <TableProperties className="h-4 w-4 text-[#337ab7]" />
        <Link href="/" className="text-[#337ab7] hover:underline font-normal">
          Dashboard
        </Link>
        <span className="text-[#ccc]">&gt;</span>
        {isEditMode ? (
          <>
            <Link href="/inventory" className="text-[#337ab7] hover:underline font-normal">
              Manage purchased car
            </Link>
            <span className="text-[#ccc]">&gt;</span>
            <span className="text-[#777]">Edit Car</span>
          </>
        ) : (
          <span className="text-[#777]">Car purchase</span>
        )}
      </div>

      {/* 2. Heading and Subtitle */}
      <div className="pt-2">
        <h1 className="text-[26px] font-bold text-[#333] tracking-tight leading-tight">
          {isEditMode ? "Update Purchased Car" : "Car Purchasing"}
        </h1>
        <p className="text-[12px] text-[#777] mt-0.5 mb-6">
          {isEditMode ? "edit and update vehicle information" : "complete the form to add new car"}
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 mb-4 rounded bg-[#dff0d8] border border-[#d6e9c6] text-[#3c763d] flex items-center gap-2 text-[13px]">
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 mb-4 rounded bg-[#f2dede] border border-[#ebccd1] text-[#a94442] flex items-center gap-2 text-[13px]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. 3-Column Purchasing Form matching Screenshot 111141 */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          {/* ═════════════════════════════════════════
              COLUMN 1 (Left)
          ═════════════════════════════════════════ */}
          <div className="space-y-4">
            {/* Supplier */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Supplier
              </label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => handleChange("supplierId", e.target.value)}
                    className="h-[34px] w-full pl-9 pr-3 text-[13px] border border-[#ccc] rounded bg-white text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                  >
                    <option value="">-- Select --</option>
                    {options.suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(true)}
                  className="h-[34px] px-3 bg-[#f0ad4e] hover:bg-[#ec971f] text-white rounded flex items-center justify-center shadow-xs cursor-pointer transition-colors"
                  title="Add Supplier without leaving page"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Branch / Stock */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Branch / Stock
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-500">
                  <Car className="h-4 w-4" />
                </span>
                <select
                  value={formData.branchId}
                  onChange={(e) => handleChange("branchId", e.target.value)}
                  className="h-[34px] w-full pl-9 pr-3 text-[13px] border border-[#ccc] rounded bg-white text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                >
                  <option value="">-- Select --</option>
                  {options.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Purchasing date */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Purchasing date
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-500">
                  <Calendar className="h-4 w-4" />
                </span>
                <input
                  type="date"
                  value={formData.purchasingDate || ""}
                  onChange={(e) => handleChange("purchasingDate", e.target.value)}
                  className="h-[34px] w-full pl-9 pr-3 text-[13px] border border-[#ccc] rounded text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Note
              </label>
              <textarea
                placeholder="write some note"
                value={formData.note || ""}
                onChange={(e) => handleChange("note", e.target.value)}
                className="w-full h-[106px] p-2.5 text-[13px] border border-[#ccc] rounded text-[#555] resize-none shadow-xs focus:outline-none focus:border-[#66afe9]"
              />
            </div>

            {/* Purchase price */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Purchase price
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-[14px] text-[#555] bg-[#eee] border border-r-0 border-[#ccc] rounded-l font-normal">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="car purchase prices"
                  value={formData.purchaseCost || ""}
                  onChange={(e) => handleChange("purchaseCost", Number(e.target.value))}
                  className="h-[34px] flex-1 px-3 text-[13px] border border-[#ccc] rounded-r text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>

            {/* Pay amount */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Pay amount
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-[14px] text-[#555] bg-[#eee] border border-r-0 border-[#ccc] rounded-l font-normal">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="amount pay"
                  value={formData.payAmount || ""}
                  onChange={(e) => handleChange("payAmount", Number(e.target.value))}
                  className="h-[34px] flex-1 px-3 text-[13px] border border-[#ccc] rounded-r text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>

            {/* In sale price */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                In sale price
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-[14px] text-[#555] bg-[#eee] border border-r-0 border-[#ccc] rounded-l font-normal">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="in sale price"
                  value={formData.inSalePrice || ""}
                  onChange={(e) => handleChange("inSalePrice", Number(e.target.value))}
                  className="h-[34px] flex-1 px-3 text-[13px] border border-[#ccc] rounded-r text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>

            {/* Change Image cover */}
            <div className="pt-2">
              <label className="block text-[14px] font-semibold text-[#333] mb-1.5">
                Change Image cover
              </label>
              {/* Outer Bootstrap 3 .thumbnail box matching media_1790330229729.png */}
              <div className="w-[190px] h-[142px] p-1 bg-white border border-[#ddd] rounded-[4px] shadow-2xs mb-2.5 relative group">
                <div className="w-full h-full bg-[#f5f5f5] rounded-[2px] flex items-center justify-center overflow-hidden relative">
                  {previewUrl ? (
                    <>
                      <img
                        src={previewUrl}
                        alt="cover preview"
                        className="w-full h-full object-contain"
                      />
                      {imageDimensions && (
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded font-mono pointer-events-none">
                          {imageDimensions.width}x{imageDimensions.height}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleClearImage}
                        title="Remove image"
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-[11px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[17px] text-[#8c9bb0] font-normal select-none">
                      180x140
                    </span>
                  )}
                </div>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#d9534f] hover:bg-[#c9302c] active:bg-[#ac2925] text-white rounded-[4px] text-[13px] font-normal cursor-pointer shadow-xs transition-colors">
                <RotateCcw className="h-4 w-4" />
                <span>Select image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Purchase Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#337ab7] hover:bg-[#286090] active:bg-[#204d74] text-white font-medium text-[14px] rounded-[4px] shadow-xs cursor-pointer transition-colors"
              >
                {isEditMode ? (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{isSubmitting ? "Updating..." : "Update Car"}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    <span>{isSubmitting ? "Processing..." : "Purchase"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ═════════════════════════════════════════
              COLUMN 2 (Middle)
          ═════════════════════════════════════════ */}
          <div className="space-y-4">
            {/* Brand */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Brand
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-amber-600">
                  <CircleDot className="h-4 w-4" />
                </span>
                <select
                  value={formData.brand}
                  onChange={(e) => {
                    const newBrand = e.target.value;
                    const found = options.brands.find((b) => b.name === newBrand);
                    handleChange("brand", newBrand);
                    if (found && found.models.length > 0) {
                      handleChange("model", found.models[0]?.name || "");
                    }
                  }}
                  className="h-[34px] w-full pl-9 pr-3 text-[13px] border border-[#ccc] rounded bg-white text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                >
                  <option value="">-- Select --</option>
                  {options.brands.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Made year */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Made year
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-[13px] text-[#777] bg-[#eee] border border-r-0 border-[#ccc] rounded-l">
                  <Calendar className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="ex. 2014"
                  value={formData.madeYear || ""}
                  onChange={(e) => handleChange("madeYear", Number(e.target.value))}
                  className="h-[34px] flex-1 px-3 text-[13px] border border-[#ccc] rounded-r text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>

            {/* Chassis number */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Chassis number
              </label>
              <div className="flex gap-2">
                <div className="flex flex-1">
                  <span className="inline-flex items-center px-3 text-[13px] text-[#777] bg-[#eee] border border-r-0 border-[#ccc] rounded-l">
                    <TableProperties className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="ex. WP0ZZZ99ZTS392124"
                    value={formData.vin}
                    onChange={(e) => handleChange("vin", e.target.value.toUpperCase())}
                    className="h-[34px] flex-1 px-3 text-[13px] border border-[#ccc] rounded-r text-[#555] uppercase shadow-xs focus:outline-none focus:border-[#66afe9]"
                  />
                </div>
                <input
                  type="text"
                  placeholder="ex. (your note)"
                  value={chassisNote}
                  onChange={(e) => setChassisNote(e.target.value)}
                  className="h-[34px] w-28 px-2 text-[12px] border border-[#ccc] rounded text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>

            {/* Engine / Motor number */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Engine / Motor number
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-[13px] text-[#777] bg-[#eee] border border-r-0 border-[#ccc] rounded-l">
                  <Settings className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="ex. Z1E 30980"
                  value={formData.engineNumber || ""}
                  onChange={(e) => handleChange("engineNumber", e.target.value)}
                  className="h-[34px] flex-1 px-3 text-[13px] border border-[#ccc] rounded-r text-[#555] uppercase shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>

            {/* Exterior color */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Exterior color
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-[13px] text-[#777] bg-[#eee] border border-r-0 border-[#ccc] rounded-l">
                  <Edit className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="ex. white"
                  value={formData.exteriorColor}
                  onChange={(e) => handleChange("exteriorColor", e.target.value)}
                  className="h-[34px] flex-1 px-3 text-[13px] border border-[#ccc] rounded-r text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>

            {/* Fuel type */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Fuel type
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-500">
                  <Car className="h-4 w-4" />
                </span>
                <select
                  value={formData.fuelType}
                  onChange={(e) => handleChange("fuelType", e.target.value)}
                  className="h-[34px] w-full pl-9 pr-3 text-[13px] border border-[#ccc] rounded bg-white text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                >
                  <option value="EV">EV</option>
                  <option value="PHEV">PHEV</option>
                  <option value="GASOLINE">GASOLINE</option>
                  <option value="DIESEL">DIESEL</option>
                  <option value="HYBRID">HYBRID</option>
                </select>
              </div>
            </div>

            {/* Battery capacity */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Battery capacity
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-[13px] text-[#777] bg-[#eee] border border-r-0 border-[#ccc] rounded-l">
                  <TableProperties className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="សមត្ថភាពថ្ម"
                  value={formData.batteryCapacity || ""}
                  onChange={(e) => handleChange("batteryCapacity", e.target.value)}
                  className="h-[34px] flex-1 px-3 text-[13px] border border-[#ccc] rounded-r text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>

            {/* លេខប័ណ្ណ */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                លេខប័ណ្ណ
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-[13px] text-[#777] bg-[#eee] border border-r-0 border-[#ccc] rounded-l">
                  <Menu className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="លេខប័ណ្ណ"
                  value={formData.registrationCard || ""}
                  onChange={(e) => handleChange("registrationCard", e.target.value)}
                  className="h-[34px] flex-1 px-3 text-[13px] border border-[#ccc] rounded-r text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════
              COLUMN 3 (Right)
          ═════════════════════════════════════════ */}
          <div className="space-y-4">
            {/* Model */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Model
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-amber-600">
                  <CircleDot className="h-4 w-4" />
                </span>
                {selectedBrandObj && selectedBrandObj.models.length > 0 ? (
                  <select
                    value={formData.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    className="h-[34px] w-full pl-9 pr-3 text-[13px] border border-[#ccc] rounded bg-white text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                  >
                    <option value="">-- Select --</option>
                    {formData.model && !selectedBrandObj.models.some((m) => m.name === formData.model) && (
                      <option value={formData.model}>{formData.model}</option>
                    )}
                    {selectedBrandObj.models.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="-- Select --"
                    value={formData.model}
                    onChange={(e) => handleChange("model", e.target.value)}
                    className="h-[34px] w-full pl-9 pr-3 text-[13px] border border-[#ccc] rounded bg-white text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                  />
                )}
              </div>
            </div>

            {/* Gap row spacer matching Made year / Chassis in Column 2 */}
            <div className="h-[56px] hidden md:block"></div>

            {/* Cylinders disp */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Cylinders disp
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-[13px] text-[#777] bg-[#eee] border border-r-0 border-[#ccc] rounded-l">
                  <TableProperties className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="cylinders"
                  value={formData.cylinderDisp || ""}
                  onChange={(e) => handleChange("cylinderDisp", e.target.value)}
                  className="h-[34px] flex-1 px-3 text-[13px] border border-[#ccc] rounded-r text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>

            {/* Interior color */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Interior color
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-[13px] text-[#777] bg-[#eee] border border-r-0 border-[#ccc] rounded-l">
                  <Edit className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="ex. gray"
                  value={formData.interiorColor || ""}
                  onChange={(e) => handleChange("interiorColor", e.target.value)}
                  className="h-[34px] flex-1 px-3 text-[13px] border border-[#ccc] rounded-r text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>

            {/* Witness */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                Witness
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-[13px] text-[#777] bg-[#eee] border border-r-0 border-[#ccc] rounded-l">
                  <User className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="witness name"
                  value={formData.witness || ""}
                  onChange={(e) => handleChange("witness", e.target.value)}
                  className="h-[34px] flex-1 px-3 text-[13px] border border-[#ccc] rounded-r text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>

            {/* ផ្លាកលេខ */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                ផ្លាកលេខ
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-[13px] text-[#777] bg-[#eee] border border-r-0 border-[#ccc] rounded-l">
                  <Menu className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="ផ្លាកលេខរថយន្ត"
                  value={formData.plateNumber || ""}
                  onChange={(e) => handleChange("plateNumber", e.target.value.toUpperCase())}
                  className="h-[34px] flex-1 px-3 text-[13px] border border-[#ccc] rounded-r text-[#555] uppercase shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>

            {/* ថ្ងៃមកដល់ */}
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-1">
                ថ្ងៃមកដល់
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-[13px] text-[#777] bg-[#eee] border border-r-0 border-[#ccc] rounded-l">
                  <Calendar className="h-3.5 w-3.5" />
                </span>
                <input
                  type="date"
                  value={formData.arrivalDate || ""}
                  onChange={(e) => handleChange("arrivalDate", e.target.value)}
                  className="h-[34px] flex-1 px-3 text-[13px] border border-[#ccc] rounded-r text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Quick Add Supplier Modal (In-place modal so user doesn't leave the page and lose data) */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-[500px] border border-[#ccc] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3 bg-[#f5f5f5] border-b border-[#e5e5e5]">
              <h3 className="text-[16px] font-bold text-[#333] flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-[#337ab7]" />
                Add New Supplier
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSupplierOpen(false)}
                className="text-[#999] hover:text-[#333] p-1 text-[18px] leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleQuickAddSupplier} className="p-4 space-y-3">
              <div>
                <label className="block text-[13px] font-semibold text-[#333] mb-1">
                  Supplier Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DONG FENG MOTORS"
                  value={newSupplierNameEn}
                  onChange={(e) => setNewSupplierNameEn(e.target.value)}
                  className="w-full h-[34px] px-3 text-[13px] border border-[#ccc] rounded text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#333] mb-1">
                  Supplier Name (Khmer)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ក្រុមហ៊ុន ទៀ សុខា"
                  value={newSupplierNameKh}
                  onChange={(e) => setNewSupplierNameKh(e.target.value)}
                  className="w-full h-[34px] px-3 text-[13px] border border-[#ccc] rounded text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#333] mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 012 345 678"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  className="w-full h-[34px] px-3 text-[13px] border border-[#ccc] rounded text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#eee]">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-1.5 border border-[#ccc] text-[#333] text-[13px] rounded hover:bg-[#e6e6e6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingSupplier}
                  className="px-4 py-1.5 bg-[#337ab7] text-white text-[13px] font-medium rounded hover:bg-[#286090]"
                >
                  {isAddingSupplier ? "Saving..." : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewCarPurchasingPage() {
  return <CarPurchasingForm />;
}
