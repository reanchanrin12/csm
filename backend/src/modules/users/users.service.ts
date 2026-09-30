import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import type {
  CreateUserDto,
  UpdateUserDto,
  UserSummary,
} from '@csm/contracts';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getUsers() {
    const [users, allEmployees] = await Promise.all([
      this.prisma.user.findMany({
        include: {
          employee: {
            include: {
              branch: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma.employee as any).findMany({
        include: {
          branch: true,
          user: { select: { id: true } },
        },
        orderBy: { englishName: 'asc' },
      }),
    ]);

    const formattedUsers: UserSummary[] = (users as any[]).map((u: any) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      isActive: u.isActive,
      employeeId: u.employeeId,
      employeeName: u.employee
        ? u.employee.khmerName
          ? `${u.employee.englishName} (${u.employee.khmerName})`
          : u.employee.englishName
        : undefined,
      createdAt: new Date(u.createdAt).toISOString(),
      updatedAt: new Date(u.updatedAt).toISOString(),
    }));

    const employeesList = (allEmployees as any[]).map((e: any) => ({
      id: e.id,
      englishName: e.englishName,
      khmerName: e.khmerName,
      branchName: e.branch?.name || '',
      hasAccount: Boolean(e.user),
    }));

    return {
      users: formattedUsers,
      employees: employeesList,
    };
  }

  async createUser(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException(`Username "${dto.username}" is already taken.`);
    }

    if (dto.employeeId) {
      const existingEmployeeUser = await this.prisma.user.findUnique({
        where: { employeeId: dto.employeeId },
      });
      if (existingEmployeeUser) {
        throw new ConflictException(
          'This employee already has a system user account.',
        );
      }
    }

    const passwordHash = this.authService.hashPassword(dto.password);

    const created = await this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        role: dto.role,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        employeeId: dto.employeeId || null,
      },
      include: {
        employee: {
          include: { branch: true },
        },
      },
    });

    return {
      id: created.id,
      username: created.username,
      role: created.role,
      isActive: created.isActive,
      employeeId: created.employeeId,
      employeeName: created.employee
        ? created.employee.khmerName || created.employee.englishName
        : undefined,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (dto.username && dto.username !== user.username) {
      const duplicate = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (duplicate) {
        throw new ConflictException(`Username "${dto.username}" is already taken.`);
      }
    }

    if (dto.employeeId && dto.employeeId !== user.employeeId) {
      const duplicateEmp = await this.prisma.user.findUnique({
        where: { employeeId: dto.employeeId },
      });
      if (duplicateEmp) {
        throw new ConflictException(
          'This employee already has an associated user account.',
        );
      }
    }

    const dataToUpdate: any = {};
    if (dto.username) dataToUpdate.username = dto.username;
    if (dto.role) dataToUpdate.role = dto.role;
    if (dto.isActive !== undefined) dataToUpdate.isActive = dto.isActive;
    if (dto.employeeId !== undefined) dataToUpdate.employeeId = dto.employeeId || null;
    if (dto.password && dto.password.trim().length > 0) {
      dataToUpdate.passwordHash = this.authService.hashPassword(dto.password);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: {
        employee: {
          include: { branch: true },
        },
      },
    });

    return {
      id: updated.id,
      username: updated.username,
      role: updated.role,
      isActive: updated.isActive,
      employeeId: updated.employeeId,
      employeeName: updated.employee
        ? updated.employee.khmerName || updated.employee.englishName
        : undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User not found.`);
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true, message: `User "${user.username}" deleted successfully.` };
  }
}
