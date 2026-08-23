import { Injectable } from '@nestjs/common';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type Entry = { failures: number; firstFailureAt: number };

@Injectable()
export class LoginRateLimiterService {
  private readonly entries = new Map<string, Entry>();

  isLimited(ip: string, username: string, now = Date.now()) {
    const key = this.key(ip, username);
    const entry = this.entries.get(key);
    if (!entry || now - entry.firstFailureAt >= WINDOW_MS) {
      if (entry) this.entries.delete(key);
      return false;
    }
    return entry.failures >= MAX_FAILURES;
  }

  recordFailure(ip: string, username: string, now = Date.now()) {
    const key = this.key(ip, username);
    const entry = this.entries.get(key);
    if (!entry || now - entry.firstFailureAt >= WINDOW_MS) {
      this.entries.set(key, { failures: 1, firstFailureAt: now });
    } else {
      entry.failures += 1;
    }
    this.prune(now);
  }

  reset(ip: string, username: string) {
    this.entries.delete(this.key(ip, username));
  }

  private key(ip: string, username: string) {
    return `${ip}|${username.trim().toLowerCase()}`;
  }

  private prune(now: number) {
    for (const [key, entry] of this.entries) {
      if (now - entry.firstFailureAt >= WINDOW_MS) this.entries.delete(key);
    }
  }
}
