import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import {
  CreateExpenseSchema,
  UpdateExpenseSchema,
  type CreateExpenseDto,
  type UpdateExpenseDto,
} from '@csm/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  getExpenses() {
    return this.expensesService.getExpenses();
  }

  @Post()
  createExpense(@Body(new ZodValidationPipe(CreateExpenseSchema)) dto: CreateExpenseDto) {
    return this.expensesService.createExpense(dto);
  }

  @Patch(':id')
  updateExpense(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateExpenseSchema)) dto: UpdateExpenseDto,
  ) {
    return this.expensesService.updateExpense(id, dto);
  }

  @Delete(':id')
  deleteExpense(@Param('id') id: string) {
    return this.expensesService.deleteExpense(id);
  }
}
