import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'crypto';
import type { LoginDto, AuthResponse, AuthUser } from '@csm/contracts';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'csm-super-secret-key-automotive-voyah-2026';
  }

  hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(password, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  verifyPassword(password: string, storedHash: string): boolean {
    try {
      const [salt, key] = storedHash.split(':');
      if (!salt || !key) return false;
      const keyBuffer = Buffer.from(key, 'hex');
      const derivedKey = scryptSync(password, salt, 64);
      if (keyBuffer.length !== derivedKey.length) return false;
      return timingSafeEqual(keyBuffer, derivedKey);
    } catch {
      return false;
    }
  }

  signJwt(payload: object, expiresInSeconds: number = 86400 * 7): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const fullPayload = { ...payload, exp };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signature = createHmac('sha256', this.jwtSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verifyJwt<T extends object>(token: string): T {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid token format');
    }
    const [header, payload, signature] = parts;
    if (!header || !payload || !signature) {
      throw new UnauthorizedException('Malformed token');
    }

    const expectedSignature = createHmac('sha256', this.jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid token signature');
    }

    try {
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Token has expired');
      }
      return decoded as T;
    } catch {
      throw new UnauthorizedException('Invalid token payload');
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
      include: {
        employee: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវឡើយ');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'This account has been deactivated. Please contact your administrator.',
      );
    }

    const isValid = this.verifyPassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវឡើយ');
    }

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      employeeId: user.employeeId,
      employeeName: user.employee
        ? user.employee.khmerName || user.employee.englishName
        : undefined,
      branchName: user.employee?.branch?.name,
    };

    const accessToken = this.signJwt(authUser);

    return {
      user: authUser,
      accessToken,
    };
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      employeeId: user.employeeId,
      employeeName: user.employee
        ? user.employee.khmerName || user.employee.englishName
        : undefined,
      branchName: user.employee?.branch?.name,
    };
  }

  async refreshToken(userId: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is invalid or deactivated');
    }

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      employeeId: user.employeeId,
      employeeName: user.employee
        ? user.employee.khmerName || user.employee.englishName
        : undefined,
      branchName: user.employee?.branch?.name,
    };

    const accessToken = this.signJwt(authUser);

    return {
      user: authUser,
      accessToken,
    };
  }
}

