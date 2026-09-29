import { z } from 'zod';

export const CreateExpenseSchema = z.object({
  expenseDate: z.string().min(1, 'Expense date is required'),
  expenseTo: z.string().min(1, 'Payee / recipient is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  details: z.string().optional(),
});
export type CreateExpenseDto = z.infer<typeof CreateExpenseSchema>;

export const UpdateExpenseSchema = CreateExpenseSchema.partial();
export type UpdateExpenseDto = z.infer<typeof UpdateExpenseSchema>;

export const OperatingExpenseSchema = z.object({
  id: z.string(),
  expenseDate: z.string(),
  expenseTo: z.string(),
  amount: z.number(),
  details: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type OperatingExpenseItem = z.infer<typeof OperatingExpenseSchema>;

export const ExpenseListResponseSchema = z.object({
  expenses: z.array(OperatingExpenseSchema),
  totalExpense: z.number(),
});
export type ExpenseListResponse = z.infer<typeof ExpenseListResponseSchema>;
