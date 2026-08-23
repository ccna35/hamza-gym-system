import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('sets the session cookie and returns the owner summary on login', async () => {
    const auth = {
      login: vi.fn().mockResolvedValue({
        owner: { id: '1', username: 'owner', mustChangePassword: true },
        session: { token: 'token', expiresAt: new Date() },
      }),
    };
    const sessions = {
      getCookieName: () => 'gym_session',
      cookieOptions: vi.fn().mockReturnValue({}),
    };
    const response = { cookie: vi.fn(), clearCookie: vi.fn() };
    const controller = new AuthController(auth as never, sessions as never);
    await expect(
      controller.login(
        { ip: 'unknown', headers: {} },
        { username: ' owner ', password: 'secret' },
        response,
      ),
    ).resolves.toEqual({ owner: { id: '1', username: 'owner', mustChangePassword: true } });
    expect(auth.login).toHaveBeenCalledWith('owner', 'secret', 'unknown');
    expect(response.cookie).toHaveBeenCalledWith('gym_session', 'token', {});
  });

  it('revokes the current session on logout', async () => {
    const auth = {};
    const sessions = {
      getCookieName: () => 'gym_session',
      revoke: vi.fn(),
      clearCookieOptions: () => ({}),
    };
    const response = { cookie: vi.fn(), clearCookie: vi.fn() };
    const controller = new AuthController(auth as never, sessions as never);
    await expect(
      controller.logout({ headers: { cookie: 'gym_session=session-token' } }, response),
    ).resolves.toBeUndefined();
    expect(sessions.revoke).toHaveBeenCalledWith('session-token');
    expect(response.clearCookie).toHaveBeenCalled();
  });

  it('rejects a weak new password with the stable error code', async () => {
    const auth = { changePassword: vi.fn() };
    const sessions = { getCookieName: () => 'gym_session' };
    const controller = new AuthController(auth as never, sessions as never);
    await expect(
      controller.changePassword(
        { owner: { id: '1', username: 'owner', mustChangePassword: true }, headers: {} },
        { currentPassword: 'old', newPassword: 'short' },
      ),
    ).rejects.toMatchObject({ response: { code: 'PASSWORD_TOO_WEAK' } });
    expect(auth.changePassword).not.toHaveBeenCalled();
  });
});
