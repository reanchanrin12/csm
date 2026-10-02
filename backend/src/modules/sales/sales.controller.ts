import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import {
  CreateSaleOrderSchema,
  type CreateSaleOrderDto,
} from '@csm/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('options')
  getOptions() {
    return this.salesService.getOptions();
  }

  @Post()
  createSaleOrder(
    @Body(new ZodValidationPipe(CreateSaleOrderSchema)) dto: CreateSaleOrderDto,
  ) {
    return this.salesService.createSaleOrder(dto);
  }

  @Get('customers')
  getCustomers() {
    return this.salesService.getCustomers();
  }

  @Post('customers')
  createCustomer(
    @Body()
    data: {
      name: string;
      phone: string;
      gender?: string;
      dob?: string;
      idCard?: string;
      address?: string;
      job?: string;
      email?: string;
      note?: string;
    },
  ) {
    return this.salesService.createCustomer(data);
  }

  @Patch('customers/:id')
  updateCustomer(
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      phone?: string;
      gender?: string;
      dob?: string;
      idCard?: string;
      address?: string;
      job?: string;
      email?: string;
      note?: string;
    },
  ) {
    return this.salesService.updateCustomer(id, data);
  }

  @Delete('customers/:id')
  deleteCustomer(@Param('id') id: string) {
    return this.salesService.deleteCustomer(id);
  }

  @Get('loans')
  getLoanOrders() {
    return this.salesService.getLoanOrders();
  }

  @Post('loans/pay/:id')
  payInstallment(
    @Param('id') id: string,
    @Body() body: { amount?: number },
  ) {
    return this.salesService.payInstallment(id, body?.amount);
  }

  @Get()
  getSaleOrders() {
    return this.salesService.getSaleOrders();
  }

  @Get(':id')
  getSaleOrderById(@Param('id') id: string) {
    return this.salesService.getSaleOrderById(id);
  }

  @Patch(':id')
  updateSaleOrder(
    @Param('id') id: string,
    @Body() data: { soldPrice?: number; soldDate?: string; customerId?: string },
  ) {
    return this.salesService.updateSaleOrder(id, data);
  }

  @Delete(':id')
  deleteSaleOrder(@Param('id') id: string) {
    return this.salesService.deleteSaleOrder(id);
  }
}
