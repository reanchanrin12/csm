"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { userService, ApiError } from "@/lib/api";
import type { UserSummary, UserRole } from "@csm/contracts";

interface EmployeeOption {
  id: string;
  englishName: string;
  khmerName?: string | undefined;
  branchName: string;
  hasAccount: boolean;
}

const roleBadgeStyles: Record<string, { label: string; bg: string; text: string }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    bg: "bg-[#dc2626]",
    text: "text-white",
  },
  ADMIN: {
    label: "Admin",
    bg: "bg-[#2563eb]",
    text: "text-white",
  },
  SALE: {
    label: "Sale User",
    bg: "bg-[#16a34a]",
    text: "text-white",
  },
  ACCOUNTANT: {
    label: "Accountant",
    bg: "bg-[#9333ea]",
    text: "text-white",
  },
  STOCK_CONTROLLER: {
    label: "Stock Controller",
    bg: "bg-[#ea580c]",
    text: "text-white",
  },
  TECHNICIAN: {
    label: "Technician",
    bg: "bg-[#475569]",
    text: "text-white",
  },
};

export function UsersManagement() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("ADMIN");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("ADMIN");
  const [editEmployeeId, setEditEmployeeId] = useState<string>("");
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await userService.getUsers();
      setUsers(res.users);
      setEmployees(res.employees);
    } catch (err: any) {
      setError(err?.message || "Failed to load system users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("សូមបញ្ចូល Username និង Password");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await userService.create({
        username: username.trim(),
        password: password.trim(),
        role,
        employeeId: selectedEmployeeId || undefined,
        isActive: true,
      });

      setSuccessMsg(`User "${username}" ត្រូវបានបង្កើតដោយជោគជ័យ!`);
      setUsername("");
      setPassword("");
      setSelectedEmployeeId("");
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVisibility = async (user: UserSummary) => {
    try {
      await userService.update(user.id, { isActive: !user.isActive });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)),
      );
    } catch (err: any) {
      alert(err?.message || "Could not toggle user visibility");
    }
  };

  const openEditModal = (user: UserSummary) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditPassword("");
    setEditRole(user.role);
    setEditEmployeeId(user.employeeId || "");
    setEditIsActive(user.isActive);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditSubmitting(true);
    try {
      await userService.update(editingUser.id, {
        username: editUsername.trim() || undefined,
        password: editPassword.trim() || undefined,
        role: editRole,
        employeeId: editEmployeeId || null,
        isActive: editIsActive,
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err?.message || "Failed to update user.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (user: UserSummary) => {
    if (!confirm(`តើអ្នកពិតជាចង់លុប System User "${user.username}" មែនទេ?`)) return;

    try {
      await userService.delete(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      alert(err?.message || "Failed to delete user.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. TOP CARD: Creat New System User (Exact match with reference CSM 1.0) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">
            Creat New System User
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">add/create system user</p>
        </div>

        <form onSubmit={handleCreate} className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* User Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                User Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="login name"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="login paswd"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Type of user */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Type of uer
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Shield className="h-4 w-4" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-sm text-slate-800 outline-none transition-colors cursor-pointer"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SALE">Sale User</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="STOCK_CONTROLLER">Stock Controller</option>
                  <option value="TECHNICIAN">Technician</option>
                </select>
              </div>
            </div>

            {/* Select from employee list */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select from employee list
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="h-4 w-4" />
                </div>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-sm text-slate-800 outline-none transition-colors cursor-pointer"
                >
                  <option value="">-- Select --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.englishName}{emp.khmerName ? ` (${emp.khmerName})` : ""} - {emp.branchName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>{submitting ? "Creating..." : "Create"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. BOTTOM CARD: Manage all user (Data Table matching reference) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">
            Manage all user
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">edit/delete branch user</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span>Login Name</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-slate-500" />
                    <span>Login Password</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-slate-500" />
                    <span>Login Type</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    <span>Visibility</span>
                  </div>
                </th>
                <th className="py-3 px-4">
                  <span>Created Date</span>
                </th>
                <th className="py-3 px-4 text-center w-24">
                  <span>Options</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading system users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No system users found. Use the form above to create one.
                  </td>
                </tr>
              ) : (
                users.map((u, index) => {
                  const badge = roleBadgeStyles[u.role] || {
                    label: u.role,
                    bg: "bg-slate-600",
                    text: "text-white",
                  };
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-medium text-slate-500">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {u.username}
                        </div>
                        {u.employeeName && (
                          <div className="text-[11px] text-slate-400 font-normal">
                            Linked: {u.employeeName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400 select-none">
                        ••••••••
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${badge.bg} ${badge.text} shadow-2xs`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(u)}
                          className={`cursor-pointer inline-flex items-center gap-1 font-bold text-[11px] ${
                            u.isActive
                              ? "text-emerald-600 hover:text-emerald-700"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <span>on</span>
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </>
                          ) : (
                            <>
                              <span>off</span>
                              <X className="h-3.5 w-3.5 stroke-[3]" />
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {new Date(u.createdAt).toLocaleString("en-GB", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            title="Edit User"
                            className="p-1 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            title="Delete User"
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      </div>

      {/* 3. EDIT USER MODAL DIALOG */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                Edit System User: {editingUser.username}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  User Name
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (ទុកទទេបើមិនចង់ដូរ)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="ទុកទទេដើម្បីរក្សាទុកលេខសម្ងាត់ចាស់..."
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type of User
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-blue-500 outline-none"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SALE">Sale User</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="STOCK_CONTROLLER">Stock Controller</option>
                  <option value="TECHNICIAN">Technician</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Linked Employee
                </label>
                <select
                  value={editEmployeeId}
                  onChange={(e) => setEditEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-blue-500 outline-none"
                >
                  <option value="">-- No Employee Linked --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.englishName}{emp.khmerName ? ` (${emp.khmerName})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="editIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Visibility (Active / Enabled)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-xs disabled:opacity-50"
                >
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
