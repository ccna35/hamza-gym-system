import { normalizeEgyptianPhone, normalizePhoneSearch } from './member.utils';
import { describe, expect, it } from 'vitest';

describe('normalizeEgyptianPhone', () => {
  it.each([
    ['01012345678', '01012345678'],
    ['+201012345678', '01012345678'],
    ['00201012345678', '01012345678'],
    ['201012345678', '01012345678'],
    ['(010) 1234-5678', '01012345678'],
    [' 010 1234 5678 ', '01012345678'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeEgyptianPhone(input)).toBe(expected);
  });

  it.each([
    '',
    '01312345678',
    '0101234567',
    '010123456789',
    'abc01012345678',
    '02123456789',
    '+211012345678',
  ])('rejects invalid phone %s', (input) => {
    expect(normalizeEgyptianPhone(input)).toBeNull();
  });
});

describe('normalizePhoneSearch', () => {
  it.each([
    ['0101', '0101'],
    ['+20101', '0101'],
    ['0020101', '0101'],
    ['20 101', '0101'],
  ])('normalizes phone search %s', (input, expected) => {
    expect(normalizePhoneSearch(input)).toBe(expected);
  });

  it('rejects non-phone search text', () => {
    expect(normalizePhoneSearch('أحمد')).toBeNull();
  });
});
