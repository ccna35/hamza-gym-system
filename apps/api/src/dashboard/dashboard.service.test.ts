import { describe, expect, it, vi } from 'vitest';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('derives summary metrics, positive debt, and excludes voided records through queries', async () => {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const current = new Date(`${today}T00:00:00Z`);
    const tomorrow = new Date(current);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const yesterday = new Date(current);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const prisma = {
      member: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'active',
            name: 'نشط',
            phoneDisplay: '01000000001',
            isArchived: false,
            subscriptions: [{ startDate: yesterday, endDate: tomorrow, agreedPriceMinor: 10000n }],
            payments: [{ amountMinor: 4000n }],
          },
          {
            id: 'expired',
            name: 'منتهي',
            phoneDisplay: '01000000002',
            isArchived: false,
            subscriptions: [{ startDate: yesterday, endDate: yesterday, agreedPriceMinor: 2000n }],
            payments: [],
          },
          {
            id: 'archived',
            name: 'مؤرشف',
            phoneDisplay: '01000000003',
            isArchived: true,
            subscriptions: [{ startDate: yesterday, endDate: tomorrow, agreedPriceMinor: 3000n }],
            payments: [],
          },
        ]),
        count: vi.fn().mockResolvedValue(2),
      },
      payment: {
        aggregate: vi
          .fn()
          .mockResolvedValueOnce({ _sum: { amountMinor: 1500n } })
          .mockResolvedValueOnce({ _sum: { amountMinor: 9000n } }),
      },
    };
    const service = new DashboardService(prisma as never);
    await expect(service.summary()).resolves.toEqual({
      activeMembers: 1,
      expiredMemberships: 1,
      expiringWithin7Days: 1,
      newMembersThisMonth: 2,
      revenueTodayMinor: 1500,
      revenueThisMonthMinor: 9000,
      totalOutstandingDebtMinor: 11000,
    });
    await expect(service.debtors({ page: 1, limit: 2, sort: 'balance_desc' })).resolves.toEqual(
      expect.objectContaining({
        items: [
          expect.objectContaining({ memberId: 'active', outstandingBalanceMinor: 6000 }),
          expect.objectContaining({ memberId: 'archived', outstandingBalanceMinor: 3000 }),
        ],
        pagination: expect.objectContaining({ totalItems: 3, totalPages: 2 }),
      }),
    );
  });
});
