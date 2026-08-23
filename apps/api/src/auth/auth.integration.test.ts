import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PasswordService } from './password.service';
import { SessionService, SESSION_TTL_MS } from './session.service';
import { AuthService } from './auth.service';
import { LoginRateLimiterService } from './login-rate-limiter.service';

const databaseAvailable = Boolean(process.env.DATABASE_URL);

describe.skipIf(!databaseAvailable)('authentication PostgreSQL integration', () => {
  it('persists login sessions, enforces expiry, revokes, and changes passwords', async () => {
    const prisma = new PrismaClient();
    const passwords = new PasswordService();
    const sessions = new SessionService(
      prisma as never,
      { get: () => 'gym_test_session' } as never,
    );
    const auth = new AuthService(
      prisma as never,
      passwords,
      sessions,
      new LoginRateLimiterService(),
    );
    const username = `integration-${randomUUID()}`;
    const password = 'temporary-password-123';
    const owner = await prisma.owner.create({
      data: { username, passwordHash: await passwords.hash(password), mustChangePassword: true },
    });

    try {
      const result = await auth.login(username, password, '127.0.0.1');
      expect(result.owner.mustChangePassword).toBe(true);
      expect(await sessions.findActive(result.session.token)).toMatchObject({
        owner: { id: owner.id },
      });

      await prisma.session.update({
        where: {
          sessionTokenHash: (await import('./session.service')).hashSessionToken(
            result.session.token,
          ),
        },
        data: { expiresAt: new Date(Date.now() - 1) },
      });
      expect(await sessions.findActive(result.session.token)).toBeNull();

      const fresh = await sessions.create(owner.id);
      expect(fresh.expiresAt.getTime()).toBeGreaterThan(Date.now() + SESSION_TTL_MS - 1000);
      await sessions.revoke(fresh.token);
      expect(await sessions.findActive(fresh.token)).toBeNull();

      const current = await sessions.create(owner.id);
      await auth.changePassword(owner.id, password, 'new-password-123', current.token);
      expect(
        (await prisma.owner.findUniqueOrThrow({ where: { id: owner.id } })).mustChangePassword,
      ).toBe(false);
    } finally {
      await prisma.session.deleteMany({ where: { ownerId: owner.id } });
      await prisma.owner.delete({ where: { id: owner.id } });
      await prisma.$disconnect();
    }
  }, 20_000);
});
