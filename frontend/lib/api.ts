import type {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleSummary,
  CreateEmployeeDto,
  CreateBranchDto,
  UpdateBranchDto,
  CreateBrandDto,
  CreateModelDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateExpenseDto,
  UpdateExpenseDto,
  OperatingExpenseItem,
  ExpenseListResponse,
  LoginDto,
  AuthResponse,
  AuthUser,
  CreateUserDto,
  UpdateUserDto,
  UserSummary,
  CreateSalaryPaymentDto,
  SalaryPaymentSummary,
} from "@csm/contracts";

/**
 * Centralized API base URL.
 * In the browser, defaults to relative "/api" (Same-Origin via Next.js rewrites)
 * which completely prevents CORS preflight failures.
 * On server-side (Node.js/RSC), uses direct backend URL.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? "/api"
    : process.env.INTERNAL_API_URL || "http://localhost:4000/api");

/** Standard shape returned by every failed API call */
export interface ApiError {
  message: string;
  errors?: string[];
  statusCode?: number;
}

/** Typed fetch wrapper — throws ApiError on non-2xx */
async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("csm_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  if (!res.ok) {
    let body: ApiError = { message: `HTTP ${res.status}` };
    try {
      body = await res.json();
    } catch {
      // keep default message
    }

    if (res.status === 401 && typeof window !== "undefined" && !path.includes("/auth/")) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });
        if (refreshRes.ok) {
          const authData = await refreshRes.json();
          if (authData.accessToken) {
            localStorage.setItem("csm_token", authData.accessToken);
            document.cookie = `csm_token=${encodeURIComponent(authData.accessToken)}; path=/; max-age=604800; SameSite=Lax`;
            // Retry the original request with the fresh token
            const newHeaders = {
              ...headers,
              Authorization: `Bearer ${authData.accessToken}`,
            };
            const retryRes = await fetch(`${API_BASE}${path}`, {
              credentials: "include",
              ...options,
              headers: newHeaders,
            });
            if (retryRes.ok) {
              if (retryRes.status === 204) return undefined as T;
              return retryRes.json() as Promise<T>;
            }
          }
        }
      } catch {
        // Refresh failed, proceed to logout
      }

      localStorage.removeItem("csm_token");
      document.cookie = "csm_token=; path=/; max-age=0;";
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?reason=expired";
      }
    }

    const err = Object.assign(
      new Error(body.message || `HTTP ${res.status}`),
      { errors: body.errors, statusCode: res.status },
    );
    throw err;
  }

  // 204 No Content — return empty
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// VEHICLES
// ─────────────────────────────────────────────
export const vehicleService = {
  getOptions: () =>
    apiFetch<{
      branches: { id: string; name: string }[];
      brands: { id: string; name: string; models: { id: string; name: string }[] }[];
      suppliers: { id: string; nameEn: string; nameKh?: string }[];
    }>("/vehicles/options"),

  list: (params?: {
    branchId?: string;
    brand?: string;
    status?: string;
    search?: string;
    skip?: number;
    take?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.branchId) q.set("branchId", params.branchId);
    if (params?.brand) q.set("brand", params.brand);
    if (params?.status) q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    if (params?.skip != null) q.set("skip", String(params.skip));
    if (params?.take != null) q.set("take", String(params.take));
    const qs = q.toString();
    return apiFetch<VehicleSummary[]>(`/vehicles${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) => apiFetch<VehicleSummary>(`/vehicles/${id}`),

  create: (dto: CreateVehicleDto) =>
    apiFetch<VehicleSummary>("/vehicles", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: UpdateVehicleDto) =>
    apiFetch<VehicleSummary>(`/vehicles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),
};

// ─────────────────────────────────────────────
// SALES
// ─────────────────────────────────────────────
export interface LoanScheduleItem {
  id: string;
  installmentNo: number;
  dueDate: string;
  principal: number;
  interest: number;
  totalDue: number;
  paidAmount: number;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
  paidDate: string | null;
}

export interface CustomerPaymentRecord {
  id: string;
  loanCode: string;
  receiptNo: string;
  customerName: string;
  customerPhone?: string;
  brand: string;
  model: string;
  vin: string;
  engine: string;
  coverImageUrl?: string | null;
  soldPrice: number;
  rate: number;
  soldDate: string;
  termMonths: number;
  loanType: "FULL_PAYMENT" | "INSTALLMENT_FLAT" | "INSTALLMENT_DECLINING" | "BANK_LOAN";
  totalDue: number;
  totalPaid: number;
  balance: number;
  monthlyPay: number;
  schedulesCount: number;
  paidCount: number;
  schedules: LoanScheduleItem[];
}

export const salesService = {
  getOptions: () => apiFetch<unknown>("/sales/options"),

  list: () => apiFetch<unknown[]>("/sales"),

  getById: (id: string) => apiFetch<unknown>(`/sales/${id}`),

  create: (dto: unknown) =>
    apiFetch<unknown>("/sales", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  getLoans: () => apiFetch<CustomerPaymentRecord[]>("/sales/loans"),

  payInstallment: (id: string, amount?: number) =>
    apiFetch<unknown>(`/sales/loans/pay/${id}`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  update: (
    id: string,
    dto: { soldPrice?: number; soldDate?: string; customerId?: string }
  ) =>
    apiFetch<unknown>(`/sales/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),
};

// ─────────────────────────────────────────────
// EXPENSES (Operating Expenses)
// ─────────────────────────────────────────────
export const expenseService = {
  list: () => apiFetch<ExpenseListResponse>("/expenses"),

  create: (dto: CreateExpenseDto) =>
    apiFetch<OperatingExpenseItem>("/expenses", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: UpdateExpenseDto) =>
    apiFetch<OperatingExpenseItem>(`/expenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/expenses/${id}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────
// EMPLOYEES
// ─────────────────────────────────────────────
export const employeeService = {
  list: () => apiFetch<unknown[]>("/employees"),

  getById: (id: string) => apiFetch<unknown>(`/employees/${id}`),

  create: (dto: CreateEmployeeDto) =>
    apiFetch<unknown>("/employees", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  update: (id: string, dto: Partial<CreateEmployeeDto>) =>
    apiFetch<unknown>(`/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/employees/${id}`, { method: "DELETE" }),

  getSalaryPayments: () =>
    apiFetch<SalaryPaymentSummary[]>("/employees/salary-payments"),

  createSalaryPayment: (dto: CreateSalaryPaymentDto) =>
    apiFetch<SalaryPaymentSummary>("/employees/salary-payments", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  deleteSalaryPayment: (id: string) =>
    apiFetch<void>(`/employees/salary-payments/${id}`, { method: "DELETE" }),
};


// ─────────────────────────────────────────────
// COSTS (Landed Cost Items & Bills)
// ─────────────────────────────────────────────
export const costService = {
  addItem: (dto: unknown) =>
    apiFetch<unknown>("/costs/items", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  getBills: () => apiFetch<unknown[]>("/costs/bills"),

  getOptions: () =>
    apiFetch<{ suppliers: unknown[]; vehicles: unknown[] }>("/costs/options"),

  getVehicleBreakdown: (vin: string) =>
    apiFetch<unknown>(`/costs/vehicle/${encodeURIComponent(vin)}`),

  createBill: (dto: unknown) =>
    apiFetch<unknown>("/costs/bills", {
      method: "POST",
      body: JSON.stringify(dto),
    }),

  updateBill: (id: string, dto: unknown) =>
    apiFetch<unknown>(`/costs/bills/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),

  getSupplierPayments: () =>
    apiFetch<SupplierPaymentRecord[]>("/costs/supplier-payments"),

  paySupplier: (
    id: string,
    dto: { amount: number; paidDate?: string; comment?: string }
  ) =>
    apiFetch<unknown>(`/costs/supplier-payments/${id}/pay`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),
};

export interface SupplierPaymentRecord {
  id: string;
  invoiceNo: string;
  brand: string;
  model: string;
  vin: string;
  supplierName: string;
  totalPrice: number;
  paidAmount: number;
  balance: number;
  status: string;
}

export const supplierPaymentService = {
  list: () => apiFetch<SupplierPaymentRecord[]>("/costs/supplier-payments"),
  pay: (
    id: string,
    dto: { amount: number; paidDate?: string; comment?: string }
  ) =>
    apiFetch<unknown>(`/costs/supplier-payments/${id}/pay`, {
      method: "POST",
      body: JSON.stringify(dto),
    }),
};

// ─────────────────────────────────────────────
// TRANSFERS (Vehicle Branch Transfers)
// ─────────────────────────────────────────────
export const transferService = {
  list: () => apiFetch<unknown[]>("/transfers"),

  getOptions: () =>
    apiFetch<{ vehicles: unknown[]; branches: unknown[] }>("/transfers/options"),

  create: (dto: unknown) =>
    apiFetch<unknown>("/transfers", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
};

// ─────────────────────────────────────────────
// SETTINGS (Branches, Brands, Suppliers)
// ─────────────────────────────────────────────
export const settingsService = {
  // Branches
  getBranches: () => apiFetch<unknown[]>("/settings/branches"),
  createBranch: (dto: CreateBranchDto) =>
    apiFetch<unknown>("/settings/branches", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  updateBranch: (id: string, dto: UpdateBranchDto) =>
    apiFetch<unknown>(`/settings/branches/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),
  deleteBranch: (id: string) =>
    apiFetch<void>(`/settings/branches/${id}`, { method: "DELETE" }),

  // Brands & Models
  getBrands: () => apiFetch<unknown[]>("/settings/brands"),
  createBrand: (dto: CreateBrandDto) =>
    apiFetch<unknown>("/settings/brands", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  createModel: (dto: CreateModelDto) =>
    apiFetch<unknown>("/settings/models", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  deleteModel: (id: string) =>
    apiFetch<void>(`/settings/models/${id}`, { method: "DELETE" }),

  // Suppliers
  getSuppliers: () => apiFetch<unknown[]>("/settings/suppliers"),
  createSupplier: (dto: CreateSupplierDto) =>
    apiFetch<unknown>("/settings/suppliers", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  updateSupplier: (id: string, dto: UpdateSupplierDto) =>
    apiFetch<unknown>(`/settings/suppliers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),
  deleteSupplier: (id: string) =>
    apiFetch<void>(`/settings/suppliers/${id}`, { method: "DELETE" }),

  // Company Profiles
  getCompanyProfiles: () => apiFetch<any[]>("/settings/company-profiles"),
  createCompanyProfile: (dto: any) =>
    apiFetch<any>("/settings/company-profiles", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  updateCompanyProfile: (id: string, dto: any) =>
    apiFetch<any>(`/settings/company-profiles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),
  deleteCompanyProfile: (id: string) =>
    apiFetch<void>(`/settings/company-profiles/${id}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────
export const customerService = {
  list: () => apiFetch<any[]>("/sales/customers"),
  create: (dto: {
    name: string;
    khmerName?: string | undefined;
    phone: string;
    gender?: string | undefined;
    dob?: string | undefined;
    idCard?: string | undefined;
    address?: string | undefined;
    job?: string | undefined;
    email?: string | undefined;
    note?: string | undefined;
  }) =>
    apiFetch<unknown>("/sales/customers", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
};

// ─────────────────────────────────────────────
// AUTH & USERS
// ─────────────────────────────────────────────
export const authService = {
  login: (dto: LoginDto) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  getMe: () => apiFetch<AuthUser>("/auth/me"),
  refreshToken: () =>
    apiFetch<AuthResponse>("/auth/refresh", {
      method: "POST",
    }),
  logout: () =>
    apiFetch<{ success: boolean; message: string }>("/auth/logout", {
      method: "POST",
    }),
};

export const userService = {
  getUsers: () =>
    apiFetch<{
      users: UserSummary[];
      employees: {
        id: string;
        englishName: string;
        khmerName?: string | undefined;
        branchName: string;
        hasAccount: boolean;
      }[];
    }>("/users"),
  create: (dto: CreateUserDto) =>
    apiFetch<UserSummary>("/users", {
      method: "POST",
      body: JSON.stringify(dto),
    }),
  update: (id: string, dto: UpdateUserDto) =>
    apiFetch<UserSummary>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dto),
    }),
  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/users/${id}`, {
      method: "DELETE",
    }),
};
