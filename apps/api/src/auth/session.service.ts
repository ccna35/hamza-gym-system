import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';

export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

@Injectable()
export class SessionService {
  private readonly cookieName: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.cookieName = config.get<string>('SESSION_COOKIE_NAME', 'gym_session');
  }

  getCookieName() {
    return this.cookieName;
  }

  async create(ownerId: string) {
    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await this.prisma.session.create({
      data: { ownerId, sessionTokenHash: hashSessionToken(token), expiresAt },
    });
    return { token, expiresAt };
  }

  findActive(token: string) {
    return this.prisma.session.findFirst({
      where: { sessionTokenHash: hashSessionToken(token), expiresAt: { gt: new Date() } },
      include: { owner: true },
    });
  }

  revoke(token: string) {
    return this.prisma.session.deleteMany({ where: { sessionTokenHash: hashSessionToken(token) } });
  }

  revokeOtherSessions(ownerId: string, currentToken: string) {
    return this.prisma.session.deleteMany({
      where: { ownerId, sessionTokenHash: { not: hashSessionToken(currentToken) } },
    });
  }

  cookieOptions(expiresAt: Date) {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    };
  }

  clearCookieOptions() {
    return { ...this.cookieOptions(new Date(0)), expires: new Date(0), maxAge: 0 };
  }
}
