import { z } from 'zod';

export const EmployeeRoleEnum = z.enum([
  'ADMIN',
  'STOCK_CONTROLLER',
  'ACCOUNTANT',
  'SALE',
  'TECHNICIAN',
]);
export type EmployeeRole = z.infer<typeof EmployeeRoleEnum>;

export const CreateEmployeeSchema = z.object({
  englishName: z.string().min(1, 'English name is required'),
  khmerName: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  dob: z.string().optional().nullable(),
  phone: z.string().min(6, 'Valid phone is required'),
  email: z.string().email().optional().nullable().or(z.literal('')),
  idCard: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  jobPosition: z.string().optional().nullable(),
  role: EmployeeRoleEnum.default('SALE'),
  salary: z.number().nonnegative('Salary cannot be negative'),
  startWork: z.string().optional().nullable(),
  branchId: z.string().uuid('Please select a valid branch'),
  note: z.string().optional().nullable(),
});
export type CreateEmployeeDto = z.infer<typeof CreateEmployeeSchema>;

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();
export type UpdateEmployeeDto = z.infer<typeof UpdateEmployeeSchema>;

export const EmployeeSummarySchema = z.object({
  id: z.string(),
  englishName: z.string(),
  khmerName: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  dob: z.string().nullable().optional(),
  phone: z.string(),
  email: z.string().nullable().optional(),
  idCard: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  jobPosition: z.string().nullable().optional(),
  role: EmployeeRoleEnum,
  salary: z.number(),
  startWork: z.string().nullable().optional(),
  branchId: z.string(),
  branchName: z.string(),
  note: z.string().nullable().optional(),
  salesCount: z.number().optional(),
  createdAt: z.string(),
});
export type EmployeeSummary = z.infer<typeof EmployeeSummarySchema>;

export const CreateSalaryPaymentSchema = z.object({
  employeeId: z.string().uuid('Please select an employee'),
  paidDate: z.string().min(1, 'Paid date is required'),
  payAmount: z.number().positive('Pay amount must be greater than 0'),
  actualSalary: z.number().nonnegative('Actual salary cannot be negative'),
  payStatus: z.string().default('full payment'),
  description: z.string().optional().nullable(),
});
export type CreateSalaryPaymentDto = z.infer<typeof CreateSalaryPaymentSchema>;

export const SalaryPaymentSummarySchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  employeeKhmerName: z.string().nullable().optional(),
  paidDate: z.string(),
  payAmount: z.number(),
  actualSalary: z.number(),
  payStatus: z.string(),
  description: z.string().nullable().optional(),
  branchName: z.string().optional(),
  createdAt: z.string(),
});
export type SalaryPaymentSummary = z.infer<typeof SalaryPaymentSummarySchema>;
