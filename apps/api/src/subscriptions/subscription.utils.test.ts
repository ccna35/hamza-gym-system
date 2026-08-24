import { describe, expect, it } from 'vitest';
import { subscriptionEndDate } from './subscription.utils';

describe('subscriptionEndDate', () => {
  it('uses inclusive calendar-month ranges', () =>
    expect(subscriptionEndDate('2026-08-20', 1)).toBe('2026-09-19'));
  it('clamps end-of-month anniversaries', () =>
    expect(subscriptionEndDate('2026-01-31', 1)).toBe('2026-02-27'));
  it('handles leap years', () => expect(subscriptionEndDate('2024-01-31', 1)).toBe('2024-02-28'));
  it('handles year boundaries', () =>
    expect(subscriptionEndDate('2026-12-31', 3)).toBe('2027-03-30'));
});
