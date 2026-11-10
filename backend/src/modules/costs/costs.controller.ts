import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CostsService, CreateBillDto, UpdateBillDto } from './costs.service';
import type { CostCategory } from '@csm/contracts';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('costs')
@UseGuards(JwtAuthGuard)
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
    @Body() dto: UpdateBillDto,
  ) {
    return this.costsService.updateBill(id, dto);
  }

  @Delete('bills/:id')
  deleteBill(@Param('id') id: string) {
    return this.costsService.deleteBill(id);
  }

  @Delete('items/:id')
  deleteCostItem(@Param('id') id: string) {
    return this.costsService.deleteCostItem(id);
  }

  @Get('bills')
  getBills(
    @Query('category') category?: CostCategory,
    @Query('vin') vin?: string,
    @Query('billNumber') billNumber?: string,
  ) {
    return this.costsService.getBills(category, vin, billNumber);
  }

  @Get('parts-repairs')
  getPartsAndRepairsReport() {
    return this.costsService.getPartsAndRepairsReport();
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
