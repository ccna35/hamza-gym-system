import { describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { CsrfMiddleware } from './csrf.middleware';

function request(method: string, headers: Record<string, string>) {
  return { method, get: (name: string) => headers[name] } as never;
}

describe('CsrfMiddleware', () => {
  const middleware = new CsrfMiddleware(new ConfigService({ APP_ORIGIN: 'http://localhost:5173' }));

  it('allows safe methods and same-origin mutations', () => {
    const next = vi.fn();
    middleware.use(request('GET', {}), {} as never, next);
    middleware.use(request('POST', { origin: 'http://localhost:5173' }), {} as never, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('rejects cross-origin mutations', () => {
    expect(() =>
      middleware.use(request('POST', { origin: 'https://evil.example' }), {} as never, vi.fn()),
    ).toThrow();
    expect(() =>
      middleware.use(request('POST', { referer: 'not-a-url' }), {} as never, vi.fn()),
    ).toThrow();
  });
});
