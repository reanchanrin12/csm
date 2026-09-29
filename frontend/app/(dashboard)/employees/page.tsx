"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  LayoutGrid,
  Edit,
  AlertCircle,
  X,
} from "lucide-react";
import { employeeService } from "@/lib/api";
import type { EmployeeRole, SalaryPaymentSummary } from "@csm/contracts";

interface Employee {
  id: string;
  englishName: string;
  khmerName?: string | null;
  gender?: string | null;
  dob?: string | null;
  phone: string;
  email?: string | null;
  idCard?: string | null;
  address?: string | null;
  jobPosition?: string | null;
  role: EmployeeRole;
  salary: number;
  startWork?: string | null;
  branchId: string;
  branchName: string;
  note?: string | null;
  salesCount?: number;
}

interface BranchOption {
  id: string;
  name: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab: 'employee' (Employee info) or 'salary' (Salary payment)
  const [activeTab, setActiveTab] = useState<"employee" | "salary">("employee");

  // ─────────────────────────────────────────────
  // Employee Modal State (Create & Edit)
  // ─────────────────────────────────────────────
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Employee Form Fields (Exact Screenshot 3)
  const [englishName, setEnglishName] = useState("");
  const [khmerName, setKhmerName] = useState("");
  const [gender, setGender] = useState("Male");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [idCard, setIdCard] = useState("");
  const [address, setAddress] = useState("");
  const [jobPosition, setJobPosition] = useState("");
  const [salary, setSalary] = useState<number | "">("");
  const [startWork, setStartWork] = useState("");
  const [branchId, setBranchId] = useState("");
  const [note, setNote] = useState("");
  const [employeeSubmitting, setEmployeeSubmitting] = useState(false);
  const [employeeFormError, setEmployeeFormError] = useState<string | null>(null);

  // ─────────────────────────────────────────────
  // Salary Payment Modal State (Exact Screenshot 2)
  // ─────────────────────────────────────────────
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [actualSalaryMonth, setActualSalaryMonth] = useState<number | "">("");
  const [payStatus, setPayStatus] = useState("full payment");
  const [salaryDescription, setSalaryDescription] = useState("");
  const [salarySubmitting, setSalarySubmitting] = useState(false);
  const [salaryFormError, setSalaryFormError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, salaryRes] = await Promise.all([
        employeeService.list() as unknown as Promise<{ employees: Employee[]; branches: BranchOption[] }>,
        employeeService.getSalaryPayments().catch(() => [] as SalaryPaymentSummary[]),
      ]);
      setEmployees(empRes.employees ?? []);
      setBranches(empRes.branches ?? []);
      setSalaryPayments(salaryRes ?? []);
      if ((empRes.branches?.length ?? 0) > 0 && !branchId) {
        setBranchId(empRes.branches[0]?.id ?? "");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load employee records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Create Employee Modal
  const handleOpenCreateEmployee = () => {
    setEditingId(null);
    setEnglishName("");
    setKhmerName("");
    setGender("Male");
    setDob("");
    setPhone("");
    setEmail("");
    setIdCard("");
    setAddress("");
    setJobPosition("");
    setSalary("");
    setStartWork("");
    setBranchId(branches[0]?.id || "");
    setNote("");
    setEmployeeFormError(null);
    setIsEmployeeModalOpen(true);
  };

  // Open Edit Employee Modal
  const handleOpenEditEmployee = (emp: Employee) => {
    setEditingId(emp.id);
    setEnglishName(emp.englishName);
    setKhmerName(emp.khmerName || "");
    setGender(emp.gender || "Male");
    setDob(emp.dob || "");
    setPhone(emp.phone);
    setEmail(emp.email || "");
    setIdCard(emp.idCard || "");
    setAddress(emp.address || "");
    setJobPosition(emp.jobPosition || emp.role);
    setSalary(emp.salary);
    setStartWork(emp.startWork || "");
    setBranchId(emp.branchId);
    setNote(emp.note || "");
    setEmployeeFormError(null);
    setIsEmployeeModalOpen(true);
  };

  // Save Employee (Create or Update)
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeFormError(null);

    if (!englishName.trim()) {
      setEmployeeFormError("English name is required.");
      return;
    }
    if (!phone.trim()) {
      setEmployeeFormError("Phone number is required.");
      return;
    }
    if (!branchId) {
      setEmployeeFormError("Work place is required.");
      return;
    }
    if (salary === "" || Number(salary) < 0) {
      setEmployeeFormError("Actual salary is required.");
      return;
    }

    setEmployeeSubmitting(true);
    try {
      const payload = {
        englishName: englishName.trim(),
        khmerName: khmerName.trim() || undefined,
        gender: gender || "Male",
        dob: dob || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        idCard: idCard.trim() || undefined,
        address: address.trim() || undefined,
        jobPosition: jobPosition.trim() || undefined,
        role: "SALE" as EmployeeRole,
        salary: Number(salary),
        startWork: startWork || undefined,
        branchId,
        note: note.trim() || undefined,
      };

      if (editingId) {
        await employeeService.update(editingId, payload);
      } else {
        await employeeService.create(payload);
      }

      setIsEmployeeModalOpen(false);
      await fetchData();
    } catch (err: unknown) {
      setEmployeeFormError(err instanceof Error ? err.message : "Failed to save employee");
    } finally {
      setEmployeeSubmitting(false);
    }
  };

  // Open Salary Payment Modal
  const handleOpenSalaryPayment = () => {
    const firstEmp = employees[0];
    setSelectedEmployeeId(firstEmp?.id || "");
    setPaidDate(new Date().toISOString().slice(0, 10));
    setActualSalaryMonth(firstEmp ? firstEmp.salary : "");
    setPayAmount(firstEmp ? firstEmp.salary : "");
    setPayStatus("full payment");
    setSalaryDescription("");
    setSalaryFormError(null);
    setIsSalaryModalOpen(true);
  };

  // When selected employee changes in Salary Payment Modal
  const handleEmployeeSelectionChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setActualSalaryMonth(emp.salary);
      setPayAmount(emp.salary);
    }
  };

  // Save Salary Payment
  const handleSaveSalaryPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalaryFormError(null);

    if (!selectedEmployeeId) {
      setSalaryFormError("Please select an employee.");
      return;
    }
    if (!payAmount || Number(payAmount) <= 0) {
      setSalaryFormError("Pay amount must be greater than 0.");
      return;
    }

    setSalarySubmitting(true);
    try {
      await employeeService.createSalaryPayment({
        employeeId: selectedEmployeeId,
        paidDate,
        payAmount: Number(payAmount),
        actualSalary: Number(actualSalaryMonth) || Number(payAmount),
        payStatus,
        description: salaryDescription.trim() || undefined,
      });

      setIsSalaryModalOpen(false);
      setActiveTab("salary");
      await fetchData();
    } catch (err: unknown) {
      setSalaryFormError(err instanceof Error ? err.message : "Failed to create salary payment");
    } finally {
      setSalarySubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-80px)] font-sans antialiased text-[#212529]">
      {/* 1. Breadcrumb Box (Exact Screenshot 1) */}
      <div className="flex items-center gap-1.5 bg-[#f0f3f6] px-3.5 py-2 rounded text-xs text-slate-600 border border-[#e2e8f0] w-fit mb-5">
        <LayoutGrid className="h-3.5 w-3.5 text-[#0066cc]" />
        <Link href="/" className="text-[#0066cc] hover:underline font-normal">
          Dashboard
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <span className="text-slate-500">Employee</span>
      </div>

      {/* 2. Page Title & Action Buttons (Exact Screenshot 1) */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-[#212529] tracking-tight">
          Employee management and info
        </h1>
        <p className="text-[13px] text-[#6c757d] mt-0.5">
          view and manage employee
        </p>

        <div className="flex items-center gap-2.5 mt-4">
          <button
            type="button"
            onClick={handleOpenSalaryPayment}
            className="bg-[#0b4a8c] hover:bg-[#08386c] text-white text-xs font-normal px-3.5 py-2 rounded flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full border border-white text-white text-[10px] font-bold leading-none">+</span>
            New salary payment
          </button>

          <button
            type="button"
            onClick={handleOpenCreateEmployee}
            className="bg-[#0066cc] hover:bg-[#0052a3] text-white text-xs font-normal px-3.5 py-2 rounded flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full border border-white text-white text-[10px] font-bold leading-none">+</span>
            New employee
          </button>
        </div>
      </div>

      {/* 3. Navigation Tabs (Exact Screenshot 1) */}
      <div className="border-b border-[#dee2e6] pb-2 mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("salary")}
          className={`px-3.5 py-1.5 text-xs transition-colors cursor-pointer ${
            activeTab === "salary"
              ? "border border-[#ced4da] bg-white text-[#212529] font-normal rounded shadow-2xs"
              : "text-[#0066cc] hover:underline"
          }`}
        >
          Salary payment
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("employee")}
          className={`px-3.5 py-1.5 text-xs transition-colors cursor-pointer ${
            activeTab === "employee"
              ? "border border-[#ced4da] bg-white text-[#212529] font-normal rounded shadow-2xs"
              : "text-[#0066cc] hover:underline"
          }`}
        >
          Employee info
        </button>
      </div>

      {/* 4. Tab Content: Employee Info */}
      {activeTab === "employee" && (
        <div className="space-y-3">
          <div>
            <h2 className="text-[17px] font-bold text-[#212529]">
              Employee information
            </h2>
            <p className="text-[12px] text-[#6c757d]">employee list</p>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#6c757d] border border-dashed rounded">
              No employee records found. Click "+ New employee" to add one.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#dee2e6] text-[#495057] font-semibold">
                    <th className="py-2.5 px-3 w-12 font-bold">#</th>
                    <th className="py-2.5 px-3 font-bold">English name</th>
                    <th className="py-2.5 px-3 font-bold">Khmer name</th>
                    <th className="py-2.5 px-3 font-bold">Gender</th>
                    <th className="py-2.5 px-3 font-bold">Phone</th>
                    <th className="py-2.5 px-3 font-bold">Position</th>
                    <th className="py-2.5 px-3 font-bold">Salary</th>
                    <th className="py-2.5 px-3 font-bold">Work place</th>
                    <th className="py-2.5 px-3 text-center w-16 font-bold"></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, index) => (
                    <tr
                      key={emp.id}
                      className="border-b border-[#f1f3f5] hover:bg-[#f8f9fa] transition-colors"
                    >
                      <td className="py-3 px-3 text-[#6c757d]">{index + 1}</td>
                      <td className="py-3 px-3 font-normal text-[#212529]">{emp.englishName}</td>
                      <td className="py-3 px-3 text-[#495057] font-khmer">{emp.khmerName || ""}</td>
                      <td className="py-3 px-3 text-[#495057]">{emp.gender || "Male"}</td>
                      <td className="py-3 px-3 text-[#495057]">{emp.phone}</td>
                      <td className="py-3 px-3 text-[#495057]">{emp.jobPosition || emp.role}</td>
                      <td className="py-3 px-3 text-[#212529] font-normal">${emp.salary}</td>
                      <td className="py-3 px-3 text-[#495057] uppercase">{emp.branchName}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEditEmployee(emp)}
                          className="w-6 h-6 rounded bg-[#0d6efd] hover:bg-[#0b5ed7] text-white inline-flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                          title="Edit Employee"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab Content: Salary Payment Info */}
      {activeTab === "salary" && (
        <div className="space-y-3">
          <div>
            <h2 className="text-[17px] font-bold text-[#212529]">
              Salary payment list
            </h2>
            <p className="text-[12px] text-[#6c757d]">all salary payment transactions</p>
          </div>

          {loading ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : salaryPayments.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#6c757d] border border-dashed rounded">
              No salary payments recorded yet. Click "+ New salary payment" to add one.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#dee2e6] text-[#495057] font-semibold">
                    <th className="py-2.5 px-3 w-12 font-bold">#</th>
                    <th className="py-2.5 px-3 font-bold">Employee</th>
                    <th className="py-2.5 px-3 font-bold">Paid date</th>
                    <th className="py-2.5 px-3 font-bold">Pay amount</th>
                    <th className="py-2.5 px-3 font-bold">Actual salary/month</th>
                    <th className="py-2.5 px-3 font-bold">Pay status</th>
                    <th className="py-2.5 px-3 font-bold">Description</th>
                    <th className="py-2.5 px-3 font-bold">Work place</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryPayments.map((sp, idx) => (
                    <tr
                      key={sp.id}
                      className="border-b border-[#f1f3f5] hover:bg-[#f8f9fa] transition-colors"
                    >
                      <td className="py-3 px-3 text-[#6c757d]">{idx + 1}</td>
                      <td className="py-3 px-3 font-normal text-[#212529]">
                        {sp.employeeName} {sp.employeeKhmerName ? `(${sp.employeeKhmerName})` : ""}
                      </td>
                      <td className="py-3 px-3 text-[#495057]">{sp.paidDate}</td>
                      <td className="py-3 px-3 font-normal text-emerald-600">${sp.payAmount}</td>
                      <td className="py-3 px-3 text-[#495057]">${sp.actualSalary}</td>
                      <td className="py-3 px-3 text-[#495057] capitalize">{sp.payStatus}</td>
                      <td className="py-3 px-3 text-[#6c757d]">{sp.description || "—"}</td>
                      <td className="py-3 px-3 text-[#495057]">{sp.branchName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          MODAL 1: Creating new salary payment (Exact Screenshot 2)
         ───────────────────────────────────────────── */}
      <Dialog open={isSalaryModalOpen} onOpenChange={setIsSalaryModalOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-md">
          {/* Header Title Banner (Navy Blue #0f3567) */}
          <div className="bg-[#0f3567] text-white px-5 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-[14px] text-white tracking-wide">
              Creating new salary payment
            </h3>
            <button
              type="button"
              onClick={() => setIsSalaryModalOpen(false)}
              className="text-white/80 hover:text-white text-base leading-none cursor-pointer"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSaveSalaryPayment} className="p-5 space-y-4 bg-white text-xs">
            {salaryFormError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{salaryFormError}</AlertDescription>
              </Alert>
            )}

            {/* Row 1: Select employee | Paid date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Select employee
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => handleEmployeeSelectionChange(e.target.value)}
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                >
                  <option value="">--Select--</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.englishName} {e.khmerName ? `(${e.khmerName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Paid date
                </label>
                <input
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  required
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                />
              </div>
            </div>

            {/* Row 2: Pay amount | Actual salary/month | Pay status */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Pay amount
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="$ salary pay for"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  required
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Actual salary/month
                </label>
                <input
                  type="number"
                  placeholder="$ current salary"
                  value={actualSalaryMonth}
                  onChange={(e) => setActualSalaryMonth(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-[#e9ecef] cursor-not-allowed focus:outline-none"
                  readOnly
                />
              </div>

              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Pay status
                </label>
                <select
                  value={payStatus}
                  onChange={(e) => setPayStatus(e.target.value)}
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                >
                  <option value="full payment">full payment</option>
                  <option value="partial payment">partial payment</option>
                  <option value="advance payment">advance payment</option>
                </select>
              </div>
            </div>

            {/* Row 3: Description */}
            <div>
              <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="other description like loan, pawn half pay or full payment"
                value={salaryDescription}
                onChange={(e) => setSalaryDescription(e.target.value)}
                className="text-xs border border-[#ced4da] rounded-[4px] p-2 text-[#495057] placeholder:text-[#6c757d] w-full bg-white resize-none focus:border-[#80bdff] focus:outline-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#dee2e6]">
              <button
                type="button"
                onClick={() => setIsSalaryModalOpen(false)}
                className="h-8 px-4 border border-[#ced4da] rounded-[4px] text-xs text-[#495057] hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={salarySubmitting}
                className="h-8 px-4 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-[4px] text-xs font-normal flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full border border-white text-white text-[10px] font-bold leading-none">+</span>
                Save
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────
          MODAL 2: Creating employee / Editing employee (Exact Screenshot 3)
         ───────────────────────────────────────────── */}
      <Dialog open={isEmployeeModalOpen} onOpenChange={setIsEmployeeModalOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-none shadow-2xl rounded-md">
          {/* Header Title Banner (Navy Blue #0f3567) */}
          <div className="bg-[#0f3567] text-white px-5 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-[14px] text-white tracking-wide">
              {editingId ? "Editing employee" : "Creating employee"}
            </h3>
            <button
              type="button"
              onClick={() => setIsEmployeeModalOpen(false)}
              className="text-white/80 hover:text-white text-base leading-none cursor-pointer"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSaveEmployee} className="p-5 space-y-3.5 bg-white text-xs">
            {employeeFormError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{employeeFormError}</AlertDescription>
              </Alert>
            )}

            {/* Row 1: English name | Khmer name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  English name
                </label>
                <input
                  placeholder="name in english"
                  value={englishName}
                  onChange={(e) => setEnglishName(e.target.value)}
                  required
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Khmer name
                </label>
                <input
                  placeholder="name in khmer"
                  value={khmerName}
                  onChange={(e) => setKhmerName(e.target.value)}
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none font-khmer"
                />
              </div>
            </div>

            {/* Row 2: Gender | Date of birth | Phone */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Date of birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Phone
                </label>
                <input
                  placeholder="ex. +85510 222 333"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                />
              </div>
            </div>

            {/* Row 3: Email | ID card | Address */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="ex. example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  ID card
                </label>
                <input
                  placeholder="national id card"
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Address
                </label>
                <input
                  placeholder="employee current address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                />
              </div>
            </div>

            {/* Row 4: Job position | Actual salary | Start work | Work place */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Job position
                </label>
                <input
                  placeholder="job position"
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Actual salary
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="$ salary related position"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value === "" ? "" : Number(e.target.value))}
                  required
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] placeholder:text-[#6c757d] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Start work
                </label>
                <input
                  type="date"
                  value={startWork}
                  onChange={(e) => setStartWork(e.target.value)}
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                  Work place
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="h-8 text-xs border border-[#ced4da] rounded-[4px] px-2.5 text-[#495057] w-full bg-white focus:border-[#80bdff] focus:outline-none"
                >
                  <option value="">--Select--</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 5: Note */}
            <div>
              <label className="text-[12px] text-[#495057] font-normal mb-1 block">
                Note
              </label>
              <textarea
                rows={3}
                placeholder="some note about employee like his/her history, working hour, work day(part time or full time)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-xs border border-[#ced4da] rounded-[4px] p-2 text-[#495057] placeholder:text-[#6c757d] w-full bg-white resize-none focus:border-[#80bdff] focus:outline-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#dee2e6]">
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="h-8 px-4 border border-[#ced4da] rounded-[4px] text-xs text-[#495057] hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={employeeSubmitting}
                className="h-8 px-4 bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-[4px] text-xs font-normal flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full border border-white text-white text-[10px] font-bold leading-none">+</span>
                Save
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
