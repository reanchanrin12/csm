import { z } from 'zod';

export const SupplierTypeEnum = z.enum([
  'VEHICLE',
  'LOGISTICS',
  'REPAIR',
  'SPARE_PARTS',
  'ACCESSORIES',
  'CUSTOMS',
  'INSURANCE',
  'OTHER',
]);
export type SupplierType = z.infer<typeof SupplierTypeEnum>;

// ===== BRANCH =====
export const CreateBranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required'),
  address: z.string().optional(),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  note: z.string().optional(),
});
export type CreateBranchDto = z.infer<typeof CreateBranchSchema>;

export const UpdateBranchSchema = CreateBranchSchema.partial();
export type UpdateBranchDto = z.infer<typeof UpdateBranchSchema>;

// ===== BRAND & MODEL =====
export const CreateBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
});
export type CreateBrandDto = z.infer<typeof CreateBrandSchema>;

export const CreateModelSchema = z.object({
  brandId: z.string().uuid('Invalid brand ID'),
  name: z.string().min(1, 'Model name is required'),
});
export type CreateModelDto = z.infer<typeof CreateModelSchema>;

// ===== SUPPLIER =====
export const CreateSupplierSchema = z.object({
  nameEn: z.string().min(1, 'Supplier name (EN) is required'),
  nameKh: z.string().optional(),
  category: SupplierTypeEnum.default('VEHICLE'),
  job: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
});
export type CreateSupplierDto = z.infer<typeof CreateSupplierSchema>;

export const UpdateSupplierSchema = CreateSupplierSchema.partial();
export type UpdateSupplierDto = z.infer<typeof UpdateSupplierSchema>;

// ===== COMPANY PROFILE =====
export const CreateCompanyProfileSchema = z.object({
  name: z.string().min(1, 'Company profile name is required'),
  gender: z.string().optional(),
  dob: z.string().optional(),
  phone: z.string().optional(),
  job: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  logoUrl: z.string().optional(),
  note: z.string().optional(),
  isDefault: z.boolean().default(false),
});
export type CreateCompanyProfileDto = z.infer<typeof CreateCompanyProfileSchema>;

export const UpdateCompanyProfileSchema = CreateCompanyProfileSchema.partial();
export type UpdateCompanyProfileDto = z.infer<typeof UpdateCompanyProfileSchema>;

export const CompanyProfileItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  gender: z.string().nullable().optional(),
  dob: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  job: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  isDefault: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CompanyProfileItem = z.infer<typeof CompanyProfileItemSchema>;
