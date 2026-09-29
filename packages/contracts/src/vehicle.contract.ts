import { z } from 'zod';

export const FuelTypeEnum = z.enum([
  'EV',
  'PHEV',
  'HYBRID',
  'GASOLINE',
  'DIESEL',
]);
export type FuelType = z.infer<typeof FuelTypeEnum>;

export const VehicleStatusEnum = z.enum([
  'IN_TRANSIT',
  'IN_STOCK',
  'RESERVED',
  'SOLD',
  'UNDER_REPAIR',
]);
export type VehicleStatus = z.infer<typeof VehicleStatusEnum>;

export const CostCategoryEnum = z.enum([
  'TAX',
  'CLEARANCE',
  'TRANSPORT',
  'CONTAINER',
  'LABOR',
  'REPAIR',
  'ACCESSORY',
]);
export type CostCategory = z.infer<typeof CostCategoryEnum>;

export const UpdateVehicleSchema = z.object({
  vin: z.string().min(1).max(50).toUpperCase().optional(),
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  madeYear: z.number().int().min(1900).max(2100).optional(),
  cylinderDisp: z.string().optional().nullable(),
  exteriorColor: z.string().optional(),
  interiorColor: z.string().optional().nullable(),
  fuelType: FuelTypeEnum.optional(),
  batteryCapacity: z.string().optional().nullable(),
  plateNumber: z.string().optional().nullable(),
  registrationCard: z.string().optional().nullable(),
  arrivalDate: z.string().optional().nullable(),
  purchasingDate: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable().or(z.literal('')),
  galleryImages: z.array(z.string()).optional(),
  purchaseCost: z.number().min(0).optional(),
  payAmount: z.number().min(0).optional(),
  inSalePrice: z.number().min(0).optional().nullable(),
  branchId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  status: VehicleStatusEnum.optional(),
  engineNumber: z.string().optional().nullable(),
  witness: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});
export type UpdateVehicleDto = z.infer<typeof UpdateVehicleSchema>;

export const CreateVehicleSchema = z.object({
  vin: z
    .string()
    .min(1, 'Chassis number is required')
    .max(50, 'Chassis number must be at most 50 characters')
    .toUpperCase(),
  brand: z.string().optional().default('MHERO'),
  model: z.string().optional().default('817'),
  madeYear: z.number().int().optional().default(2026),
  cylinderDisp: z.string().optional(),
  engineNumber: z.string().optional(),
  exteriorColor: z.string().optional().default('WHITE'),
  interiorColor: z.string().optional(),
  fuelType: FuelTypeEnum.default('EV'),
  batteryCapacity: z.string().optional(),
  plateNumber: z.string().optional(),
  registrationCard: z.string().optional(),
  witness: z.string().optional(),
  arrivalDate: z.string().optional(),
  purchasingDate: z.string().optional(),
  coverImageUrl: z.string().optional().or(z.literal('')),
  galleryImages: z.array(z.string()).default([]),
  purchaseCost: z.number().min(0).default(0),
  payAmount: z.number().min(0).optional(),
  inSalePrice: z.number().min(0).optional(),
  branchId: z.string().optional(),
  supplierId: z.string().optional(),
  note: z.string().optional(),
});
export type CreateVehicleDto = z.infer<typeof CreateVehicleSchema>;


export const VehicleSummarySchema = z.object({
  id: z.string(),
  vin: z.string(),
  brand: z.string(),
  model: z.string(),
  madeYear: z.number(),
  engineNumber: z.string().nullable().optional(),
  exteriorColor: z.string(),
  interiorColor: z.string().nullable().optional(),
  fuelType: FuelTypeEnum,
  batteryCapacity: z.string().nullable().optional(),
  plateNumber: z.string().nullable().optional(),
  status: VehicleStatusEnum,
  branchName: z.string(),
  supplierName: z.string().optional(),
  coverImageUrl: z.string().nullable().optional(),
  purchaseCost: z.number(),
  clearanceCost: z.number().optional().default(0),
  taxCost: z.number().optional().default(0),
  transportCost: z.number().optional().default(0),
  containerCost: z.number().optional().default(0),
  laborCost: z.number().optional().default(0),
  repairCost: z.number().optional().default(0),
  totalLandedCost: z.number(),
  inSalePrice: z.number().nullable().optional(),
  createdAt: z.string(),
});
export type VehicleSummary = z.infer<typeof VehicleSummarySchema>;
