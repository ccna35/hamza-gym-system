import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { dateOnly, parseDateOnly } from '../members/member.utils';
import { DashboardQueryDto } from './dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const calendar = this.calendar();
    const [members, revenueToday, revenueMonth, newMembersThisMonth] = await Promise.all([
      this.financialMembers(),
      this.prisma.payment.aggregate({
        where: { voidedAt: null, paymentDate: parseDateOnly(calendar.today) },
        _sum: { amountMinor: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          voidedAt: null,
          paymentDate: {
            gte: parseDateOnly(calendar.monthStart),
            lt: parseDateOnly(calendar.nextMonthStart),
          },
        },
        _sum: { amountMinor: true },
      }),
      this.prisma.member.count({
        where: {
          joinDate: {
            gte: parseDateOnly(calendar.monthStart),
            lt: parseDateOnly(calendar.nextMonthStart),
          },
        },
      }),
    ]);
    let activeMembers = 0;
    let expiredMemberships = 0;
    let expiringWithin7Days = 0;
    let totalOutstandingDebtMinor = 0;
    for (const member of members) {
      const state = this.memberState(member.subscriptions, calendar.today);
      if (!member.isArchived && state === 'ACTIVE') activeMembers += 1;
      if (!member.isArchived && state === 'EXPIRED') expiredMemberships += 1;
      if (!member.isArchived)
        expiringWithin7Days += member.subscriptions.filter(
          (item) =>
            dateOnly(item.startDate) <= calendar.today &&
            dateOnly(item.endDate) >= calendar.today &&
            dateOnly(item.endDate) <= calendar.in7Days,
        ).length;
      const debt = this.balance(member.subscriptions, member.payments);
      totalOutstandingDebtMinor += Math.max(0, debt);
    }
    return {
      activeMembers,
      expiredMemberships,
      expiringWithin7Days,
      newMembersThisMonth,
      revenueTodayMinor: Number(revenueToday._sum.amountMinor ?? 0n),
      revenueThisMonthMinor: Number(revenueMonth._sum.amountMinor ?? 0n),
      totalOutstandingDebtMinor,
    };
  }

  async debtors(query: DashboardQueryDto) {
    const members = await this.financialMembers();
    const items = members
      .map((member) => ({
        memberId: member.id,
        name: member.name,
        phone: member.phoneDisplay,
        isArchived: member.isArchived,
        outstandingBalanceMinor: this.balance(member.subscriptions, member.payments),
      }))
      .filter((item) => item.outstandingBalanceMinor > 0)
      .sort(
        (a, b) =>
          b.outstandingBalanceMinor - a.outstandingBalanceMinor ||
          a.name.localeCompare(b.name, 'ar'),
      );
    return this.page(items, query);
  }

  async expiring(query: DashboardQueryDto) {
    const calendar = this.calendar();
    const rows = await this.prisma.subscription.findMany({
      where: {
        voidedAt: null,
        startDate: { lte: parseDateOnly(calendar.today) },
        endDate: { gte: parseDateOnly(calendar.today), lte: parseDateOnly(calendar.in7Days) },
        member: { isArchived: false },
      },
      include: { member: true },
      orderBy: [{ endDate: 'asc' }, { member: { name: 'asc' } }],
    });
    const today = parseDateOnly(calendar.today).getTime();
    const items = rows.map((item) => ({
      memberId: item.memberId,
      memberName: item.member.name,
      phone: item.member.phoneDisplay,
      subscriptionId: item.id,
      planName: item.planNameSnapshot,
      endDate: dateOnly(item.endDate),
      daysRemaining: Math.round((item.endDate.getTime() - today) / 86_400_000),
    }));
    return this.page(items, query);
  }

  private financialMembers() {
    return this.prisma.member.findMany({
      include: {
        subscriptions: { where: { voidedAt: null } },
        payments: { where: { voidedAt: null } },
      },
    });
  }
  private balance(
    subscriptions: Array<{ agreedPriceMinor: bigint }>,
    payments: Array<{ amountMinor: bigint }>,
  ) {
    return (
      subscriptions.reduce((sum, item) => sum + Number(item.agreedPriceMinor), 0) -
      payments.reduce((sum, item) => sum + Number(item.amountMinor), 0)
    );
  }
  private memberState(subscriptions: Array<{ startDate: Date; endDate: Date }>, today: string) {
    if (
      subscriptions.some(
        (item) => dateOnly(item.startDate) <= today && dateOnly(item.endDate) >= today,
      )
    )
      return 'ACTIVE';
    if (subscriptions.some((item) => dateOnly(item.startDate) > today)) return 'SCHEDULED';
    return subscriptions.length ? 'EXPIRED' : 'NONE';
  }
  private page<T>(items: T[], query: DashboardQueryDto) {
    const totalItems = items.length;
    return {
      items: items.slice((query.page - 1) * query.limit, query.page * query.limit),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / query.limit),
      },
    };
  }
  private calendar() {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const date = parseDateOnly(today);
    const in7 = new Date(date);
    in7.setUTCDate(in7.getUTCDate() + 7);
    const monthStart = `${today.slice(0, 7)}-01`;
    const next = parseDateOnly(monthStart);
    next.setUTCMonth(next.getUTCMonth() + 1);
    return { today, in7Days: dateOnly(in7), monthStart, nextMonthStart: dateOnly(next) };
  }
}
