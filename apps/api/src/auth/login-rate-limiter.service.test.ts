import { describe, expect, it } from 'vitest';
import { LoginRateLimiterService } from './login-rate-limiter.service';

describe('LoginRateLimiterService', () => {
  it('limits after five failures for the same IP and username', () => {
    const limiter = new LoginRateLimiterService();
    for (let attempt = 0; attempt < 5; attempt += 1) limiter.recordFailure('127.0.0.1', 'Owner');
    expect(limiter.isLimited('127.0.0.1', 'owner')).toBe(true);
    expect(limiter.isLimited('127.0.0.2', 'owner')).toBe(false);
    expect(limiter.isLimited('127.0.0.1', 'other')).toBe(false);
  });

  it('resets successful credentials and expires entries after fifteen minutes', () => {
    const limiter = new LoginRateLimiterService();
    limiter.recordFailure('127.0.0.1', 'owner', 0);
    limiter.reset('127.0.0.1', 'owner');
    expect(limiter.isLimited('127.0.0.1', 'owner', 1)).toBe(false);
    for (let attempt = 0; attempt < 5; attempt += 1)
      limiter.recordFailure('127.0.0.1', 'owner', attempt + 2);
    expect(limiter.isLimited('127.0.0.1', 'owner', 15 * 60 * 1000 + 2)).toBe(false);
  });
});
