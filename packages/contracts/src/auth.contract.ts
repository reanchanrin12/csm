import { z } from 'zod';

export const UserRoleEnum = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'STOCK_CONTROLLER',
  'ACCOUNTANT',
  'SALE',
  'TECHNICIAN',
]);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const AuthUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: UserRoleEnum,
  isActive: z.boolean(),
  employeeId: z.string().nullable().optional(),
  employeeName: z.string().nullable().optional(),
  branchName: z.string().nullable().optional(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
  accessToken: z.string(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const CreateUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  role: UserRoleEnum.default('SALE'),
  employeeId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().default(true),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  username: z.string().min(3).optional(),
  password: z.string().min(4).optional(),
  role: UserRoleEnum.optional(),
  employeeId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

export const UserSummarySchema = z.object({
  id: z.string(),
  username: z.string(),
  role: UserRoleEnum,
  isActive: z.boolean(),
  employeeId: z.string().nullable().optional(),
  employeeName: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserSummary = z.infer<typeof UserSummarySchema>;
