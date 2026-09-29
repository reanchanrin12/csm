import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateExpenseDto {
  expenseDate: string;
  expenseTo: string;
  amount: number;
  details?: string;
}

export interface UpdateExpenseDto {
  expenseDate?: string;
  expenseTo?: string;
  amount?: number;
  details?: string;
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Get all expenses & summary metrics
  async getExpenses() {
    const expenses = await this.prisma.operatingExpense.findMany({
      orderBy: { expenseDate: 'desc' },
    });

    const formatted = expenses.map((e) => ({
      id: e.id,
      expenseDate: e.expenseDate.toISOString(),
      expenseTo: e.expenseTo,
      amount: Number(e.amount),
      details: e.details,
      createdAt: e.createdAt.toISOString(),
    }));

    const totalExpense = formatted.reduce((sum, e) => sum + e.amount, 0);

    return {
      expenses: formatted,
      totalExpense,
    };
  }

  // 2. Create expense
  async createExpense(dto: CreateExpenseDto) {
    const created = await this.prisma.operatingExpense.create({
      data: {
        expenseDate: new Date(dto.expenseDate),
        expenseTo: dto.expenseTo,
        amount: dto.amount,
        details: dto.details,
      },
    });

    return {
      id: created.id,
      expenseDate: created.expenseDate.toISOString(),
      expenseTo: created.expenseTo,
      amount: Number(created.amount),
      details: created.details,
      createdAt: created.createdAt.toISOString(),
    };
  }

  // 3. Update expense
  async updateExpense(id: string, dto: UpdateExpenseDto) {
    const existing = await this.prisma.operatingExpense.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Expense not found.`);
    }

    const updated = await this.prisma.operatingExpense.update({
      where: { id },
      data: {
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        expenseTo: dto.expenseTo,
        amount: dto.amount !== undefined ? dto.amount : undefined,
        details: dto.details,
      },
    });

    return {
      id: updated.id,
      expenseDate: updated.expenseDate.toISOString(),
      expenseTo: updated.expenseTo,
      amount: Number(updated.amount),
      details: updated.details,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  // 4. Delete expense
  async deleteExpense(id: string) {
    const existing = await this.prisma.operatingExpense.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Expense not found.`);
    }

    await this.prisma.operatingExpense.delete({
      where: { id },
    });

    return { success: true, message: `Expense deleted successfully.` };
  }
}
