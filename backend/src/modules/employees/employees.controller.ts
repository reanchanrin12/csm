import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
  CreateSalaryPaymentSchema,
  type CreateEmployeeDto,
  type UpdateEmployeeDto,
  type CreateSalaryPaymentDto,
} from '@csm/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  getEmployees() {
    return this.employeesService.getEmployees();
  }

  @Post()
  createEmployee(
    @Body(new ZodValidationPipe(CreateEmployeeSchema)) dto: CreateEmployeeDto,
  ) {
    return this.employeesService.createEmployee(dto);
  }

  @Get('salary-payments')
  getSalaryPayments() {
    return this.employeesService.getSalaryPayments();
  }

  @Post('salary-payments')
  createSalaryPayment(
    @Body(new ZodValidationPipe(CreateSalaryPaymentSchema)) dto: CreateSalaryPaymentDto,
  ) {
    return this.employeesService.createSalaryPayment(dto);
  }

  @Delete('salary-payments/:id')
  deleteSalaryPayment(@Param('id') id: string) {
    return this.employeesService.deleteSalaryPayment(id);
  }

  @Patch(':id')
  updateEmployee(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateEmployeeSchema)) dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.updateEmployee(id, dto);
  }

  @Delete(':id')
  deleteEmployee(@Param('id') id: string) {
    return this.employeesService.deleteEmployee(id);
  }
}
