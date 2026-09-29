import { z } from 'zod';
import { CostCategoryEnum } from './vehicle.contract';

export const CreateCostItemSchema = z.object({
  vehicleId: z.string().uuid(),
  costType: CostCategoryEnum,
  amount: z.number().positive('Cost amount must be positive'),
  billId: z.string().uuid().optional(),
  note: z.string().optional(),
});
export type CreateCostItemDto = z.infer<typeof CreateCostItemSchema>;

export const LandedCostBreakdownSchema = z.object({
  vehicleId: z.string(),
  vin: z.string(),
  purchaseCost: z.number(),
  tax: z.number().default(0),
  clearance: z.number().default(0),
  transport: z.number().default(0),
  container: z.number().default(0),
  labor: z.number().default(0),
  repair: z.number().default(0),
  accessories: z.number().default(0),
  totalLandedCost: z.number(),
});
export type LandedCostBreakdown = z.infer<typeof LandedCostBreakdownSchema>;
