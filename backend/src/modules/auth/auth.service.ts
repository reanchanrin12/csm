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
  private readonly jwtRefreshSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'csm-super-secret-key-automotive-voyah-2026';
    this.jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      `${this.jwtSecret}-csm-refresh-v1`;
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

  signJwt(payload: object, expiresInSeconds: number = 86400 * 7, customSecret?: string): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const fullPayload = { ...payload, exp };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const secret = customSecret || this.jwtSecret;
    const signature = createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  signRefreshToken(authUser: AuthUser, expiresInSeconds: number = 86400 * 30): string {
    const payload = {
      id: authUser.id,
      username: authUser.username,
      role: authUser.role,
      type: 'refresh',
    };
    return this.signJwt(payload, expiresInSeconds, this.jwtRefreshSecret);
  }

  verifyJwt<T extends object>(token: string, customSecret?: string): T {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid token format');
    }
    const [header, payload, signature] = parts;
    if (!header || !payload || !signature) {
      throw new UnauthorizedException('Malformed token');
    }

    const secret = customSecret || this.jwtSecret;
    const expectedSignature = createHmac('sha256', secret)
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

  /**
   * Validates cryptographic signature and extracts payload even if expired,
   * provided it expired within the grace period (e.g. 30 days).
   */
  verifyTokenAllowExpired<T extends object>(token: string, customSecret?: string): T {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid token format');
    }
    const [header, payload, signature] = parts;
    if (!header || !payload || !signature) {
      throw new UnauthorizedException('Malformed token');
    }

    const secret = customSecret || this.jwtSecret;
    const expectedSignature = createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid token signature');
    }

    try {
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);
      // Allow renewal if expired within 30 days grace window
      if (decoded.exp && decoded.exp < now - 86400 * 30) {
        throw new UnauthorizedException('Token expired beyond grace renewal period');
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

    const accessToken = this.signJwt(authUser, 86400 * 7);
    const refreshToken = this.signRefreshToken(authUser, 86400 * 30);

    return {
      user: authUser,
      accessToken,
      refreshToken,
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

  async refreshToken(tokenOrUserId: string): Promise<AuthResponse> {
    let targetUserId = tokenOrUserId;

    // If it contains a dot, it's a JWT token that needs parsing and verification
    if (tokenOrUserId.includes('.')) {
      let decodedPayload: { id?: string; sub?: string } | null = null;

      // 1. Try verify with refresh secret (active unexpired refresh token)
      try {
        decodedPayload = this.verifyJwt<{ id?: string; sub?: string }>(
          tokenOrUserId,
          this.jwtRefreshSecret,
        );
      } catch {
        // 2. Try verify with standard secret (active unexpired access token)
        try {
          decodedPayload = this.verifyJwt<{ id?: string; sub?: string }>(
            tokenOrUserId,
            this.jwtSecret,
          );
        } catch {
          // 3. Try verify with refresh secret allowing expired within 30-day grace
          try {
            decodedPayload = this.verifyTokenAllowExpired<{ id?: string; sub?: string }>(
              tokenOrUserId,
              this.jwtRefreshSecret,
            );
          } catch {
            // 4. Try verify with standard secret allowing expired within 30-day grace
            try {
              decodedPayload = this.verifyTokenAllowExpired<{ id?: string; sub?: string }>(
                tokenOrUserId,
                this.jwtSecret,
              );
            } catch {
              throw new UnauthorizedException('Invalid or expired refresh token');
            }
          }
        }
      }

      const extractedId = decodedPayload?.id || decodedPayload?.sub;
      if (!extractedId) {
        throw new UnauthorizedException('Token payload does not contain user identification');
      }
      targetUserId = extractedId;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
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

    const accessToken = this.signJwt(authUser, 86400 * 7);
    const refreshToken = this.signRefreshToken(authUser, 86400 * 30);

    return {
      user: authUser,
      accessToken,
      refreshToken,
    };
  }
}

