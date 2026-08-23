const EGYPTIAN_MOBILE_PATTERN = /^01[0125]\d{8}$/;

export function normalizeEgyptianPhone(phone: string): string | null {
  const compactPhone = phone.trim().replace(/[\s()-]/g, '');

  let normalizedPhone = compactPhone;

  if (compactPhone.startsWith('+20')) {
    normalizedPhone = `0${compactPhone.slice(3)}`;
  } else if (compactPhone.startsWith('0020')) {
    normalizedPhone = `0${compactPhone.slice(4)}`;
  } else if (compactPhone.startsWith('20')) {
    normalizedPhone = `0${compactPhone.slice(2)}`;
  }

  if (!EGYPTIAN_MOBILE_PATTERN.test(normalizedPhone)) {
    return null;
  }

  return normalizedPhone;
}

export function normalizePhoneSearch(value: string) {
  const compact = value.trim().replace(/[\s()-]/g, '');
  if (compact.startsWith('+20')) return `0${compact.slice(3)}`;
  if (compact.startsWith('0020')) return `0${compact.slice(4)}`;
  if (compact.startsWith('20')) return `0${compact.slice(2)}`;
  return /^\d+$/.test(compact) ? compact : null;
}

export function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
