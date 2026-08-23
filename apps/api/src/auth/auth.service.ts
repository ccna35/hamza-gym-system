import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PasswordService } from './password.service';
import { hashSessionToken, SessionService } from './session.service';
import { LoginRateLimiterService } from './login-rate-limiter.service';

export type OwnerSummary = { id: string; username: string; mustChangePassword: boolean };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly rateLimiter: LoginRateLimiterService,
  ) {}

  async login(username: string, password: string, ip = 'unknown') {
    if (this.rateLimiter.isLimited(ip, username)) {
      throw new HttpException(
        { code: 'TOO_MANY_LOGIN_ATTEMPTS', message: 'محاولات الدخول كثيرة، حاول لاحقاً' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const owner = await this.prisma.owner.findUnique({ where: { username } });
    if (!owner || !(await this.passwords.verify(owner.passwordHash, password))) {
      this.rateLimiter.recordFailure(ip, username);
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'بيانات الدخول غير صحيحة',
      });
    }

    this.rateLimiter.reset(ip, username);
    const session = await this.sessions.create(owner.id);
    return {
      owner: this.summary(owner),
      session,
    };
  }

  summary(owner: { id: string; username: string; mustChangePassword: boolean }): OwnerSummary {
    return { id: owner.id, username: owner.username, mustChangePassword: owner.mustChangePassword };
  }

  async changePassword(
    ownerId: string,
    currentPassword: string,
    newPassword: string,
    currentToken: string,
  ) {
    const owner = await this.prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner || !(await this.passwords.verify(owner.passwordHash, currentPassword))) {
      throw new BadRequestException({
        code: 'CURRENT_PASSWORD_INCORRECT',
        message: 'كلمة المرور الحالية غير صحيحة',
      });
    }

    const passwordHash = await this.passwords.hash(newPassword);
    await this.prisma.$transaction([
      this.prisma.owner.update({
        where: { id: ownerId },
        data: { passwordHash, mustChangePassword: false },
      }),
      this.prisma.session.deleteMany({
        where: { ownerId, sessionTokenHash: { not: this.sessionsHash(currentToken) } },
      }),
    ]);
  }

  private sessionsHash(token: string) {
    return hashSessionToken(token);
  }
}
