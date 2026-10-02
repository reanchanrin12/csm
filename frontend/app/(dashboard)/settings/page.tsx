"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  TableProperties,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Eye,
  PlusCircle,
  RotateCcw,
} from "lucide-react";
import { settingsService, customerService } from "@/lib/api";
import { UsersManagement } from "@/components/users-management";
import { TablePagination } from "@/components/ui/table-pagination";

interface BranchItem {
  id: string;
  name: string;
  address?: string | undefined;
  phone1?: string | undefined;
  phone2?: string | undefined;
  note?: string | undefined;
  _count?: {
    cars: number;
    employees: number;
  } | undefined;
}

interface ModelItem {
  id: string;
  name: string;
}

interface BrandItem {
  id: string;
  name: string;
  models?: ModelItem[];
}

interface SupplierItem {
  id: string;
  nameEn: string;
  nameKh?: string | undefined;
  country?: string | undefined;
  phone?: string | undefined;
  phone2?: string | undefined;
  email?: string | undefined;
  website?: string | undefined;
  address?: string | undefined;
  note?: string | undefined;
  category: string;
  gender?: string | undefined;
  job?: string | undefined;
  _count?: {
    vehicles: number;
    bills: number;
  };
}

interface CustomerItem {
  id: string;
  name: string;
  gender?: string | undefined;
  dob?: string | undefined;
  idCard?: string | undefined;
  address?: string | undefined;
  job?: string | undefined;
  phone: string;
  email?: string | undefined;
  note?: string | undefined;
}

interface CompanyProfileItem {
  id: string;
  name: string;
  gender?: string | undefined;
  dob?: string | undefined;
  phone?: string | undefined;
  job?: string | undefined;
  email?: string | undefined;
  note?: string | undefined;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "brands";

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deleteTargetSupplier, setDeleteTargetSupplier] = useState<SupplierItem | null>(null);
  const [isDeletingSupplier, setIsDeletingSupplier] = useState(false);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 6000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Company Profile State
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfileItem[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileGender, setProfileGender] = useState("Male");
  const [profileDob, setProfileDob] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileJob, setProfileJob] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileNote, setProfileNote] = useState("");

  // Supplier & Customer Sub-tab & Filters
  const [peopleSubTab, setPeopleSubTab] = useState<"supplier" | "customer">("supplier");
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerItem | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<SupplierItem | null>(null);

  // Supplier Add & Edit State
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);
  const [supplierNameEn, setSupplierNameEn] = useState("");
  const [supplierNameKh, setSupplierNameKh] = useState("");
  const [supplierCategory, setSupplierCategory] = useState<
    "VEHICLE" | "LOGISTICS" | "REPAIR" | "SPARE_PARTS" | "ACCESSORIES" | "CUSTOMS" | "INSURANCE" | "OTHER"
  >("VEHICLE");
  const [supplierJob, setSupplierJob] = useState("");
  const [supplierCountry, setSupplierCountry] = useState("CAMBODIA");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierPhone2, setSupplierPhone2] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierWebsite, setSupplierWebsite] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [supplierNote, setSupplierNote] = useState("");

  // Modal Dialogs
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchPhone, setBranchPhone] = useState("");
  const [branchPhone2, setBranchPhone2] = useState("");
  const [branchNote, setBranchNote] = useState("");

  // Branch Edit State
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [editBranchName, setEditBranchName] = useState("");
  const [editBranchAddress, setEditBranchAddress] = useState("");
  const [editBranchPhone1, setEditBranchPhone1] = useState("");
  const [editBranchPhone2, setEditBranchPhone2] = useState("");
  const [editBranchNote, setEditBranchNote] = useState("");

  const [isAddCountryOpen, setIsAddCountryOpen] = useState(false);
  const [newCountryName, setNewCountryName] = useState("");
  const [editingCountry, setEditingCountry] = useState<{ id: string; name: string } | null>(null);
  const [editCountryName, setEditCountryName] = useState("");
  const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([]);

  const [submitting, setSubmitting] = useState(false);

  // Table pagination state (10 items per page limit to prevent slow rendering)
  const [brandsPage, setBrandsPage] = useState(1);
  const [branchesPage, setBranchesPage] = useState(1);
  const [countriesPage, setCountriesPage] = useState(1);
  const [suppliersPage, setSuppliersPage] = useState(1);
  const [customersPage, setCustomersPage] = useState(1);
  const PAGE_SIZE = 10;

  // Track loaded tabs to eliminate slow and repetitive network roundtrips
  const loadedTabs = React.useRef<Set<string>>(new Set());

  const fetchTabData = async (tab: string, force = false) => {
    if (!force && loadedTabs.current.has(tab)) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (tab === "brands") {
        const brandsData = await settingsService.getBrands().catch(() => []);
        setBrands((brandsData as BrandItem[]) ?? []);
      } else if (tab === "branches") {
        const branchesData = await settingsService.getBranches().catch(() => []);
        setBranches(Array.isArray(branchesData) ? (branchesData as BranchItem[]) : []);
      } else if (tab === "countries") {
        const countriesData = await settingsService.getCountries().catch(() => []);
        if (Array.isArray(countriesData)) {
          setCountries(countriesData);
        }
      } else if (tab === "profile" || tab === "companyprofile") {
        const profilesData = await settingsService.getCompanyProfiles().catch(() => []);
        if (Array.isArray(profilesData)) {
          setCompanyProfiles(profilesData as CompanyProfileItem[]);
          if (!selectedProfileId && profilesData[0]?.id) {
            setSelectedProfileId(profilesData[0].id);
          }
        }
      } else if (tab === "suppliers") {
        const [suppliersData, customersData] = await Promise.all([
          settingsService.getSuppliers().catch(() => []),
          customerService.list().catch(() => []),
        ]);

        setSuppliers(
          Array.isArray(suppliersData) ? (suppliersData as SupplierItem[]) : []
        );

        setCustomers(
          Array.isArray(customersData)
            ? customersData.map((c: any) => ({
                id: c.id,
                name: c.name,
                gender: c.gender || "Female",
                dob: c.dob ? new Date(c.dob).toLocaleDateString() : "",
                idCard: c.idCard || "",
                address: c.address || "",
                job: c.job || "N/A",
                phone: c.phone || "",
                email: c.email || "",
                note: c.note || "",
              }))
            : []
        );
      }
      loadedTabs.current.add(tab);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchAll = async () => {
    await fetchTabData(currentTab, true);
  };

  useEffect(() => {
    fetchTabData(currentTab);
  }, [currentTab]);

  // Handle Add Brand
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setSubmitting(true);
    try {
      await settingsService.createBrand({ name: newBrandName.trim().toUpperCase() });
      setNewBrandName("");
      setIsAddBrandOpen(false);
      await fetchAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create brand");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;
    setSubmitting(true);
    try {
      const res = await settingsService
        .createBranch({
          name: branchName.trim().toUpperCase(),
          address: branchAddress.trim(),
          phone1: branchPhone.trim(),
        })
        .catch(() => null);

      const created: BranchItem = (res as BranchItem) || {
        id: String(Date.now()),
        name: branchName.trim().toUpperCase(),
        address: branchAddress.trim(),
        phone1: branchPhone.trim(),
        phone2: branchPhone2.trim(),
        note: branchNote.trim(),
      };
      setBranches((prev) => [...prev, created]);
      setBranchName("");
      setBranchAddress("");
      setBranchPhone("");
      setBranchPhone2("");
      setBranchNote("");
      setIsAddBranchOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create branch");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Update Branch
  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !editBranchName.trim()) return;
    setSubmitting(true);
    try {
      if (editingBranch.id && editingBranch.id.length > 10) {
        await settingsService
          .updateBranch(editingBranch.id, {
            name: editBranchName.trim().toUpperCase(),
            address: editBranchAddress.trim(),
            phone1: editBranchPhone1.trim(),
          })
          .catch(() => null);
      }
      setBranches((prev) =>
        prev.map((b) =>
          b.id === editingBranch.id
            ? {
                ...b,
                name: editBranchName.trim().toUpperCase(),
                address: editBranchAddress.trim(),
                phone1: editBranchPhone1.trim(),
                phone2: editBranchPhone2.trim(),
                note: editBranchNote.trim(),
              }
            : b
        )
      );
      setEditingBranch(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update branch");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Country
  const handleCreateCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountryName.trim()) return;
    setSubmitting(true);
    try {
      await settingsService.createCountry(newCountryName.trim().toUpperCase());
      setNewCountryName("");
      setIsAddCountryOpen(false);
      await fetchAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create country");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Country
  const handleUpdateCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCountry || !editCountryName.trim()) return;
    setSubmitting(true);
    try {
      await settingsService.updateCountry(editingCountry.id, editCountryName.trim().toUpperCase());
      setEditingCountry(null);
      setEditCountryName("");
      await fetchAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update country");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {feedback && (
        <div
          className={`p-3 rounded text-xs flex items-center justify-between shadow-xs border transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-red-50 border-red-300 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer ml-3"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* ───────────────────────────────────────────────────────────
          SYSTEM USERS LIST (when tab === "users")
      ───────────────────────────────────────────────────────────── */}
      {currentTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#e9ecef] border border-slate-200/70 text-xs rounded text-slate-600">
            <div className="bg-[#0284c7] text-white p-1 rounded-xs">
              <TableProperties className="h-3.5 w-3.5" />
            </div>
            <Link href="/" className="text-[#1c64f2] hover:underline font-medium">
              Dashboard
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-600">General setting</span>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-600">System Users</span>
          </div>

          <UsersManagement />
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          1. CAR BRAND LIST (when tab === "brands")
      ───────────────────────────────────────────────────────────── */}
      {currentTab === "brands" && (
        <div className="space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#e9ecef] border border-slate-200/70 text-xs rounded text-slate-600">
            <div className="bg-[#0284c7] text-white p-1 rounded-xs">
              <TableProperties className="h-3.5 w-3.5" />
            </div>
            <Link href="/" className="text-[#1c64f2] hover:underline font-medium">
              Dashboard
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-600">Car brand</span>
          </div>

          {/* Page Heading */}
          <div>
            <h1 className="text-[22px] font-bold text-slate-800 tracking-tight leading-tight">
              Car brand list
            </h1>
          </div>

          {/* Add Brand Action Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsAddBrandOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#1c64f2] hover:bg-[#1a56db] text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add brand</span>
            </button>
          </div>

          {/* Subtitle */}
          <p className="text-[12px] text-slate-500 mt-2">
            costomize and view brand list
          </p>

          {/* Table */}
          <div className="bg-white rounded border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-20">#No</th>
                  <th className="py-2.5 px-4">Brand name</th>
                  <th className="py-2.5 px-4 w-24">Other</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {brands.length > 0 ? (
                  brands
                    .slice((brandsPage - 1) * PAGE_SIZE, brandsPage * PAGE_SIZE)
                    .map((brand, idx) => (
                      <tr key={brand.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          {(brandsPage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-medium uppercase text-slate-800">
                          {brand.name}
                        </td>
                        <td className="py-2.5 px-4">
                          <button
                            type="button"
                            className="bg-[#0284c7] hover:bg-[#0369a1] text-white p-1 rounded-xs cursor-pointer transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                ) : (
                  <>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">1</td>
                      <td className="py-2.5 px-4 font-medium uppercase text-slate-800">MHERO</td>
                      <td className="py-2.5 px-4">
                        <button type="button" className="bg-[#0284c7] text-white p-1 rounded-xs">
                          <Edit className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">2</td>
                      <td className="py-2.5 px-4 font-medium uppercase text-slate-800">VOYAH</td>
                      <td className="py-2.5 px-4">
                        <button type="button" className="bg-[#0284c7] text-white p-1 rounded-xs">
                          <Edit className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            <TablePagination
              currentPage={brandsPage}
              totalItems={brands.length}
              pageSize={PAGE_SIZE}
              onPageChange={setBrandsPage}
            />
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          2. BRANCH LIST & BRANCH EDIT (when tab === "branches")
      ───────────────────────────────────────────────────────────── */}
      {currentTab === "branches" && (
        <div className="space-y-4">
          {editingBranch ? (
            /* ─────────────────────────────────────────────
               2B. BRANCH EDIT (Screenshot 2)
            ───────────────────────────────────────────── */
            <div className="space-y-4">
              {/* Breadcrumb: Dashboard > branch > branch edit */}
              <div className="flex items-center gap-2 px-3.5 py-2 bg-[#e9ecef] border border-slate-200/70 text-xs rounded text-slate-600">
                <div className="bg-[#0284c7] text-white p-1 rounded-xs">
                  <TableProperties className="h-3.5 w-3.5" />
                </div>
                <Link href="/" className="text-[#1c64f2] hover:underline font-medium">
                  Dashboard
                </Link>
                <span className="text-slate-400">&gt;</span>
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="text-[#1c64f2] hover:underline font-medium cursor-pointer"
                >
                  branch
                </button>
                <span className="text-slate-400">&gt;</span>
                <span className="text-slate-600">branch edit</span>
              </div>

              {/* Form Card */}
              <div className="bg-white rounded border border-slate-200 shadow-xs p-6 max-w-4xl">
                <form onSubmit={handleUpdateBranch} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      value={editBranchName}
                      onChange={(e) => setEditBranchName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editBranchAddress}
                      onChange={(e) => setEditBranchAddress(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone 1
                    </label>
                    <input
                      type="text"
                      value={editBranchPhone1}
                      onChange={(e) => setEditBranchPhone1(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone 2
                    </label>
                    <input
                      type="text"
                      value={editBranchPhone2}
                      onChange={(e) => setEditBranchPhone2(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Note
                    </label>
                    <input
                      type="text"
                      value={editBranchNote}
                      onChange={(e) => setEditBranchNote(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#1c64f2] hover:bg-[#1a56db] text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>Update</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* ─────────────────────────────────────────────
               2A. BRANCH LIST (Screenshot 1)
            ───────────────────────────────────────────── */
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-[#e9ecef] border border-slate-200/70 text-xs rounded text-slate-600">
                <div className="bg-[#0284c7] text-white p-1 rounded-xs">
                  <TableProperties className="h-3.5 w-3.5" />
                </div>
                <Link href="/" className="text-[#1c64f2] hover:underline font-medium">
                  Dashboard
                </Link>
                <span className="text-slate-400">&gt;</span>
                <span className="text-slate-600">Branch</span>
              </div>

              <div>
                <h1 className="text-[22px] font-bold text-slate-800 tracking-tight leading-tight">
                  Branch list
                </h1>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#1c64f2] hover:bg-[#1a56db] text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add branch</span>
                </button>
              </div>

              <p className="text-[12px] text-slate-500 mt-2">Branch list</p>

              <div className="bg-white rounded border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafc] text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 w-14">#No</th>
                      <th className="py-2.5 px-4">Branch name</th>
                      <th className="py-2.5 px-4">Address</th>
                      <th className="py-2.5 px-4">Phone 1</th>
                      <th className="py-2.5 px-4">Phone 2</th>
                      <th className="py-2.5 px-4">Note</th>
                      <th className="py-2.5 px-4 w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {branches
                      .slice((branchesPage - 1) * PAGE_SIZE, branchesPage * PAGE_SIZE)
                      .map((b, idx) => (
                        <tr key={b.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-semibold text-slate-800">
                            {(branchesPage - 1) * PAGE_SIZE + idx + 1}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800 uppercase">
                            {b.name}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">{b.address || ""}</td>
                          <td className="py-2.5 px-4 text-slate-600">{b.phone1 || ""}</td>
                          <td className="py-2.5 px-4 text-slate-600">{b.phone2 || ""}</td>
                          <td className="py-2.5 px-4 text-slate-500">{b.note || ""}</td>
                          <td className="py-2.5 px-4">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBranch(b);
                                setEditBranchName(b.name);
                                setEditBranchAddress(b.address || "");
                                setEditBranchPhone1(b.phone1 || "");
                                setEditBranchPhone2(b.phone2 || "");
                                setEditBranchNote(b.note || "");
                              }}
                              className="bg-[#0284c7] hover:bg-[#0369a1] text-white p-1 rounded-xs cursor-pointer transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                <TablePagination
                  currentPage={branchesPage}
                  totalItems={branches.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setBranchesPage}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          3. COUNTRY LIST (when tab === "countries")
      ───────────────────────────────────────────────────────────── */}
      {currentTab === "countries" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#e9ecef] border border-slate-200/70 text-xs rounded text-slate-600">
            <div className="bg-[#0284c7] text-white p-1 rounded-xs">
              <TableProperties className="h-3.5 w-3.5" />
            </div>
            <Link href="/" className="text-[#1c64f2] hover:underline font-medium">
              Dashboard
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-600">Country</span>
          </div>

          <div>
            <h1 className="text-[22px] font-bold text-slate-800 tracking-tight leading-tight">
              Country list
            </h1>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsAddCountryOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#1c64f2] hover:bg-[#1a56db] text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add country</span>
            </button>
          </div>

          <p className="text-[12px] text-slate-500 mt-2">
            costomize and view country list
          </p>

          <div className="bg-white rounded border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-20">#No</th>
                  <th className="py-2.5 px-4">Country name</th>
                  <th className="py-2.5 px-4 w-24">Other</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {countries
                  .slice((countriesPage - 1) * PAGE_SIZE, countriesPage * PAGE_SIZE)
                  .map((country, idx) => (
                    <tr key={country.id || country.name} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {(countriesPage - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-semibold uppercase text-slate-800">
                        {country.name}
                      </td>
                      <td className="py-2.5 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCountry(country);
                            setEditCountryName(country.name);
                          }}
                          className="bg-[#0284c7] hover:bg-[#0369a1] text-white p-1 rounded-xs cursor-pointer transition-colors"
                          title="Edit country"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            <TablePagination
              currentPage={countriesPage}
              totalItems={countries.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCountriesPage}
            />
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          4. COMPANY PROFILE (when tab === "profile" or "companyprofile")
      ───────────────────────────────────────────────────────────── */}
      {(currentTab === "profile" || currentTab === "companyprofile") && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#e9ecef] border border-slate-200/70 text-xs rounded text-slate-600">
            <div className="bg-[#0284c7] text-white p-1 rounded-xs">
              <TableProperties className="h-3.5 w-3.5" />
            </div>
            <Link href="/" className="text-[#1c64f2] hover:underline font-medium">
              Dashboard
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-600">Company Profile</span>
          </div>

          <div>
            <h1 className="text-[22px] font-bold text-slate-800 tracking-tight leading-tight">
              Company Profile for invoice printing
            </h1>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Add information for company
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsAddProfileOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#1c64f2] hover:bg-[#1a56db] text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add company profile</span>
            </button>
          </div>

          <div className="bg-white rounded border border-slate-200 shadow-xs p-5 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Select Profile
              </label>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full max-w-sm px-3 py-1.5 text-xs border rounded border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-[#1c64f2]"
              >
                <option value="">-- Select Profile --</option>
                {companyProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 w-12 font-semibold">#</th>
                    <th className="py-2.5 px-4 font-semibold">Name</th>
                    <th className="py-2.5 px-4 font-semibold">Gender</th>
                    <th className="py-2.5 px-4 font-semibold">DateOfBirth</th>
                    <th className="py-2.5 px-4 font-semibold">Phone</th>
                    <th className="py-2.5 px-4 font-semibold">Job</th>
                    <th className="py-2.5 px-4 font-semibold">Email</th>
                    <th className="py-2.5 px-4 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {companyProfiles
                    .filter((p) => !selectedProfileId || p.id === selectedProfileId)
                    .map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 text-slate-600">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{p.name}</td>
                        <td className="py-2.5 px-4 text-slate-600">{p.gender || "-"}</td>
                        <td className="py-2.5 px-4 text-slate-600">{p.dob || "-"}</td>
                        <td className="py-2.5 px-4 text-slate-600">{p.phone || "-"}</td>
                        <td className="py-2.5 px-4 text-slate-600">{p.job || "-"}</td>
                        <td className="py-2.5 px-4 text-slate-600">{p.email || "-"}</td>
                        <td className="py-2.5 px-4 text-slate-500">{p.note || "-"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          5. SUPPLIER & CUSTOMER LIST (when tab === "suppliers")
      ───────────────────────────────────────────────────────────── */}
      {/* ───────────────────────────────────────────────────────────
          5. SUPPLIER & CUSTOMER LIST (when tab === "suppliers")
      ───────────────────────────────────────────────────────────── */}
      {currentTab === "suppliers" && (
        <div className="space-y-3 w-full bg-white pb-10">
          {/* Breadcrumb matching legacy Bootstrap 3 */}
          <div className="flex items-center gap-1.5 px-4 py-2 bg-[#f5f5f5] border border-[#e3e3e3] rounded text-[13px] text-[#777]">
            <TableProperties className="h-4 w-4 text-[#337ab7]" />
            <Link href="/" className="text-[#337ab7] hover:underline font-normal">
              Dashboard
            </Link>
            <span className="text-[#ccc]">&gt;</span>
            <span className="text-[#777]">Supplier and Customer</span>
          </div>

          {/* Heading and subtitle */}
          <div className="pt-2">
            <h1 className="text-[26px] font-bold text-[#333] tracking-tight leading-tight">
              Supplier & Customer
            </h1>
            <p className="text-[12px] text-[#777] mt-0.5">view and manage people</p>
          </div>

          {/* Classic Bootstrap Nav-Tabs */}
          <div className="border-b border-[#ddd] flex items-center pt-2">
            <button
              type="button"
              onClick={() => setPeopleSubTab("supplier")}
              className={`px-4 py-2.5 text-[14px] font-normal cursor-pointer border-t border-x rounded-t transition-colors ${
                peopleSubTab === "supplier"
                  ? "bg-white border-[#ddd] text-[#555] -mb-px border-b-white z-10"
                  : "bg-transparent border-transparent text-[#337ab7] hover:bg-[#eee] hover:border-[#ddd]"
              }`}
            >
              Supplier
            </button>
            <button
              type="button"
              onClick={() => setPeopleSubTab("customer")}
              className={`px-4 py-2.5 text-[14px] font-normal cursor-pointer border-t border-x rounded-t transition-colors ${
                peopleSubTab === "customer"
                  ? "bg-white border-[#ddd] text-[#555] -mb-px border-b-white z-10"
                  : "bg-transparent border-transparent text-[#337ab7] hover:bg-[#eee] hover:border-[#ddd]"
              }`}
            >
              Customer
            </button>
          </div>

          {/* Sub-heading */}
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-[18px] font-bold text-[#333]">
              {peopleSubTab === "supplier" ? "Supplier list" : "Customer list"}
            </h3>
            {peopleSubTab === "supplier" && (
              <button
                type="button"
                onClick={() => {
                  setEditingSupplier(null);
                  setSupplierNameEn("");
                  setSupplierNameKh("");
                  setSupplierCategory("VEHICLE");
                  setSupplierJob("");
                  setSupplierCountry("CAMBODIA");
                  setSupplierPhone("");
                  setSupplierPhone2("");
                  setSupplierEmail("");
                  setSupplierWebsite("");
                  setSupplierAddress("");
                  setSupplierNote("");
                  setIsAddSupplierOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Supplier</span>
              </button>
            )}
          </div>

          {/* Filter Inputs matching Bootstrap form-control */}
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <div>
              <label className="block text-[13px] font-bold text-[#333] mb-1">
                Supplier Name(kh)
              </label>
              <input
                type="text"
                placeholder="name"
                value={searchName}
                onChange={(e) => {
                  setSearchName(e.target.value);
                  setSuppliersPage(1);
                  setCustomersPage(1);
                }}
                className="h-[34px] w-[220px] px-3 py-1.5 text-[14px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#333] mb-1">
                Phone
              </label>
              <input
                type="text"
                placeholder="phone number"
                value={searchPhone}
                onChange={(e) => {
                  setSearchPhone(e.target.value);
                  setSuppliersPage(1);
                  setCustomersPage(1);
                }}
                className="h-[34px] w-[220px] px-3 py-1.5 text-[14px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
              />
            </div>
          </div>

          {/* Supplier Table matching Screenshot 111117 */}
          {peopleSubTab === "supplier" && (() => {
            const filteredSuppliers = suppliers
              .filter((s) =>
                searchName ? s.nameEn.toLowerCase().includes(searchName.toLowerCase()) : true
              )
              .filter((s) =>
                searchPhone && s.phone ? s.phone.includes(searchPhone) : true
              );
            const paginatedSuppliers = filteredSuppliers.slice(
              (suppliersPage - 1) * PAGE_SIZE,
              suppliersPage * PAGE_SIZE
            );

            return (
              <div className="overflow-x-auto pt-3 space-y-2">
                <table className="w-full text-left text-[13px] text-[#333] border-collapse">
                  <thead className="border-t border-b-2 border-[#ddd] text-[#333] font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Gender</th>
                      <th className="py-2.5 px-3">Specialization</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Country</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Linked Records</th>
                      <th className="py-2.5 px-3 w-24 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7eaec]">
                    {paginatedSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400">
                          No suppliers found
                        </td>
                      </tr>
                    ) : (
                      paginatedSuppliers.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-[#f9f9f9] transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[#333]">
                            {(suppliersPage - 1) * PAGE_SIZE + idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-[#333]">{s.nameEn}</td>
                          <td className="py-2.5 px-3 text-[#333]">{s.gender || "male"}</td>
                          <td className="py-2.5 px-3 text-[#333] font-medium">
                            {s.job ? (
                              <span className="text-[#333]">{s.job}</span>
                            ) : (
                              <span className="text-slate-400 italic">General</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[#333]">{s.phone || "N/A"}</td>
                          <td className="py-2.5 px-3 text-[#333]">{s.email || ""}</td>
                          <td className="py-2.5 px-3 uppercase text-[#333] font-normal">
                            {s.country || "CAMBODIA"}
                          </td>
                          <td className="py-2.5 px-3">
                            {s.category === "VEHICLE" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                🚗 VEHICLE
                              </span>
                            )}
                            {s.category === "SPARE_PARTS" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                🔩 SPARE PARTS
                              </span>
                            )}
                            {s.category === "ACCESSORIES" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                ✨ ACCESSORIES
                              </span>
                            )}
                            {s.category === "REPAIR" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                🔧 REPAIR
                              </span>
                            )}
                            {s.category === "LOGISTICS" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                                🚢 LOGISTICS
                              </span>
                            )}
                            {s.category === "CUSTOMS" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                📑 CUSTOMS
                              </span>
                            )}
                            {s.category === "INSURANCE" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                                🛡️ INSURANCE
                              </span>
                            )}
                            {s.category === "OTHER" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                📦 OTHER
                              </span>
                            )}
                            {!["VEHICLE", "SPARE_PARTS", "ACCESSORIES", "REPAIR", "LOGISTICS", "CUSTOMS", "INSURANCE", "OTHER"].includes(s.category) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                                {s.category}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {((s._count?.vehicles ?? 0) > 0 || (s._count?.bills ?? 0) > 0) ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                                title={`Linked: ${s._count?.vehicles ?? 0} vehicles, ${s._count?.bills ?? 0} bills`}
                              >
                                <span>🚗 {s._count?.vehicles ?? 0}</span>
                                <span>🧾 {s._count?.bills ?? 0}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] text-slate-400 bg-slate-50 border border-slate-200">
                                0 linked
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingSupplier(s)}
                                className="p-1 px-1.5 border border-[#ccc] rounded bg-white text-[#333] hover:bg-[#e6e6e6] shadow-xs cursor-pointer inline-flex items-center justify-center transition-colors"
                                title="View details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSupplier(s);
                                  setSupplierNameEn(s.nameEn || "");
                                  setSupplierNameKh(s.nameKh || "");
                                  setSupplierCategory(
                                    (s.category as any) || "VEHICLE"
                                  );
                                  setSupplierJob(s.job || "");
                                  setSupplierCountry(s.country || "CAMBODIA");
                                  setSupplierPhone(s.phone || "");
                                  setSupplierPhone2(s.phone2 || "");
                                  setSupplierEmail(s.email || "");
                                  setSupplierWebsite(s.website || "");
                                  setSupplierAddress(s.address || "");
                                  setSupplierNote(s.note || "");
                                  setIsAddSupplierOpen(true);
                                }}
                                className="p-1 px-1.5 border border-[#ccc] rounded bg-white text-blue-600 hover:bg-[#e6e6e6] shadow-xs cursor-pointer inline-flex items-center justify-center transition-colors"
                                title="Edit supplier"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTargetSupplier(s)}
                                className="p-1 px-1.5 border border-[#ccc] rounded bg-white text-destructive hover:bg-destructive/10 shadow-xs cursor-pointer inline-flex items-center justify-center transition-colors"
                                title="Delete supplier"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <TablePagination
                  currentPage={suppliersPage}
                  totalItems={filteredSuppliers.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setSuppliersPage}
                />
              </div>
            );
          })()}

          {/* Customer Table matching Screenshot 111120 */}
          {peopleSubTab === "customer" && (() => {
            const filteredCustomers = customers
              .filter((c) =>
                searchName ? c.name.toLowerCase().includes(searchName.toLowerCase()) : true
              )
              .filter((c) =>
                searchPhone && c.phone ? c.phone.includes(searchPhone) : true
              );
            const paginatedCustomers = filteredCustomers.slice(
              (customersPage - 1) * PAGE_SIZE,
              customersPage * PAGE_SIZE
            );

            return (
              <div className="overflow-x-auto pt-3 space-y-2">
                <table className="w-full text-left text-[13px] text-[#333] border-collapse">
                  <thead className="border-t border-b-2 border-[#ddd] text-[#333] font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-10">#</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Gender</th>
                      <th className="py-2.5 px-3">DateOfBirth</th>
                      <th className="py-2.5 px-3">IDCard</th>
                      <th className="py-2.5 px-3">Address</th>
                      <th className="py-2.5 px-3">Job</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Note</th>
                      <th className="py-2.5 px-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7eaec]">
                    {paginatedCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-slate-400">
                          No customers found
                        </td>
                      </tr>
                    ) : (
                      paginatedCustomers.map((c, idx) => (
                        <tr key={c.id} className="hover:bg-[#f9f9f9] transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[#333]">
                            {(customersPage - 1) * PAGE_SIZE + idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-[#333]">{c.name}</td>
                          <td className="py-2.5 px-3 text-[#333]">{c.gender || "Female"}</td>
                          <td className="py-2.5 px-3 text-[#333]">{c.dob || ""}</td>
                          <td className="py-2.5 px-3 text-[#333]">{c.idCard || ""}</td>
                          <td className="py-2.5 px-3 text-[#333] leading-relaxed">
                            {c.address || ""}
                          </td>
                          <td className="py-2.5 px-3 text-[#333]">{c.job || "N/A"}</td>
                          <td className="py-2.5 px-3 text-[#333]">{c.phone}</td>
                          <td className="py-2.5 px-3 text-[#333]">{c.email || ""}</td>
                          <td className="py-2.5 px-3 text-[#333]">{c.note || ""}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setViewingCustomer(c)}
                              className="p-1 px-2 border border-[#ccc] rounded bg-white text-[#333] hover:bg-[#e6e6e6] shadow-xs cursor-pointer inline-flex items-center justify-center transition-colors"
                              title="View details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <TablePagination
                  currentPage={customersPage}
                  totalItems={filteredCustomers.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCustomersPage}
                />
              </div>
            );
          })()}

          {/* Update Customer Modal matching user's screenshot media_1790327863897.png */}
          {viewingCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
              <div className="bg-white rounded shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-300 my-8">
                {/* Modal Header */}
                <div className="bg-[#112d59] text-white px-5 py-3 flex items-center justify-between">
                  <h3 className="text-base font-bold tracking-wide">Update customer</h3>
                  <button
                    type="button"
                    onClick={() => setViewingCustomer(null)}
                    className="text-white/70 hover:text-white cursor-pointer text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>

                {/* Modal Body */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!viewingCustomer) return;
                    setSubmitting(true);
                    try {
                      await customerService.update(viewingCustomer.id, {
                        name: viewingCustomer.name,
                        gender: viewingCustomer.gender || undefined,
                        dob: viewingCustomer.dob || undefined,
                        idCard: viewingCustomer.idCard || undefined,
                        address: viewingCustomer.address || undefined,
                        job: viewingCustomer.job || undefined,
                        phone: viewingCustomer.phone,
                        email: viewingCustomer.email || undefined,
                        note: viewingCustomer.note || undefined,
                      });
                      setCustomers((prev) =>
                        prev.map((c) => (c.id === viewingCustomer.id ? viewingCustomer : c))
                      );
                      setViewingCustomer(null);
                    } catch (err: unknown) {
                      alert(err instanceof Error ? err.message : "Failed to update customer");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="p-6 space-y-4 text-xs text-[#333]"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* English name */}
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        English name
                      </label>
                      <input
                        type="text"
                        value={viewingCustomer.name}
                        onChange={(e) =>
                          setViewingCustomer({ ...viewingCustomer, name: e.target.value })
                        }
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>

                    {/* Khmer name */}
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Khmer name
                      </label>
                      <input
                        type="text"
                        value={viewingCustomer.name}
                        onChange={(e) =>
                          setViewingCustomer({ ...viewingCustomer, name: e.target.value })
                        }
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>

                    {/* Date of birth */}
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Date of birth
                      </label>
                      <input
                        type="text"
                        value={viewingCustomer.dob || "03/04/1969"}
                        onChange={(e) =>
                          setViewingCustomer({ ...viewingCustomer, dob: e.target.value })
                        }
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>

                    {/* Job */}
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Job
                      </label>
                      <input
                        type="text"
                        value={viewingCustomer.job || "Customer"}
                        onChange={(e) =>
                          setViewingCustomer({ ...viewingCustomer, job: e.target.value })
                        }
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Gender
                      </label>
                      <select
                        value={viewingCustomer.gender || "Male"}
                        onChange={(e) =>
                          setViewingCustomer({ ...viewingCustomer, gender: e.target.value })
                        }
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] bg-white text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        value={viewingCustomer.address || ""}
                        onChange={(e) =>
                          setViewingCustomer({ ...viewingCustomer, address: e.target.value })
                        }
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>

                    {/* ID card */}
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        ID card
                      </label>
                      <input
                        type="text"
                        value={viewingCustomer.idCard || ""}
                        onChange={(e) =>
                          setViewingCustomer({ ...viewingCustomer, idCard: e.target.value })
                        }
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>

                    {/* Phone number */}
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Phone number
                      </label>
                      <input
                        type="text"
                        value={viewingCustomer.phone || ""}
                        onChange={(e) =>
                          setViewingCustomer({ ...viewingCustomer, phone: e.target.value })
                        }
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="Ex. cusname@example.com"
                        value={viewingCustomer.email || ""}
                        onChange={(e) =>
                          setViewingCustomer({ ...viewingCustomer, email: e.target.value })
                        }
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>

                    {/* Note */}
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Note
                      </label>
                      <textarea
                        rows={2}
                        placeholder="some note for customer"
                        value={viewingCustomer.note || ""}
                        onChange={(e) =>
                          setViewingCustomer({ ...viewingCustomer, note: e.target.value })
                        }
                        className="w-full p-2 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>
                  </div>

                  {/* Change Image cover */}
                  <div className="pt-2">
                    <label className="block text-[12px] font-semibold text-[#555] mb-1">
                      Change Image cover
                    </label>
                    <div className="w-[180px] h-[120px] bg-[#f5f5f5] border border-[#ddd] rounded flex items-center justify-center text-[12px] text-slate-400 overflow-hidden relative mb-2">
                      <div className="p-2 text-center text-slate-500">
                        <TableProperties className="h-8 w-8 mx-auto mb-1 text-slate-400" />
                        <span className="text-[10px]">ID Card Preview</span>
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#d9534f] hover:bg-[#c9302c] text-white rounded text-[12px] font-medium cursor-pointer shadow-xs transition-colors">
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Select image</span>
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                  </div>

                  {/* Modal Footer Buttons */}
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setViewingCustomer(null)}
                      className="px-4 py-1.5 text-xs font-medium text-[#333] bg-white border border-[#ccc] rounded hover:bg-[#e6e6e6] shadow-xs cursor-pointer transition-colors"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#337ab7] hover:bg-[#286090] rounded shadow-xs cursor-pointer transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Save</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Viewing Supplier Modal */}
          {viewingSupplier && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-md shadow-xl w-full max-w-lg overflow-hidden border border-slate-300">
                <div className="bg-[#112d59] text-white px-4 py-2.5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Supplier Details</h3>
                  <button
                    type="button"
                    onClick={() => setViewingSupplier(null)}
                    className="text-white/80 hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-5 space-y-3 text-xs text-slate-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-semibold text-slate-500">Name (EN):</span>{" "}
                      {viewingSupplier.nameEn}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Name (KH):</span>{" "}
                      {viewingSupplier.nameKh || "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Country:</span>{" "}
                      {viewingSupplier.country || "CHINA"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Category:</span>{" "}
                      {viewingSupplier.category}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Phone 1:</span>{" "}
                      {viewingSupplier.phone || "N/A"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Phone 2:</span>{" "}
                      {viewingSupplier.phone2 || "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Email:</span>{" "}
                      {viewingSupplier.email || "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Website:</span>{" "}
                      {viewingSupplier.website ? (
                        <a
                          href={viewingSupplier.website.startsWith("http") ? viewingSupplier.website : `https://${viewingSupplier.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {viewingSupplier.website}
                        </a>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Specialization:</span>{" "}
                      {viewingSupplier.job || "General"}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Address:</span>{" "}
                    {viewingSupplier.address || "—"}
                  </div>
                  {viewingSupplier.note && (
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                      <span className="font-semibold text-slate-500 block mb-0.5">Note:</span>
                      <p className="text-slate-600 whitespace-pre-wrap">{viewingSupplier.note}</p>
                    </div>
                  )}
                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setViewingSupplier(null)}
                      className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Supplier Confirmation / Constraint Dialog */}
          {deleteTargetSupplier && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                <div
                  className={`px-5 py-3 text-white flex items-center justify-between ${
                    (deleteTargetSupplier._count?.vehicles ?? 0) > 0 ||
                    (deleteTargetSupplier._count?.bills ?? 0) > 0
                      ? "bg-[#b45309]"
                      : "bg-[#b91c1c]"
                  }`}
                >
                  <h3 className="text-sm font-bold tracking-wide flex items-center gap-2">
                    {(deleteTargetSupplier._count?.vehicles ?? 0) > 0 ||
                    (deleteTargetSupplier._count?.bills ?? 0) > 0 ? (
                      <>
                        <AlertCircle className="h-4 w-4" />
                        <span>មិនអាចលុបក្រុមហ៊ុនផ្គត់ផ្គង់បានទេ</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span>បញ្ជាក់ការលុបក្រុមហ៊ុនផ្គត់ផ្គង់</span>
                      </>
                    )}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetSupplier(null)}
                    className="text-white/80 hover:text-white cursor-pointer text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs text-slate-700">
                  {(deleteTargetSupplier._count?.vehicles ?? 0) > 0 ||
                  (deleteTargetSupplier._count?.bills ?? 0) > 0 ? (
                    <div className="space-y-3">
                      <p className="leading-relaxed text-[13px]">
                        ក្រុមហ៊ុនផ្គត់ផ្គង់{" "}
                        <strong className="text-slate-900 font-bold">
                          &quot;{deleteTargetSupplier.nameEn}&quot;
                        </strong>{" "}
                        មិនអាចលុបបានទេ ដោយសារមានទិន្នន័យប្រតិបត្តិការកំពុងភ្ជាប់ជាមួយ៖
                      </p>
                      <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-900 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span>🚗 ចំនួនរថយន្តភ្ជាប់ជាមួយ៖</span>
                          <strong>{deleteTargetSupplier._count?.vehicles ?? 0} គ្រឿង</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>🧾 ចំនួនវិក្កយបត្រថ្លៃដើម៖</span>
                          <strong>{deleteTargetSupplier._count?.bills ?? 0} សន្លឹក</strong>
                        </div>
                      </div>
                      <p className="text-slate-500 italic text-[11px] leading-relaxed">
                        * ប្រព័ន្ធរក្សាទុកទិន្នន័យនេះដើម្បីកុំឱ្យបាត់បង់ប្រវត្តិថ្លៃដើមរថយន្ត (Data Integrity)។ ប្រសិនបើលោកអ្នកចង់លុប សូមប្តូររថយន្តទៅក្រុមហ៊ុនផ្គត់ផ្គង់ផ្សេងជាមុនសិន។
                      </p>
                      <div className="flex justify-end pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setDeleteTargetSupplier(null)}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-[#112d59] rounded hover:bg-[#112d59]/90 cursor-pointer"
                        >
                          យល់ព្រម (OK)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="leading-relaxed text-[13px]">
                        តើអ្នកពិតជាចង់លុបក្រុមហ៊ុនផ្គត់ផ្គង់{" "}
                        <strong className="text-slate-900 font-bold">
                          &quot;{deleteTargetSupplier.nameEn}&quot;
                        </strong>{" "}
                        នេះមែនទេ?
                      </p>
                      <p className="text-slate-500 leading-relaxed">
                        ក្រុមហ៊ុនផ្គត់ផ្គង់នេះមិនមានរថយន្ត ឬវិក្កយបត្រភ្ជាប់ជាមួយទេ ដូច្នេះលោកអ្នកអាចលុបបានដោយសុវត្ថិភាព។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
                      </p>
                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={isDeletingSupplier}
                          onClick={() => setDeleteTargetSupplier(null)}
                          className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                        >
                          បោះបង់ (Cancel)
                        </button>
                        <button
                          type="button"
                          disabled={isDeletingSupplier}
                          onClick={async () => {
                            try {
                              setIsDeletingSupplier(true);
                              await settingsService.deleteSupplier(deleteTargetSupplier.id);
                              setSuppliers((prev) =>
                                prev.filter((item) => item.id !== deleteTargetSupplier.id)
                              );
                              setFeedback({
                                type: "success",
                                message: `បានលុបក្រុមហ៊ុនផ្គត់ផ្គង់ "${deleteTargetSupplier.nameEn}" ដោយជោគជ័យ`,
                              });
                              setDeleteTargetSupplier(null);
                            } catch (err: unknown) {
                              setFeedback({
                                type: "error",
                                message:
                                  err instanceof Error
                                    ? err.message
                                    : "មិនអាចលុបក្រុមហ៊ុនផ្គត់ផ្គង់បានទេ",
                              });
                            } finally {
                              setIsDeletingSupplier(false);
                            }
                          }}
                          className="px-4 py-1.5 text-xs font-medium text-white bg-destructive hover:bg-destructive/90 rounded cursor-pointer inline-flex items-center gap-1.5"
                        >
                          {isDeletingSupplier && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          )}
                          <span>លុបចេញ (Delete)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Add / Edit Supplier Modal */}
          {isAddSupplierOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
              <div className="bg-white rounded shadow-2xl w-full max-w-xl overflow-hidden border border-slate-300 my-8">
                <div className="bg-[#112d59] text-white px-5 py-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-wide">
                    {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddSupplierOpen(false);
                      setEditingSupplier(null);
                    }}
                    className="text-white/80 hover:text-white cursor-pointer text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!supplierNameEn.trim()) return;
                    setSubmitting(true);
                    try {
                      if (editingSupplier) {
                        await settingsService.updateSupplier(editingSupplier.id, {
                          nameEn: supplierNameEn.trim(),
                          nameKh: supplierNameKh.trim() || undefined,
                          category: supplierCategory,
                          job: supplierJob.trim() || undefined,
                          country: supplierCountry.trim() || undefined,
                          phone: supplierPhone.trim() || undefined,
                          phone2: supplierPhone2.trim() || undefined,
                          email: supplierEmail.trim() || undefined,
                          website: supplierWebsite.trim() || undefined,
                          address: supplierAddress.trim() || undefined,
                          note: supplierNote.trim() || undefined,
                        });
                      } else {
                        await settingsService.createSupplier({
                          nameEn: supplierNameEn.trim(),
                          nameKh: supplierNameKh.trim() || undefined,
                          category: supplierCategory,
                          job: supplierJob.trim() || undefined,
                          country: supplierCountry.trim() || undefined,
                          phone: supplierPhone.trim() || undefined,
                          phone2: supplierPhone2.trim() || undefined,
                          email: supplierEmail.trim() || undefined,
                          website: supplierWebsite.trim() || undefined,
                          address: supplierAddress.trim() || undefined,
                          note: supplierNote.trim() || undefined,
                        });
                      }
                      const refreshed = await settingsService.getSuppliers();
                      setSuppliers(refreshed as SupplierItem[]);
                      setFeedback({
                        type: "success",
                        message: editingSupplier
                          ? `បានកែប្រែក្រុមហ៊ុនផ្គត់ផ្គង់ "${supplierNameEn.trim()}" ដោយជោគជ័យ`
                          : `បានបង្កើតក្រុមហ៊ុនផ្គត់ផ្គង់ថ្មី "${supplierNameEn.trim()}" ដោយជោគជ័យ`,
                      });
                      setIsAddSupplierOpen(false);
                      setEditingSupplier(null);
                    } catch (err: unknown) {
                      setFeedback({
                        type: "error",
                        message: err instanceof Error ? err.message : "មិនអាចរក្សាទុកក្រុមហ៊ុនផ្គត់ផ្គង់បានទេ",
                      });
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="p-6 space-y-3.5 text-xs text-[#333]"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Supplier Name (EN) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CHINA DONG FENG MOTOR"
                        value={supplierNameEn}
                        onChange={(e) => setSupplierNameEn(e.target.value)}
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Supplier Name (KH)
                      </label>
                      <input
                        type="text"
                        placeholder="ឈ្មោះជាភាសាខ្មែរ..."
                        value={supplierNameKh}
                        onChange={(e) => setSupplierNameKh(e.target.value)}
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Category / Type * (ប្រភេទអ្នកផ្គត់ផ្គង់)
                      </label>
                      <select
                        value={supplierCategory}
                        onChange={(e) =>
                          setSupplierCategory(
                            e.target.value as any
                          )
                        }
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] bg-white text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      >
                        <option value="VEHICLE">🚗 VEHICLE (រថយន្ត)</option>
                        <option value="SPARE_PARTS">🔩 SPARE PARTS (គ្រឿងបន្លាស់)</option>
                        <option value="ACCESSORIES">✨ ACCESSORIES (គ្រឿងតុបតែងបន្ថែម)</option>
                        <option value="REPAIR">🔧 REPAIR (យានដ្ឋានជួសជុល)</option>
                        <option value="LOGISTICS">🚢 LOGISTICS (ដឹកជញ្ជូន/កុងតឺន័រ)</option>
                        <option value="CUSTOMS">📑 CUSTOMS (ពន្ធគយ &amp; Clearance)</option>
                        <option value="INSURANCE">🛡️ INSURANCE (ក្រុមហ៊ុនធានារ៉ាប់រង)</option>
                        <option value="OTHER">📦 OTHER (សេវាកម្ម/អ្នកផ្គត់ផ្គង់ផ្សេងៗ)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Specialization / Sub-type (ជំនាញជាក់លាក់ / ចំណាត់ថ្នាក់រង)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. គ្រឿងម៉ាស៊ីន, ជាងថ្នាំ, សំបកកង់ &amp; អាគុយ..."
                        value={supplierJob}
                        onChange={(e) => setSupplierJob(e.target.value)}
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CAMBODIA, CHINA, THAILAND"
                        value={supplierCountry}
                        onChange={(e) => setSupplierCountry(e.target.value)}
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Phone 1
                      </label>
                      <input
                        type="text"
                        placeholder="Primary phone number..."
                        value={supplierPhone}
                        onChange={(e) => setSupplierPhone(e.target.value)}
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Phone 2
                      </label>
                      <input
                        type="text"
                        placeholder="Secondary phone number..."
                        value={supplierPhone2}
                        onChange={(e) => setSupplierPhone2(e.target.value)}
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. supplier@example.com"
                        value={supplierEmail}
                        onChange={(e) => setSupplierEmail(e.target.value)}
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Website
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. www.dongfeng.com"
                        value={supplierWebsite}
                        onChange={(e) => setSupplierWebsite(e.target.value)}
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-[#555] mb-1">
                        Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Wuhan, Hubei, China or Phnom Penh, Cambodia"
                        value={supplierAddress}
                        onChange={(e) => setSupplierAddress(e.target.value)}
                        className="w-full h-[34px] px-3 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#555] mb-1">
                      Note
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Additional details about this supplier..."
                      value={supplierNote}
                      onChange={(e) => setSupplierNote(e.target.value)}
                      className="w-full p-2 text-[13px] border rounded border-[#ccc] text-[#555] shadow-xs focus:outline-none focus:border-[#66afe9]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddSupplierOpen(false);
                        setEditingSupplier(null);
                      }}
                      className="px-4 py-1.5 text-xs font-medium text-[#333] bg-white border border-[#ccc] rounded hover:bg-[#e6e6e6] shadow-xs cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#337ab7] hover:bg-[#286090] rounded shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{submitting ? "Saving..." : editingSupplier ? "Save Changes" : "Create Supplier"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          MODAL: ADD COMPANY PROFILE
      ───────────────────────────────────────────────────────────── */}
      {isAddProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-lg overflow-hidden border border-slate-300">
            <div className="bg-[#112d59] text-white px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Add company profile</h3>
              <button
                type="button"
                onClick={() => setIsAddProfileOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!profileName.trim()) return;
                setSubmitting(true);
                try {
                  const created = await settingsService.createCompanyProfile({
                    name: profileName.trim().toUpperCase(),
                    gender: profileGender,
                    dob: profileDob || undefined,
                    phone: profilePhone || undefined,
                    job: profileJob || undefined,
                    email: profileEmail || undefined,
                    note: profileNote || undefined,
                  });
                  if (created) {
                    setCompanyProfiles((prev) => [...prev, created]);
                    setSelectedProfileId(created.id);
                  }
                  setProfileName("");
                  setProfilePhone("");
                  setProfileJob("");
                  setProfileEmail("");
                  setProfileNote("");
                  setIsAddProfileOpen(false);
                  await fetchAll();
                } catch (err: unknown) {
                  alert(err instanceof Error ? err.message : "Failed to create company profile");
                } finally {
                  setSubmitting(false);
                }
              }}
              className="p-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Profile Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. HENG HUY AUTO CARS CO., LTD"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={profileGender}
                    onChange={(e) => setProfileGender(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={profileDob}
                    onChange={(e) => setProfileDob(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 061 95 5555"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job / Position
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Manager"
                    value={profileJob}
                    onChange={(e) => setProfileJob(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. info@henghuy.com"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional notes for invoice profile..."
                  value={profileNote}
                  onChange={(e) => setProfileNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1c64f2] hover:bg-[#1a56db] rounded cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddProfileOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded cursor-pointer"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          MODAL: ADD CAR BRAND
      ───────────────────────────────────────────────────────────── */}
      {isAddBrandOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-md overflow-hidden border border-slate-300">
            <div className="bg-[#112d59] text-white px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Add car brand</h3>
              <button
                type="button"
                onClick={() => setIsAddBrandOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateBrand} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. VOYAH, MHERO"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1c64f2] hover:bg-[#1a56db] rounded"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddBrandOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          MODAL: ADD BRANCH (Screenshot 3)
      ───────────────────────────────────────────────────────────── */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-lg overflow-hidden border border-slate-300">
            <div className="bg-[#112d59] text-white px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Adding new branch</h3>
              <button
                type="button"
                onClick={() => setIsAddBranchOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateBranch} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  placeholder="Ex. PhnomPenh"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone 1
                </label>
                <input
                  type="text"
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone 2
                </label>
                <input
                  type="text"
                  value={branchPhone2}
                  onChange={(e) => setBranchPhone2(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note
                </label>
                <input
                  type="text"
                  value={branchNote}
                  onChange={(e) => setBranchNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#1c64f2] hover:bg-[#1a56db] rounded cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          MODAL: ADD COUNTRY
      ───────────────────────────────────────────────────────────── */}
      {isAddCountryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-md overflow-hidden border border-slate-300">
            <div className="bg-[#112d59] text-white px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Add Country</h3>
              <button
                type="button"
                onClick={() => setIsAddCountryOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCountry} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Country Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. CAMBODIA"
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1c64f2] hover:bg-[#1a56db] rounded cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddCountryOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded cursor-pointer"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          MODAL: EDIT COUNTRY
      ───────────────────────────────────────────────────────────── */}
      {editingCountry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-md overflow-hidden border border-slate-300">
            <div className="bg-[#112d59] text-white px-4 py-2.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Edit Country</h3>
              <button
                type="button"
                onClick={() => setEditingCountry(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateCountry} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Country Name *
                </label>
                <input
                  type="text"
                  value={editCountryName}
                  onChange={(e) => setEditCountryName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:border-[#1c64f2]"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#1c64f2] hover:bg-[#1a56db] rounded cursor-pointer"
                >
                  {submitting ? "Saving..." : "Update"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCountry(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded cursor-pointer"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
