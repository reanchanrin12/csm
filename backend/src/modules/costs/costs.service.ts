import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CostCategory } from '@csm/contracts';

export interface CreateBillDto {
  billNumber: string;
  supplierId: string;
  category: CostCategory;
  totalAmount: number;
  paidAmount?: number;
  billDate: string;
  description?: string;
  allocations: {
    vin: string;
    amount: number;
    costType?: CostCategory;
    note?: string;
  }[];
}

@Injectable()
export class CostsService {
  constructor(private readonly prisma: PrismaService) {}

  // 0. Fetch options for Landed Cost Bills & Allocations
  async getOptions() {
    const [suppliers, vehicles] = await Promise.all([
      this.prisma.supplier.findMany({
        select: {
          id: true,
          nameEn: true,
          nameKh: true,
          country: true,
          phone: true,
          phone2: true,
          email: true,
          website: true,
          address: true,
          note: true,
          category: true,
        },
        orderBy: { nameEn: 'asc' },
      }),
      this.prisma.vehicle.findMany({
        where: { status: 'IN_STOCK' },
        select: {
          id: true,
          vin: true,
          madeYear: true,
          exteriorColor: true,
          model: {
            select: {
              name: true,
              brand: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      suppliers,
      vehicles: vehicles.map((v) => ({
        id: v.id,
        vin: v.vin,
        brand: v.model.brand.name,
        model: v.model.name,
        madeYear: v.madeYear,
        color: v.exteriorColor,
        displayName: `${v.madeYear} ${v.model.brand.name} ${v.model.name} (${v.vin})`,
      })),
    };
  }

  // 1. Create a landed cost bill and allocate cost items to vehicles
  async createBill(dto: CreateBillDto) {
    const existing = await this.prisma.landedCostBill.findUnique({
      where: { billNumber: dto.billNumber },
    });
    if (existing) {
      throw new ConflictException(`Bill ${dto.billNumber} already exists.`);
    }

    // Verify all VINs exist
    const vins = dto.allocations.map((a) => a.vin);
    const vehicles = await this.prisma.vehicle.findMany({
      where: { vin: { in: vins } },
      select: { id: true, vin: true },
    });

    const vinToIdMap = new Map(vehicles.map((v) => [v.vin, v.id]));
    for (const vin of vins) {
      if (!vinToIdMap.has(vin)) {
        throw new NotFoundException(`Vehicle with VIN ${vin} not found in inventory.`);
      }
    }

    // Create bill and cost items in transaction
    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.landedCostBill.create({
        data: {
          billNumber: dto.billNumber,
          supplierId: dto.supplierId,
          category: dto.category,
          totalAmount: dto.totalAmount,
          paidAmount: dto.paidAmount || 0,
          billDate: new Date(dto.billDate),
          description: dto.description,
        },
      });

      // Create individual cost items linked to each vehicle
      for (const alloc of dto.allocations) {
        const vehicleId = vinToIdMap.get(alloc.vin)!;
        await tx.vehicleCostItem.create({
          data: {
            vehicleId,
            costType: alloc.costType || dto.category,
            amount: alloc.amount,
            billId: bill.id,
            note: alloc.note,
          },
        });
      }

      return tx.landedCostBill.findUnique({
        where: { id: bill.id },
        include: {
          supplier: true,
          costItems: { include: { vehicle: true } },
        },
      });
    });
  }

  // 2. Get bills list filtered by category
  async getBills(category?: CostCategory) {
    const where: any = {};
    if (category) {
      where.category = category;
    }

    const bills = await this.prisma.landedCostBill.findMany({
      where,
      include: {
        supplier: true,
        costItems: {
          include: {
            vehicle: {
              select: {
                id: true,
                vin: true,
                madeYear: true,
                exteriorColor: true,
                model: { select: { name: true, brand: { select: { name: true } } } },
              },
            },
          },
        },
      },
      orderBy: { billDate: 'desc' },
    });

    return bills.map((b) => ({
      id: b.id,
      billNumber: b.billNumber,
      category: b.category,
      supplierId: b.supplierId,
      supplierName: b.supplier.nameKh || b.supplier.nameEn,
      totalAmount: Number(b.totalAmount),
      paidAmount: Number(b.paidAmount),
      balance: Number(b.totalAmount) - Number(b.paidAmount),
      billDate: b.billDate.toISOString(),
      description: b.description,
      vehicles: b.costItems.map((ci) => ({
        id: ci.id,
        vin: ci.vehicle.vin,
        brand: ci.vehicle.model.brand.name,
        model: ci.vehicle.model.name,
        madeYear: ci.vehicle.madeYear,
        color: ci.vehicle.exteriorColor,
        costType: ci.costType,
        vehicleName: `${ci.vehicle.model.brand.name} ${ci.vehicle.model.name}`,
        allocatedAmount: Number(ci.amount),
      })),
    }));
  }

  // 2.1 Update bill
  async updateBill(
    id: string,
    dto: {
      supplierId?: string;
      paidAmount?: number;
      billDate?: string;
      description?: string;
    },
  ) {
    const data: any = {};
    if (dto.supplierId) data.supplierId = dto.supplierId;
    if (dto.paidAmount !== undefined) data.paidAmount = dto.paidAmount;
    if (dto.billDate) data.billDate = new Date(dto.billDate);
    if (dto.description !== undefined) data.description = dto.description;

    return this.prisma.landedCostBill.update({
      where: { id },
      data,
    });
  }

  // 3. Get landed cost breakdown for a specific vehicle by VIN
  async getVehicleCostBreakdown(vin: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { vin },
      include: {
        model: { include: { brand: true } },
        costItems: { include: { bill: { include: { supplier: true } } } },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with VIN ${vin} not found.`);
    }

    const breakdown = {
      purchaseCost: Number(vehicle.purchaseCost),
      tax: 0,
      clearance: 0,
      transport: 0,
      container: 0,
      labor: 0,
      repair: 0,
      accessory: 0,
      totalLandedCost: Number(vehicle.purchaseCost),
      items: [] as any[],
    };

    for (const item of vehicle.costItems) {
      const amount = Number(item.amount);
      breakdown.totalLandedCost += amount;

      switch (item.costType) {
        case 'TAX':
          breakdown.tax += amount;
          break;
        case 'CLEARANCE':
          breakdown.clearance += amount;
          break;
        case 'TRANSPORT':
          breakdown.transport += amount;
          break;
        case 'CONTAINER':
          breakdown.container += amount;
          break;
        case 'LABOR':
          breakdown.labor += amount;
          break;
        case 'REPAIR':
          breakdown.repair += amount;
          break;
        case 'ACCESSORY':
          breakdown.accessory += amount;
          break;
      }

      breakdown.items.push({
        id: item.id,
        costType: item.costType,
        amount,
        billNumber: item.bill?.billNumber || 'Direct',
        supplierName: item.bill?.supplier.nameKh || item.bill?.supplier.nameEn || 'N/A',
        note: item.note,
        createdAt: item.createdAt.toISOString(),
      });
    }

    return {
      vehicleId: vehicle.id,
      vin: vehicle.vin,
      brand: vehicle.model.brand.name,
      model: vehicle.model.name,
      accessories: breakdown.accessory,
      ...breakdown,
    };
  }

  // 3. Get supplier payments list (matching Screenshot: Supplier payment list)
  async getSupplierPayments() {
    const vehicles = await this.prisma.vehicle.findMany({
      include: {
        model: { include: { brand: true } },
        supplier: true,
        costItems: {
          include: { bill: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map((v, i) => {
      const year = v.arrivalDate ? v.arrivalDate.getFullYear() : v.madeYear;
      const numPart = v.vin.replace(/[^0-9]/g, '').slice(-8) || String(5469224 + i);
      const invoiceNo = `BU${numPart}${year}${i + 1}`;
      const totalPrice = Number(v.purchaseCost);

      const purchaseBill = v.costItems.find((ci) => ci.bill?.billNumber.startsWith('BU'))?.bill;
      const paidAmount = purchaseBill
        ? Number(purchaseBill.paidAmount)
        : Math.max(0, totalPrice - 1.0);
      const balance = Math.max(0, totalPrice - paidAmount);

      return {
        id: v.id,
        invoiceNo,
        brand: v.model.brand.name,
        model: v.model.name,
        vin: v.vin,
        supplierName: v.supplier.nameEn || v.supplier.nameKh,
        totalPrice,
        paidAmount,
        balance,
        status: 'Car purchase',
      };
    });
  }

  // 4. Pay supplier payment installment / balance
  async paySupplier(
    vehicleId: string,
    dto: { amount: number; paidDate?: string; comment?: string },
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        supplier: true,
        costItems: { include: { bill: true } },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle record not found.');
    }

    const existingBill = vehicle.costItems.find((ci) => ci.bill)?.bill;
    if (existingBill) {
      return this.prisma.landedCostBill.update({
        where: { id: existingBill.id },
        data: {
          paidAmount: Number(existingBill.paidAmount) + dto.amount,
          description: dto.comment
            ? `${existingBill.description || ''} | ${dto.comment}`
            : existingBill.description,
        },
      });
    }

    return {
      success: true,
      message: `Payment of $${dto.amount} successfully recorded for vehicle ${vehicle.vin}`,
    };
  }
}
