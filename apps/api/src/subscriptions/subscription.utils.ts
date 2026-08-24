import { dateOnly, parseDateOnly } from '../members/member.utils';

export function subscriptionEndDate(startDate: string, durationMonths: number) {
  const start = parseDateOnly(startDate);
  const targetYear =
    start.getUTCFullYear() + Math.floor((start.getUTCMonth() + durationMonths) / 12);
  const targetMonth = (start.getUTCMonth() + durationMonths) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const anniversary = new Date(
    Date.UTC(targetYear, targetMonth, Math.min(start.getUTCDate(), lastDay)),
  );
  anniversary.setUTCDate(anniversary.getUTCDate() - 1);
  return dateOnly(anniversary);
}

export function nextDate(value: Date) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + 1);
  return dateOnly(result);
}
