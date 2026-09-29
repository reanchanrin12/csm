import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  SupplierType,
  CreateBranchDto,
  UpdateBranchDto,
  CreateBrandDto,
  CreateModelDto,
  CreateSupplierDto,
  UpdateSupplierDto,
} from '@csm/contracts';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ================= BRANCHES =================
  async getBranches() {
    return this.prisma.branch.findMany({
      include: {
        _count: {
          select: { cars: true, employees: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createBranch(data: CreateBranchDto) {
    return this.prisma.branch.create({ data });
  }

  async updateBranch(id: string, data: UpdateBranchDto) {
    return this.prisma.branch.update({ where: { id }, data });
  }

  async deleteBranch(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: { _count: { select: { cars: true, employees: true } } },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    if (branch._count.cars > 0 || branch._count.employees > 0) {
      throw new BadRequestException('Cannot delete branch with active vehicles or employees');
    }
    return this.prisma.branch.delete({ where: { id } });
  }

  // ================= BRANDS & MODELS =================
  async getBrands() {
    return this.prisma.carBrand.findMany({
      include: {
        models: {
          include: {
            _count: { select: { vehicles: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createBrand(data: CreateBrandDto) {
    return this.prisma.carBrand.create({ data });
  }

  async createModel(data: CreateModelDto) {
    return this.prisma.carModel.create({ data });
  }

  async deleteModel(id: string) {
    const model = await this.prisma.carModel.findUnique({
      where: { id },
      include: { _count: { select: { vehicles: true } } },
    });
    if (!model) throw new NotFoundException('Model not found');
    if (model._count.vehicles > 0) {
      throw new BadRequestException('Cannot delete model with active vehicles in inventory');
    }
    return this.prisma.carModel.delete({ where: { id } });
  }

  // ================= SUPPLIERS =================
  async getSuppliers() {
    return this.prisma.supplier.findMany({
      include: {
        _count: { select: { vehicles: true, bills: true } },
      },
      orderBy: { nameEn: 'asc' },
    });
  }

  async createSupplier(data: CreateSupplierDto) {
    return this.prisma.supplier.create({ data });
  }

  async updateSupplier(
    id: string,
    data: UpdateSupplierDto,
  ) {
    return this.prisma.supplier.update({ where: { id }, data });
  }

  async deleteSupplier(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { vehicles: true, bills: true } } },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    if (supplier._count.vehicles > 0 || supplier._count.bills > 0) {
      throw new BadRequestException('Cannot delete supplier with linked vehicles or landed cost bills');
    }
    return this.prisma.supplier.delete({ where: { id } });
  }

  // ================= COMPANY PROFILES =================
  async getCompanyProfiles() {
    return (this.prisma.companyProfile as any).findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCompanyProfile(data: any) {
    return (this.prisma.companyProfile as any).create({
      data: {
        name: data.name,
        gender: data.gender,
        dob: data.dob ? new Date(data.dob) : undefined,
        phone: data.phone,
        job: data.job,
        email: data.email,
        address: data.address,
        logoUrl: data.logoUrl,
        note: data.note,
        isDefault: Boolean(data.isDefault),
      },
    });
  }

  async updateCompanyProfile(id: string, data: any) {
    const existing = await (this.prisma.companyProfile as any).findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Company profile not found');
    return (this.prisma.companyProfile as any).update({
      where: { id },
      data: {
        name: data.name,
        gender: data.gender,
        dob: data.dob ? new Date(data.dob) : undefined,
        phone: data.phone,
        job: data.job,
        email: data.email,
        address: data.address,
        logoUrl: data.logoUrl,
        note: data.note,
        isDefault: data.isDefault !== undefined ? Boolean(data.isDefault) : undefined,
      },
    });
  }

  async deleteCompanyProfile(id: string) {
    const existing = await (this.prisma.companyProfile as any).findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Company profile not found');
    return (this.prisma.companyProfile as any).delete({ where: { id } });
  }
}
