import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import {
  CreateVehicleSchema,
  UpdateVehicleSchema,
  type CreateVehicleDto,
  type UpdateVehicleDto,
  type VehicleStatus,
} from '@csm/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('options')
  getFormOptions() {
    return this.vehiclesService.getFormOptions();
  }

  @Post()
  createVehicle(
    @Body(new ZodValidationPipe(CreateVehicleSchema)) dto: CreateVehicleDto,
  ) {
    return this.vehiclesService.createVehicle(dto);
  }

  @Patch(':id')
  updateVehicle(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateVehicleSchema)) dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.updateVehicle(id, dto);
  }

  @Get()
  getVehicles(
    @Query('branchId') branchId?: string,
    @Query('brand') brand?: string,
    @Query('status') status?: VehicleStatus,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.vehiclesService.getVehicles({
      branchId,
      brand,
      status,
      search,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Get(':id')
  getVehicleById(@Param('id') id: string) {
    return this.vehiclesService.getVehicleById(id);
  }
}
