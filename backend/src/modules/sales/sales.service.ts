import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateSaleOrderDto, LoanType } from '@csm/contracts';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Fetch options for creating a sale (In-stock cars, Customers, Sales staff)
  async getOptions() {
    const [vehicles, customers, employees] = await Promise.all([
      this.prisma.vehicle.findMany({
        where: { status: 'IN_STOCK' },
        include: {
          model: { include: { brand: true } },
          costItems: true,
          currentBranch: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
          idCard: true,
          address: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employee.findMany({
        where: { role: 'SALE' },
        select: {
          id: true,
          englishName: true,
          khmerName: true,
          phone: true,
        },
        orderBy: { englishName: 'asc' },
      }),
    ]);

    const formattedVehicles = vehicles.map((v) => {
      const extraCosts = v.costItems.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
      );
      const purchaseCost = Number(v.purchaseCost);
      const totalLandedCost = purchaseCost + extraCosts;

      return {
        id: v.id,
        vin: v.vin,
        displayName: `${v.madeYear} ${v.model.brand.name} ${v.model.name} (${v.vin})`,
        brand: v.model.brand.name,
        model: v.model.name,
        year: v.madeYear,
        color: v.exteriorColor,
        interiorColor: v.interiorColor || 'N/A',
        engineNumber: v.engineNumber || 'N/A',
        coverImageUrl: v.coverImageUrl,
        branch: v.currentBranch.name,
        purchaseCost,
        totalLandedCost,
        inSalePrice: v.inSalePrice ? Number(v.inSalePrice) : null,
      };
    });

    return {
      vehicles: formattedVehicles,
      customers,
      employees,
    };
  }

  async getCustomers() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCustomer(data: {
    name: string;
    phone: string;
    gender?: string;
    dob?: string;
    idCard?: string;
    address?: string;
    job?: string;
    email?: string;
    note?: string;
  }) {
    return this.prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        dob: data.dob ? new Date(data.dob) : undefined,
        idCard: data.idCard,
        address: data.address,
        job: data.job,
        email: data.email,
        note: data.note,
      },
    });
  }

  async updateCustomer(
    id: string,
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
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.dob !== undefined) updateData.dob = data.dob ? new Date(data.dob) : null;
    if (data.idCard !== undefined) updateData.idCard = data.idCard;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.job !== undefined) updateData.job = data.job;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.note !== undefined) updateData.note = data.note;

    return this.prisma.customer.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCustomer(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { _count: { select: { sales: true } } },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    if (customer._count.sales > 0) {
      throw new BadRequestException('Cannot delete customer with linked sale orders');
    }
    return this.prisma.customer.delete({ where: { id } });
  }

  // 2. Create Sale Order with optional Loan Schedule
  async createSaleOrder(dto: CreateSaleOrderDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
      include: { costItems: true },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle not found.`);
    }
    if (vehicle.status !== 'IN_STOCK') {
      throw new BadRequestException(
        `Vehicle ${vehicle.vin} is not available for sale (status: ${vehicle.status}).`,
      );
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer not found.`);
    }

    // Generate unique receipt number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await this.prisma.saleOrder.count();
    const receiptNo = `REC-${dateStr}-${String(countToday + 1).padStart(4, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      // Calculate net loan principal after down payment / deposit
      const downPayment = (dto.paidAmount || 0) + (dto.bookPrice || 0);
      const loanPrincipal = Math.max(0, Number(dto.soldPrice) - downPayment);

      // 1. Create Sale Order
      const saleOrder = await tx.saleOrder.create({
        data: {
          receiptNo,
          vehicleId: dto.vehicleId,
          customerId: dto.customerId,
          sellerEmployeeId: dto.sellerEmployeeId,
          soldPrice: dto.soldPrice,
          paidAmount: dto.paidAmount ?? 0,
          bookPrice: dto.bookPrice ?? 0,
          returnMoneyDate: dto.returnMoneyDate ? new Date(dto.returnMoneyDate) : null,
          paymentNotice: dto.paymentNotice,
          bankName: dto.bankName,
          bankApprovalRef: dto.bankApprovalRef,
          soldDate: dto.soldDate ? new Date(dto.soldDate) : new Date(),
          loanType: dto.loanType,
          interestRate: dto.interestRate,
          termMonths: dto.termMonths,
        },
      });

      // 2. Update Vehicle status to SOLD
      await tx.vehicle.update({
        where: { id: dto.vehicleId },
        data: { status: 'SOLD' },
      });

      // 3. Generate Loan Schedule if installment and there is remaining principal
      if (
        dto.loanType !== 'FULL_PAYMENT' &&
        dto.termMonths &&
        dto.termMonths > 0 &&
        loanPrincipal > 0
      ) {
        const principal = loanPrincipal;
        const months = dto.termMonths;
        const annualRate = (dto.interestRate || 0) / 100;
        const monthlyRate = annualRate / 12;

        const baseMonthlyPrincipal = principal / months;
        const soldDate = dto.soldDate ? new Date(dto.soldDate) : new Date();

        for (let i = 1; i <= months; i++) {
          const dueDate = new Date(soldDate);
          dueDate.setMonth(dueDate.getMonth() + i);

          let interest = 0;
          let monthlyPrincipal = baseMonthlyPrincipal;

          if (dto.loanType === 'INSTALLMENT_FLAT') {
            // Flat interest = Total Net Principal * Monthly Rate
            interest = principal * monthlyRate;
          } else if (dto.loanType === 'INSTALLMENT_DECLINING') {
            // Declining = Remaining Principal * Monthly Rate
            const remainingPrincipal = principal - baseMonthlyPrincipal * (i - 1);
            interest = Math.max(0, remainingPrincipal) * monthlyRate;
          } else if (dto.loanType === 'BANK_LOAN') {
            interest = 0;
          }

          await tx.loanSchedule.create({
            data: {
              saleOrderId: saleOrder.id,
              installmentNo: i,
              dueDate,
              principal: monthlyPrincipal,
              interest,
              totalDue: monthlyPrincipal + interest,
              status: 'PENDING',
            },
          });
        }
      }

      return tx.saleOrder.findUnique({
        where: { id: saleOrder.id },
        include: {
          customer: true,
          sellerEmployee: true,
          vehicle: {
            include: {
              model: { include: { brand: true } },
              costItems: true,
            },
          },
          schedules: {
            orderBy: { installmentNo: 'asc' },
          },
        },
      });
    });
  }

  // 3. List all Sale Orders with Landed Cost and Profit Margins
  async getSaleOrders() {
    const orders = await this.prisma.saleOrder.findMany({
      include: {
        customer: true,
        sellerEmployee: true,
        vehicle: {
          include: {
            model: { include: { brand: true } },
            costItems: true,
            currentBranch: true,
          },
        },
      },
      orderBy: { soldDate: 'desc' },
    });

    return orders.map((order) => {
      const purchaseCost = Number(order.vehicle.purchaseCost);
      let tax = 0;
      let clear = 0;
      let container = 0;
      let laborFee = 0;
      let transport = 0;
      let repair = 0;

      order.vehicle.costItems.forEach((item) => {
        const amt = Number(item.amount);
        if (item.costType === 'TAX') tax += amt;
        else if (item.costType === 'CLEARANCE') clear += amt;
        else if (item.costType === 'CONTAINER') container += amt;
        else if (item.costType === 'LABOR') laborFee += amt;
        else if (item.costType === 'TRANSPORT') transport += amt;
        else if (item.costType === 'REPAIR') repair += amt;
      });

      const extraCosts = order.vehicle.costItems.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
      );
      const totalLandedCost = purchaseCost + extraCosts;
      const soldPrice = Number(order.soldPrice);
      const grossProfit = soldPrice - totalLandedCost;
      const marginPercent =
        soldPrice > 0 ? (grossProfit / soldPrice) * 100 : 0;

      return {
        id: order.id,
        receiptNo: order.receiptNo,
        soldDate: order.soldDate.toISOString(),
        soldPrice,
        interestRate: order.interestRate ? Number(order.interestRate) : 0,
        purchaseCost,
        tax,
        clear,
        container,
        laborFee,
        transport,
        repair,
        totalLandedCost,
        grossProfit,
        marginPercent: Number(marginPercent.toFixed(2)),
        loanType: order.loanType,
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        sellerName: order.sellerEmployee
          ? order.sellerEmployee.khmerName || order.sellerEmployee.englishName
          : 'N/A',
        vehicle: {
          id: order.vehicle.id,
          vin: order.vehicle.vin,
          engineNumber: order.vehicle.engineNumber || 'N/A',
          brand: order.vehicle.model.brand.name,
          model: order.vehicle.model.name,
          madeYear: order.vehicle.madeYear,
          color: order.vehicle.exteriorColor,
          branch: order.vehicle.currentBranch?.name || 'PHNOM PENH',
          coverImageUrl: order.vehicle.coverImageUrl,
        },
      };
    });
  }

  // 4. Get detailed Sale Order for printable invoice & receipt
  async getSaleOrderById(id: string) {
    const order = await this.prisma.saleOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        sellerEmployee: { include: { branch: true } },
        vehicle: {
          include: {
            model: { include: { brand: true } },
            costItems: { include: { bill: { include: { supplier: true } } } },
            currentBranch: true,
          },
        },
        schedules: {
          orderBy: { installmentNo: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Sale order not found.`);
    }

    const purchaseCost = Number(order.vehicle.purchaseCost);
    const extraCosts = order.vehicle.costItems.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const totalLandedCost = purchaseCost + extraCosts;
    const soldPrice = Number(order.soldPrice);
    const grossProfit = soldPrice - totalLandedCost;

    return {
      id: order.id,
      receiptNo: order.receiptNo,
      soldDate: order.soldDate.toISOString(),
      soldPrice,
      totalLandedCost,
      grossProfit,
      loanType: order.loanType,
      interestRate: order.interestRate ? Number(order.interestRate) : 0,
      termMonths: order.termMonths || 0,
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone,
        idCard: order.customer.idCard,
        address: order.customer.address,
        gender: order.customer.gender,
        email: order.customer.email,
        dob: order.customer.dob ? order.customer.dob.toISOString() : null,
        job: order.customer.job,
        note: order.customer.note,
      },
      seller: order.sellerEmployee
        ? {
            id: order.sellerEmployee.id,
            englishName: order.sellerEmployee.englishName,
            khmerName: order.sellerEmployee.khmerName,
            phone: order.sellerEmployee.phone,
            branch: order.sellerEmployee.branch.name,
          }
        : null,
      vehicle: {
        id: order.vehicle.id,
        vin: order.vehicle.vin,
        brand: order.vehicle.model.brand.name,
        model: order.vehicle.model.name,
        madeYear: order.vehicle.madeYear,
        plateNumber: order.vehicle.plateNumber,
        color: order.vehicle.exteriorColor,
        interiorColor: order.vehicle.interiorColor,
        engineNumber: order.vehicle.engineNumber,
        cylinderDisp: order.vehicle.cylinderDisp,
        fuelType: order.vehicle.fuelType,
        batteryCapacity: order.vehicle.batteryCapacity,
        coverImageUrl: order.vehicle.coverImageUrl,
        purchaseCost: Number(order.vehicle.purchaseCost),
        inSalePrice: order.vehicle.inSalePrice ? Number(order.vehicle.inSalePrice) : null,
        branch: order.vehicle.currentBranch.name,
      },
      schedules: order.schedules.map((s) => ({
        id: s.id,
        installmentNo: s.installmentNo,
        dueDate: s.dueDate.toISOString(),
        principal: Number(s.principal),
        interest: Number(s.interest),
        totalDue: Number(s.totalDue),
        paidAmount: Number(s.paidAmount),
        status: s.status,
        paidDate: s.paidDate ? s.paidDate.toISOString() : null,
      })),
    };
  }

  // 5. Update Sale Order information (Price, Date, Customer)
  async updateSaleOrder(
    id: string,
    data: {
      soldPrice?: number;
      soldDate?: string;
      customerId?: string;
    },
  ) {
    const updateData: any = {};
    if (data.soldPrice !== undefined) updateData.soldPrice = data.soldPrice;
    if (data.soldDate !== undefined) updateData.soldDate = new Date(data.soldDate);
    if (data.customerId !== undefined) updateData.customerId = data.customerId;

    await this.prisma.saleOrder.update({
      where: { id },
      data: updateData,
    });

    return this.getSaleOrderById(id);
  }

  // 6. Delete / Cancel Sale Order and revert Vehicle status to IN_STOCK
  async deleteSaleOrder(id: string) {
    const order = await this.prisma.saleOrder.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException(`Sale order ${id} not found.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Delete associated loan schedules
      await tx.loanSchedule.deleteMany({
        where: { saleOrderId: id },
      });

      // 2. Revert vehicle status back to IN_STOCK
      await tx.vehicle.update({
        where: { id: order.vehicleId },
        data: { status: 'IN_STOCK' },
      });

      // 3. Delete the sale order itself
      return tx.saleOrder.delete({
        where: { id },
      });
    });
  }

  async getLoanOrders() {
    const orders = await this.prisma.saleOrder.findMany({
      include: {
        customer: true,
        vehicle: {
          include: {
            model: { include: { brand: true } },
          },
        },
        schedules: {
          orderBy: { installmentNo: 'asc' },
        },
      },
      orderBy: { soldDate: 'desc' },
    });

    return orders.map((order) => {
      const isFull = order.loanType === 'FULL_PAYMENT';
      const initialPaid = Number(order.paidAmount || 0) + Number(order.bookPrice || 0);

      // In Full Payment, if initialPaid was recorded, use it; otherwise fallback to soldPrice for legacy orders
      const totalPaid = isFull
        ? (initialPaid > 0 ? initialPaid : Number(order.soldPrice))
        : order.schedules.reduce(
            (sum, s) => sum + Number(s.paidAmount),
            0,
          ) + initialPaid;

      const totalDue = isFull
        ? Number(order.soldPrice)
        : order.schedules.reduce(
            (sum, s) => sum + Number(s.totalDue),
            0,
          ) + initialPaid;

      const monthlyPay = !isFull && order.schedules[0]
        ? Number(order.schedules[0].totalDue)
        : 0;

      // Format loan code like RS... (matching reference system RS46932026724)
      let loanCode = order.receiptNo;
      if (order.receiptNo.startsWith('REC-')) {
        const clean = order.receiptNo.replace('REC-', '').replace(/-/g, '');
        loanCode = `RS${clean}`;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return {
        id: order.id,
        loanCode,
        receiptNo: order.receiptNo,
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        brand: order.vehicle.model.brand.name,
        model: order.vehicle.model.name,
        vin: order.vehicle.vin,
        engine: order.vehicle.engineNumber || 'N/A',
        coverImageUrl: order.vehicle.coverImageUrl,
        soldPrice: Number(order.soldPrice),
        paidAmount: Number(order.paidAmount || 0),
        bookPrice: Number(order.bookPrice || 0),
        returnMoneyDate: order.returnMoneyDate ? order.returnMoneyDate.toISOString().slice(0, 10) : null,
        rate: order.interestRate ? Number(order.interestRate) : 0,
        soldDate: order.soldDate.toISOString().slice(0, 10),
        termMonths: order.termMonths || order.schedules.length,
        loanType: order.loanType,
        totalDue,
        totalPaid,
        balance: Math.max(0, totalDue - totalPaid),
        monthlyPay,
        schedulesCount: order.schedules.length,
        paidCount: order.schedules.filter((s) => s.status === 'PAID').length,
        schedules: order.schedules.map((s) => {
          let computedStatus: string = s.status;
          const due = new Date(s.dueDate);
          due.setHours(0, 0, 0, 0);

          if (s.status !== 'PAID' && due < today) {
            computedStatus = 'OVERDUE';
          }

          return {
            id: s.id,
            installmentNo: s.installmentNo,
            dueDate: s.dueDate.toISOString().slice(0, 10),
            principal: Number(s.principal),
            interest: Number(s.interest),
            totalDue: Number(s.totalDue),
            paidAmount: Number(s.paidAmount),
            status: computedStatus,
            paidDate: s.paidDate ? s.paidDate.toISOString().slice(0, 10) : null,
          };
        }),
      };
    });
  }

  async payInstallment(scheduleId: string, amount?: number) {
    const schedule = await this.prisma.loanSchedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule) {
      throw new NotFoundException('Installment schedule not found');
    }
    const payAmt = amount !== undefined ? amount : Number(schedule.totalDue);
    const newPaidTotal = Number(schedule.paidAmount) + payAmt;
    const totalDue = Number(schedule.totalDue);

    let status: 'PENDING' | 'PARTIAL' | 'PAID' = 'PENDING';
    if (newPaidTotal >= totalDue) {
      status = 'PAID';
    } else if (newPaidTotal > 0) {
      status = 'PARTIAL';
    }

    return this.prisma.loanSchedule.update({
      where: { id: scheduleId },
      data: {
        paidAmount: Math.min(newPaidTotal, totalDue),
        status,
        paidDate: new Date(),
      },
    });
  }
}
