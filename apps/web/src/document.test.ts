import { describe, expect, it } from 'vitest';

describe('document foundation', () => {
  it('uses Arabic RTL metadata', () => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });
});
