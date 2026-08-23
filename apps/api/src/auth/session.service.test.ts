import { describe, expect, it } from 'vitest';
import { ConfigService } from '@nestjs/config';
import {
  createSessionToken,
  hashSessionToken,
  SESSION_TTL_MS,
  SessionService,
} from './session.service';

describe('session helpers', () => {
  it('creates high-entropy tokens and stores only their digest', () => {
    const first = createSessionToken();
    const second = createSessionToken();
    expect(first).not.toBe(second);
    expect(Buffer.from(first, 'base64url').byteLength).toBe(32);
    expect(hashSessionToken(first)).toHaveLength(64);
    expect(hashSessionToken(first)).not.toContain(first);
  });

  it('uses an absolute eight-hour expiry and secure cookie settings in production', () => {
    const service = new SessionService(
      {} as never,
      new ConfigService({ SESSION_COOKIE_NAME: 'test_session' }),
    );
    const before = Date.now();
    const cookie = service.cookieOptions(new Date(before + SESSION_TTL_MS));
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe('lax');
    expect(cookie.path).toBe('/');
  });
});
