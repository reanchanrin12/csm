import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { CostsService, CreateBillDto } from './costs.service';
import type { CostCategory } from '@csm/contracts';

@Controller('costs')
export class CostsController {
  constructor(private readonly costsService: CostsService) {}

  @Get('options')
  getOptions() {
    return this.costsService.getOptions();
  }

  @Post('bills')
  createBill(@Body() dto: CreateBillDto) {
    return this.costsService.createBill(dto);
  }

  @Patch('bills/:id')
  updateBill(
    @Param('id') id: string,
    @Body()
    dto: {
      supplierId?: string;
      paidAmount?: number;
      billDate?: string;
      description?: string;
    },
  ) {
    return this.costsService.updateBill(id, dto);
  }

  @Get('bills')
  getBills(@Query('category') category?: CostCategory) {
    return this.costsService.getBills(category);
  }

  @Get('vehicle/:vin')
  getVehicleCostBreakdown(@Param('vin') vin: string) {
    return this.costsService.getVehicleCostBreakdown(vin);
  }

  @Get('supplier-payments')
  getSupplierPayments() {
    return this.costsService.getSupplierPayments();
  }

  @Post('supplier-payments/:id/pay')
  paySupplier(
    @Param('id') id: string,
    @Body() body: { amount: number; paidDate?: string; comment?: string },
  ) {
    return this.costsService.paySupplier(id, body);
  }
}
