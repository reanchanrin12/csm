import { z } from 'zod';

export const LoanTypeEnum = z.enum([
  'FULL_PAYMENT',
  'INSTALLMENT_FLAT',
  'INSTALLMENT_DECLINING',
  'BANK_LOAN',
]);
export type LoanType = z.infer<typeof LoanTypeEnum>;

export const CreateSaleOrderSchema = z.object({
  vehicleId: z.string().uuid(),
  customerId: z.string().uuid(),
  soldPrice: z.number().positive('Sold price must be positive'),
  paidAmount: z.number().min(0).optional(),
  bookPrice: z.number().min(0).optional(),
  returnMoneyDate: z.string().optional().nullable(),
  paymentNotice: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankApprovalRef: z.string().optional().nullable(),
  soldDate: z.string().optional(),
  loanType: LoanTypeEnum.default('FULL_PAYMENT'),
  interestRate: z.number().min(0).max(100).optional(),
  termMonths: z.number().int().min(1).max(120).optional(),
  sellerEmployeeId: z.string().uuid().optional().nullable(),
  note: z.string().optional(),
});
export type CreateSaleOrderDto = z.infer<typeof CreateSaleOrderSchema>;

export const SaleOrderSummarySchema = z.object({
  id: z.string(),
  receiptNo: z.string(),
  vehicleVin: z.string(),
  brand: z.string(),
  model: z.string(),
  customerName: z.string(),
  soldPrice: z.number(),
  totalLandedCost: z.number(),
  grossMargin: z.number(),
  loanType: LoanTypeEnum,
  soldDate: z.string(),
});
export type SaleOrderSummary = z.infer<typeof SaleOrderSummarySchema>;
