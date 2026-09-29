import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  CreateSalaryPaymentDto,
} from '@csm/contracts';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Get all employees with branch and sales count
  async getEmployees() {
    const [employees, branches] = await Promise.all([
      this.prisma.employee.findMany({
        include: {
          branch: true,
          sales: { select: { id: true } },
        },
        orderBy: { englishName: 'asc' },
      }),
      this.prisma.branch.findMany({
        select: { id: true, name: true },
      }),
    ]);

    const formatted = employees.map((e) => ({
      id: e.id,
      englishName: e.englishName,
      khmerName: e.khmerName,
      gender: e.gender,
      dob: e.dob ? e.dob.toISOString().slice(0, 10) : null,
      phone: e.phone,
      email: e.email,
      idCard: e.idCard,
      address: e.address,
      jobPosition: e.jobPosition,
      role: e.role,
      salary: Number(e.salary),
      startWork: e.startWork ? e.startWork.toISOString().slice(0, 10) : null,
      branchId: e.branchId,
      branchName: e.branch.name,
      note: e.note,
      salesCount: e.sales.length,
      createdAt: e.createdAt.toISOString(),
    }));

    return {
      employees: formatted,
      branches,
    };
  }

  // 2. Create employee
  async createEmployee(dto: CreateEmployeeDto) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
    });
    if (!branch) {
      throw new NotFoundException(`Branch not found.`);
    }

    const created = await this.prisma.employee.create({
      data: {
        englishName: dto.englishName,
        khmerName: dto.khmerName || null,
        gender: dto.gender || null,
        dob: dto.dob ? new Date(dto.dob) : null,
        phone: dto.phone,
        email: dto.email || null,
        idCard: dto.idCard || null,
        address: dto.address || null,
        jobPosition: dto.jobPosition || null,
        role: dto.role,
        salary: dto.salary,
        startWork: dto.startWork ? new Date(dto.startWork) : null,
        branchId: dto.branchId,
        note: dto.note || null,
      },
      include: { branch: true },
    });

    return {
      id: created.id,
      englishName: created.englishName,
      khmerName: created.khmerName,
      role: created.role,
      phone: created.phone,
      salary: Number(created.salary),
      branchName: created.branch.name,
    };
  }

  // 3. Update employee
  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Employee not found.`);
    }

    if (dto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: dto.branchId },
      });
      if (!branch) {
        throw new NotFoundException(`Branch not found.`);
      }
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        englishName: dto.englishName,
        khmerName: dto.khmerName !== undefined ? dto.khmerName : undefined,
        gender: dto.gender !== undefined ? dto.gender : undefined,
        dob: dto.dob !== undefined ? (dto.dob ? new Date(dto.dob) : null) : undefined,
        phone: dto.phone,
        email: dto.email !== undefined ? dto.email : undefined,
        idCard: dto.idCard !== undefined ? dto.idCard : undefined,
        address: dto.address !== undefined ? dto.address : undefined,
        jobPosition: dto.jobPosition !== undefined ? dto.jobPosition : undefined,
        role: dto.role,
        salary: dto.salary !== undefined ? dto.salary : undefined,
        startWork: dto.startWork !== undefined ? (dto.startWork ? new Date(dto.startWork) : null) : undefined,
        branchId: dto.branchId,
        note: dto.note !== undefined ? dto.note : undefined,
      },
      include: { branch: true },
    });

    return {
      id: updated.id,
      englishName: updated.englishName,
      khmerName: updated.khmerName,
      role: updated.role,
      phone: updated.phone,
      salary: Number(updated.salary),
      branchName: updated.branch.name,
    };
  }

  // 4. Delete employee with integrity check
  async deleteEmployee(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { sales: { select: { id: true } } },
    });

    if (!employee) {
      throw new NotFoundException(`Employee not found.`);
    }

    if (employee.sales.length > 0) {
      throw new BadRequestException(
        `Cannot delete employee ${employee.englishName} because they have ${employee.sales.length} sale order(s) attached.`,
      );
    }

    await this.prisma.employee.delete({
      where: { id },
    });

    return { success: true, message: `Employee deleted successfully.` };
  }

  // 5. Get Salary Payments
  async getSalaryPayments() {
    const payments = await this.prisma.salaryPayment.findMany({
      include: {
        employee: {
          include: { branch: true },
        },
      },
      orderBy: { paidDate: 'desc' },
    });

    return payments.map((p) => ({
      id: p.id,
      employeeId: p.employeeId,
      employeeName: p.employee.englishName,
      employeeKhmerName: p.employee.khmerName,
      paidDate: p.paidDate.toISOString().slice(0, 10),
      payAmount: Number(p.payAmount),
      actualSalary: Number(p.actualSalary),
      payStatus: p.payStatus,
      description: p.description,
      branchName: p.employee.branch.name,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  // 6. Create Salary Payment
  async createSalaryPayment(dto: CreateSalaryPaymentDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      include: { branch: true },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const created = await this.prisma.salaryPayment.create({
      data: {
        employeeId: dto.employeeId,
        paidDate: new Date(dto.paidDate),
        payAmount: dto.payAmount,
        actualSalary: dto.actualSalary,
        payStatus: dto.payStatus || 'full payment',
        description: dto.description || null,
      },
      include: {
        employee: {
          include: { branch: true },
        },
      },
    });

    return {
      id: created.id,
      employeeId: created.employeeId,
      employeeName: created.employee.englishName,
      employeeKhmerName: created.employee.khmerName,
      paidDate: created.paidDate.toISOString().slice(0, 10),
      payAmount: Number(created.payAmount),
      actualSalary: Number(created.actualSalary),
      payStatus: created.payStatus,
      description: created.description,
      branchName: created.employee.branch.name,
      createdAt: created.createdAt.toISOString(),
    };
  }

  // 7. Delete Salary Payment
  async deleteSalaryPayment(id: string) {
    const existing = await this.prisma.salaryPayment.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Salary payment record not found');
    }

    await this.prisma.salaryPayment.delete({
      where: { id },
    });

    return { success: true, message: 'Salary payment record deleted successfully' };
  }
}
