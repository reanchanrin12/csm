import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleStatus,
} from '@csm/contracts';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Fetch dropdown options for Car Purchasing Form
  async getFormOptions() {
    const [branches, brands, suppliers] = await Promise.all([
      this.prisma.branch.findMany({ select: { id: true, name: true } }),
      this.prisma.carBrand.findMany({
        select: {
          id: true,
          name: true,
          models: { select: { id: true, name: true } },
        },
      }),
      this.prisma.supplier.findMany({
        orderBy: [{ category: 'asc' }, { nameEn: 'asc' }],
        select: { id: true, nameEn: true, nameKh: true, category: true },
      }),
    ]);

    return { branches, brands, suppliers };
  }

  // 2. Create a new vehicle (Car Purchasing) — wrapped in transaction
  async createVehicle(dto: CreateVehicleDto) {
    // Check if VIN already exists
    const existing = await this.prisma.vehicle.findUnique({
      where: { vin: dto.vin },
    });
    if (existing) {
      throw new ConflictException(`Vehicle with VIN ${dto.vin} already exists!`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Resolve or create brand
      const brandName = (dto.brand && dto.brand.trim()) || 'MHERO';
      let brand = await tx.carBrand.findUnique({ where: { name: brandName } });
      if (!brand) {
        brand = await tx.carBrand.create({ data: { name: brandName } });
      }

      // 2. Resolve or create model under brand
      const modelName = (dto.model && dto.model.trim()) || '817';
      let model = await tx.carModel.findFirst({
        where: { brandId: brand.id, name: modelName },
      });
      if (!model) {
        model = await tx.carModel.create({
          data: { brandId: brand.id, name: modelName },
        });
      }

      // 3. Resolve or fallback branch
      let branchId = dto.branchId;
      if (!branchId || branchId.trim() === '') {
        const firstBranch = await tx.branch.findFirst();
        branchId = firstBranch ? firstBranch.id : (await tx.branch.create({ data: { name: 'MAIN BRANCH' } })).id;
      } else {
        const branchExists = await tx.branch.findUnique({ where: { id: branchId } });
        if (!branchExists) {
          const firstBranch = await tx.branch.findFirst();
          branchId = firstBranch ? firstBranch.id : (await tx.branch.create({ data: { name: 'MAIN BRANCH' } })).id;
        }
      }

      // 4. Resolve or fallback supplier
      let supplierId = dto.supplierId;
      if (!supplierId || supplierId.trim() === '') {
        const firstSupplier = await tx.supplier.findFirst();
        supplierId = firstSupplier ? firstSupplier.id : (await tx.supplier.create({ data: { nameEn: 'GENERAL SUPPLIER' } })).id;
      } else {
        const supplierExists = await tx.supplier.findUnique({ where: { id: supplierId } });
        if (!supplierExists) {
          const firstSupplier = await tx.supplier.findFirst();
          supplierId = firstSupplier ? firstSupplier.id : (await tx.supplier.create({ data: { nameEn: 'GENERAL SUPPLIER' } })).id;
        }
      }

      return tx.vehicle.create({
        data: {
          vin: dto.vin,
          engineNumber: dto.engineNumber,
          model: { connect: { id: model.id } },
          currentBranch: { connect: { id: branchId } },
          supplier: { connect: { id: supplierId } },
          madeYear: dto.madeYear || new Date().getFullYear(),
          cylinderDisp: dto.cylinderDisp,
          exteriorColor: dto.exteriorColor || 'WHITE',
          interiorColor: dto.interiorColor,
          fuelType: dto.fuelType || 'EV',
          batteryCapacity: dto.batteryCapacity,
          plateNumber: dto.plateNumber,
          registrationCard: dto.registrationCard,
          arrivalDate: dto.arrivalDate ? new Date(dto.arrivalDate) : null,
          coverImageUrl: dto.coverImageUrl,
          galleryImages: dto.galleryImages || [],
          purchaseCost: dto.purchaseCost ?? 0,
          inSalePrice: dto.inSalePrice ?? null,
          status: 'IN_STOCK',
        },
        include: {
          model: { include: { brand: true } },
          currentBranch: true,
          supplier: true,
        },
      });
    });
  }

  // 3. Update vehicle (status, price, plate, branch, etc.)
  async updateVehicle(id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);

    return this.prisma.$transaction(async (tx) => {
      let modelId = vehicle.modelId;

      // Re-resolve model only if brand/model changed
      if (dto.brand || dto.model) {
        const brandName = dto.brand ?? (await tx.carBrand.findUnique({
          where: { id: (await tx.carModel.findUnique({ where: { id: modelId } }))!.brandId },
        }))!.name;

        let brand = await tx.carBrand.findUnique({ where: { name: brandName } });
        if (!brand) brand = await tx.carBrand.create({ data: { name: brandName } });

        const modelName = dto.model ?? (await tx.carModel.findUnique({ where: { id: modelId } }))!.name;
        let model = await tx.carModel.findFirst({ where: { brandId: brand.id, name: modelName } });
        if (!model) model = await tx.carModel.create({ data: { brandId: brand.id, name: modelName } });
        modelId = model.id;
      }

      // Build update payload — only include fields that were provided
      const data: Prisma.VehicleUpdateInput = {};
      if (modelId !== vehicle.modelId) data.model = { connect: { id: modelId } };
      if (dto.vin !== undefined) data.vin = dto.vin;
      if (dto.madeYear !== undefined) data.madeYear = dto.madeYear;
      if (dto.cylinderDisp !== undefined) data.cylinderDisp = dto.cylinderDisp;
      if (dto.exteriorColor !== undefined) data.exteriorColor = dto.exteriorColor;
      if (dto.interiorColor !== undefined) data.interiorColor = dto.interiorColor;
      if (dto.fuelType !== undefined) data.fuelType = dto.fuelType;
      if (dto.batteryCapacity !== undefined) data.batteryCapacity = dto.batteryCapacity;
      if (dto.plateNumber !== undefined) data.plateNumber = dto.plateNumber;
      if (dto.registrationCard !== undefined) data.registrationCard = dto.registrationCard;
      if (dto.engineNumber !== undefined) data.engineNumber = dto.engineNumber;
      if (dto.arrivalDate !== undefined) data.arrivalDate = dto.arrivalDate ? new Date(dto.arrivalDate) : null;
      if (dto.coverImageUrl !== undefined) data.coverImageUrl = dto.coverImageUrl || null;
      if (dto.galleryImages !== undefined) data.galleryImages = dto.galleryImages;
      if (dto.purchaseCost !== undefined) data.purchaseCost = dto.purchaseCost;
      if (dto.inSalePrice !== undefined) data.inSalePrice = dto.inSalePrice;
      if (dto.status !== undefined) data.status = dto.status;
      if (dto.branchId) data.currentBranch = { connect: { id: dto.branchId } };
      if (dto.supplierId) data.supplier = { connect: { id: dto.supplierId } };

      return tx.vehicle.update({
        where: { id },
        data,
        include: {
          model: { include: { brand: true } },
          currentBranch: true,
          supplier: true,
        },
      });
    });
  }

  // 4. List vehicles with filtering — typed where clause
  async getVehicles(params?: {
    branchId?: string;
    brand?: string;
    status?: VehicleStatus;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.VehicleWhereInput = {};

    if (params?.branchId) {
      where.branchId = params.branchId;
    }
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.brand) {
      where.model = { brand: { name: params.brand } };
    }
    if (params?.search) {
      where.OR = [
        { vin: { contains: params.search, mode: 'insensitive' } },
        { model: { name: { contains: params.search, mode: 'insensitive' } } },
        { plateNumber: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      include: {
        model: { include: { brand: true } },
        currentBranch: true,
        supplier: true,
        costItems: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: params?.skip,
      take: params?.take,
    });

    // Map to VehicleSummary including dynamically calculated landed cost
    return vehicles.map((v) => {
      let clearanceCost = 0;
      let taxCost = 0;
      let transportCost = 0;
      let containerCost = 0;
      let laborCost = 0;
      let repairCost = 0;

      v.costItems.forEach((item) => {
        const amt = Number(item.amount);
        switch (item.costType) {
          case 'CLEARANCE':
            clearanceCost += amt;
            break;
          case 'TAX':
            taxCost += amt;
            break;
          case 'TRANSPORT':
            transportCost += amt;
            break;
          case 'CONTAINER':
            containerCost += amt;
            break;
          case 'LABOR':
            laborCost += amt;
            break;
          case 'REPAIR':
            repairCost += amt;
            break;
          default:
            break;
        }
      });

      // Sum all vehicle cost items to ensure no category (including ACCESSORY) is dropped
      const extraCosts = v.costItems.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
      );
      const totalLandedCost = Number(v.purchaseCost) + extraCosts;

      return {
        id: v.id,
        vin: v.vin,
        brand: v.model.brand.name,
        model: v.model.name,
        madeYear: v.madeYear,
        engineNumber: v.engineNumber,
        exteriorColor: v.exteriorColor,
        interiorColor: v.interiorColor,
        fuelType: v.fuelType,
        batteryCapacity: v.batteryCapacity,
        plateNumber: v.plateNumber,
        status: v.status,
        branchName: v.currentBranch.name,
        supplierName: v.supplier?.nameEn,
        coverImageUrl: v.coverImageUrl,
        purchaseCost: Number(v.purchaseCost),
        clearanceCost,
        taxCost,
        transportCost,
        containerCost,
        laborCost,
        repairCost,
        totalLandedCost,
        inSalePrice: v.inSalePrice ? Number(v.inSalePrice) : null,
        createdAt: v.createdAt.toISOString(),
      };
    });
  }

  // 5. Get single vehicle by ID or VIN
  async getVehicleById(idOrVin: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        OR: [{ id: idOrVin }, { vin: idOrVin }],
      },
      include: {
        model: { include: { brand: true } },
        currentBranch: true,
        supplier: true,
        costItems: { include: { bill: true } },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${idOrVin} not found`);
    }

    const extraCosts = vehicle.costItems.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    return {
      ...vehicle,
      purchaseCost: Number(vehicle.purchaseCost),
      inSalePrice: vehicle.inSalePrice ? Number(vehicle.inSalePrice) : null,
      totalLandedCost: Number(vehicle.purchaseCost) + extraCosts,
    };
  }
}
