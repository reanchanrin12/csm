import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TransfersService, CreateTransferDto } from './transfers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get('options')
  getOptions() {
    return this.transfersService.getOptions();
  }

  @Post()
  createTransfer(@Body() dto: CreateTransferDto) {
    return this.transfersService.createTransfer(dto);
  }

  @Get()
  getTransfers() {
    return this.transfersService.getTransfers();
  }
}
