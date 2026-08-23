import { describe, expect, it, vi } from 'vitest';
import { AuthGuard } from './auth.guard';

function executionContext(request: Record<string, unknown>) {
  return { switchToHttp: () => ({ getRequest: () => request }) } as never;
}

describe('AuthGuard', () => {
  it('rejects missing sessions', async () => {
    const sessions = { getCookieName: () => 'gym_session', findActive: vi.fn() };
    const guard = new AuthGuard(sessions as never);
    await expect(guard.canActivate(executionContext({ headers: {} }))).rejects.toMatchObject({
      response: { code: 'UNAUTHORIZED' },
    });
  });

  it('attaches the owner for an active session', async () => {
    const sessions = {
      getCookieName: () => 'gym_session',
      findActive: vi.fn().mockResolvedValue({
        owner: { id: 'owner-id', username: 'owner', mustChangePassword: true },
      }),
    };
    const request = { headers: { cookie: 'gym_session=session-token' } };
    const guard = new AuthGuard(sessions as never);
    await expect(guard.canActivate(executionContext(request))).resolves.toBe(true);
    expect(request).toHaveProperty('owner', {
      id: 'owner-id',
      username: 'owner',
      mustChangePassword: true,
    });
  });
});
