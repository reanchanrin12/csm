import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateTransferDto {
  vehicleId: string;
  destBranchId: string;
  transferDate?: string;
  note?: string;
}

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Get options for transfer (Vehicles in stock + Branches)
  async getOptions() {
    const [vehicles, branches] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: { status: 'IN_STOCK' },
        include: {
          model: { include: { brand: true } },
          currentBranch: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.branch.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      vehicles: vehicles.map((v) => ({
        id: v.id,
        vin: v.vin,
        displayName: `${v.madeYear} ${v.model.brand.name} ${v.model.name} (${v.vin})`,
        currentBranchId: v.branchId,
        currentBranchName: v.currentBranch.name,
      })),
      branches: branches.map((b) => ({
        id: b.id,
        name: b.name,
        address: b.address,
      })),
    };
  }

  // 2. Execute a vehicle branch transfer
  async createTransfer(dto: CreateTransferDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
      include: { currentBranch: true },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle not found.`);
    }

    if (vehicle.status !== 'IN_STOCK') {
      throw new BadRequestException(
        `Only IN_STOCK vehicles can be transferred. Current status: ${vehicle.status}`,
      );
    }

    if (vehicle.branchId === dto.destBranchId) {
      throw new BadRequestException(
        `Vehicle is already located at this branch (${vehicle.currentBranch.name}).`,
      );
    }

    const destBranch = await this.prisma.branch.findUnique({
      where: { id: dto.destBranchId },
    });
    if (!destBranch) {
      throw new NotFoundException(`Destination branch not found.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create transfer history record
      const transfer = await tx.vehicleTransfer.create({
        data: {
          vehicleId: dto.vehicleId,
          sourceBranchId: vehicle.branchId,
          destBranchId: dto.destBranchId,
          transferDate: dto.transferDate ? new Date(dto.transferDate) : new Date(),
          note: dto.note,
        },
        include: {
          sourceBranch: true,
          destBranch: true,
          vehicle: {
            include: { model: { include: { brand: true } } },
          },
        },
      });

      // 2. Update vehicle current branch
      await tx.vehicle.update({
        where: { id: dto.vehicleId },
        data: { branchId: dto.destBranchId },
      });

      return {
        id: transfer.id,
        transferDate: transfer.transferDate.toISOString(),
        vehicleVin: transfer.vehicle.vin,
        vehicleName: `${transfer.vehicle.madeYear} ${transfer.vehicle.model.brand.name} ${transfer.vehicle.model.name}`,
        brand: transfer.vehicle.model.brand.name,
        model: transfer.vehicle.model.name,
        madeYear: transfer.vehicle.madeYear,
        sourceBranch: transfer.sourceBranch.name,
        destBranch: transfer.destBranch.name,
        note: transfer.note,
      };
    });
  }

  // 3. Get all transfers history
  async getTransfers() {
    const transfers = await this.prisma.vehicleTransfer.findMany({
      include: {
        sourceBranch: true,
        destBranch: true,
        vehicle: {
          include: { model: { include: { brand: true } } },
        },
      },
      orderBy: { transferDate: 'desc' },
    });

    return transfers.map((t) => ({
      id: t.id,
      transferDate: t.transferDate.toISOString(),
      vehicleVin: t.vehicle.vin,
      vehicleName: `${t.vehicle.madeYear} ${t.vehicle.model.brand.name} ${t.vehicle.model.name}`,
      brand: t.vehicle.model.brand.name,
      model: t.vehicle.model.name,
      madeYear: t.vehicle.madeYear,
      sourceBranch: t.sourceBranch.name,
      destBranch: t.destBranch.name,
      note: t.note,
      createdAt: t.createdAt.toISOString(),
    }));
  }
}
