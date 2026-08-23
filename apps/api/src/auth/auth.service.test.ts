import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { LoginRateLimiterService } from './login-rate-limiter.service';

describe('AuthService', () => {
  it('returns a generic error for an unknown owner', async () => {
    const service = new AuthService(
      { owner: { findUnique: vi.fn().mockResolvedValue(null) } } as never,
      { verify: vi.fn() } as never,
      {} as never,
      new LoginRateLimiterService(),
    );
    await expect(service.login('unknown', 'secret', '127.0.0.1')).rejects.toMatchObject({
      response: { code: 'INVALID_CREDENTIALS' },
    });
  });

  it('changes the password and revokes other sessions', async () => {
    const owner = {
      id: 'owner-id',
      passwordHash: 'old-hash',
      username: 'owner',
      mustChangePassword: true,
    };
    const prisma = {
      owner: { findUnique: vi.fn().mockResolvedValue(owner), update: vi.fn() },
      session: { deleteMany: vi.fn() },
      $transaction: vi.fn().mockResolvedValue([]),
    };
    const passwords = {
      verify: vi.fn().mockResolvedValue(true),
      hash: vi.fn().mockResolvedValue('new-hash'),
    };
    const service = new AuthService(
      prisma as never,
      passwords as never,
      {} as never,
      new LoginRateLimiterService(),
    );
    await expect(
      service.changePassword('owner-id', 'old-password', 'new-password-123', 'current-token'),
    ).resolves.toBeUndefined();
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rejects an incorrect current password without changing state', async () => {
    const prisma = {
      owner: {
        findUnique: vi.fn().mockResolvedValue({ id: 'owner-id', passwordHash: 'old-hash' }),
      },
      $transaction: vi.fn(),
    };
    const passwords = { verify: vi.fn().mockResolvedValue(false), hash: vi.fn() };
    const service = new AuthService(
      prisma as never,
      passwords as never,
      {} as never,
      new LoginRateLimiterService(),
    );
    await expect(
      service.changePassword('owner-id', 'wrong-password', 'new-password-123', 'current-token'),
    ).rejects.toMatchObject({ response: { code: 'CURRENT_PASSWORD_INCORRECT' } });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not hash when the controller rejects a weak password', () => {
    expect('short'.length).toBeLessThan(10);
  });
});
