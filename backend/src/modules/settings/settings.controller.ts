import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import {
  CreateBranchSchema,
  UpdateBranchSchema,
  CreateBrandSchema,
  CreateModelSchema,
  CreateSupplierSchema,
  UpdateSupplierSchema,
  type CreateBranchDto,
  type UpdateBranchDto,
  type CreateBrandDto,
  type CreateModelDto,
  type CreateSupplierDto,
  type UpdateSupplierDto,
} from '@csm/contracts';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Branches
  @Get('branches')
  getBranches() {
    return this.settingsService.getBranches();
  }

  @Post('branches')
  createBranch(
    @Body(new ZodValidationPipe(CreateBranchSchema)) data: CreateBranchDto,
  ) {
    return this.settingsService.createBranch(data);
  }

  @Patch('branches/:id')
  updateBranch(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateBranchSchema)) data: UpdateBranchDto,
  ) {
    return this.settingsService.updateBranch(id, data);
  }

  @Delete('branches/:id')
  deleteBranch(@Param('id') id: string) {
    return this.settingsService.deleteBranch(id);
  }

  // Brands & Models
  @Get('brands')
  getBrands() {
    return this.settingsService.getBrands();
  }

  @Post('brands')
  createBrand(
    @Body(new ZodValidationPipe(CreateBrandSchema)) data: CreateBrandDto,
  ) {
    return this.settingsService.createBrand(data);
  }

  @Post('models')
  createModel(
    @Body(new ZodValidationPipe(CreateModelSchema)) data: CreateModelDto,
  ) {
    return this.settingsService.createModel(data);
  }

  @Delete('models/:id')
  deleteModel(@Param('id') id: string) {
    return this.settingsService.deleteModel(id);
  }

  // Suppliers
  @Get('suppliers')
  getSuppliers() {
    return this.settingsService.getSuppliers();
  }

  @Post('suppliers')
  createSupplier(
    @Body(new ZodValidationPipe(CreateSupplierSchema)) data: CreateSupplierDto,
  ) {
    return this.settingsService.createSupplier(data);
  }

  @Patch('suppliers/:id')
  updateSupplier(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSupplierSchema)) data: UpdateSupplierDto,
  ) {
    return this.settingsService.updateSupplier(id, data);
  }

  @Delete('suppliers/:id')
  deleteSupplier(@Param('id') id: string) {
    return this.settingsService.deleteSupplier(id);
  }

  // Company Profiles
  @Get('company-profiles')
  getCompanyProfiles() {
    return this.settingsService.getCompanyProfiles();
  }

  @Post('company-profiles')
  createCompanyProfile(@Body() data: any) {
    return this.settingsService.createCompanyProfile(data);
  }

  @Patch('company-profiles/:id')
  updateCompanyProfile(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.settingsService.updateCompanyProfile(id, data);
  }

  @Delete('company-profiles/:id')
  deleteCompanyProfile(@Param('id') id: string) {
    return this.settingsService.deleteCompanyProfile(id);
  }

  // Countries
  @Get('countries')
  getCountries() {
    return this.settingsService.getCountries();
  }

  @Post('countries')
  createCountry(@Body() body: { name: string }) {
    return this.settingsService.createCountry(body);
  }

  @Patch('countries/:id')
  updateCountry(
    @Param('id') id: string,
    @Body() body: { name: string },
  ) {
    return this.settingsService.updateCountry(id, body);
  }

  @Delete('countries/:id')
  deleteCountry(@Param('id') id: string) {
    return this.settingsService.deleteCountry(id);
  }
}
