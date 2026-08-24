import { MemberGender, Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { MembersService } from './members.service';
import { SubscriptionStateFilter } from './dto/member-query.dto';

const member = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'أحمد محمد',
  phoneDisplay: '01012345678',
  phoneNormalized: '01012345678',
  gender: MemberGender.MALE,
  dateOfBirth: new Date('1995-06-12T00:00:00Z'),
  photoKey: null,
  heightCm: new Prisma.Decimal(178),
  weightKg: new Prisma.Decimal(82.5),
  joinDate: new Date('2026-08-20T00:00:00Z'),
  isArchived: false,
  archivedAt: null,
  createdAt: new Date('2026-08-20T10:00:00Z'),
  updatedAt: new Date('2026-08-20T10:00:00Z'),
};

function setup() {
  const prisma = {
    member: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (value: unknown) =>
      typeof value === 'function'
        ? (value as (tx: unknown) => unknown)(prisma)
        : Promise.all(value as Promise<unknown>[]),
    ),
  };
  const audit = { append: vi.fn().mockResolvedValue({}) };
  return { prisma, audit, service: new MembersService(prisma as never, audit as never) };
}

describe('MembersService', () => {
  it('creates a normalized member and its audit event atomically', async () => {
    const { prisma, audit, service } = setup();
    prisma.member.create.mockResolvedValue(member);
    const result = await service.create(
      {
        name: member.name,
        phone: '+201012345678',
        gender: MemberGender.MALE,
        dateOfBirth: '1995-06-12',
        heightCm: 178,
        weightKg: 82.5,
        joinDate: '2026-08-20',
      },
      'owner-id',
      'request-id',
    );
    expect(prisma.member.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        phoneDisplay: '01012345678',
        phoneNormalized: '01012345678',
      }),
    });
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'MEMBER_CREATED', requestId: 'request-id' }),
      prisma,
    );
    expect(result).toEqual(
      expect.objectContaining({ phone: '01012345678', outstandingBalanceMinor: 0 }),
    );
  });

  it('lists members with normalized partial-phone search and pagination', async () => {
    const { prisma, service } = setup();
    prisma.member.findMany.mockResolvedValue([{ ...member, subscriptions: [], payments: [] }]);
    const result = await service.list({ page: 1, limit: 20, archived: false, search: '+20101' });
    expect(prisma.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ phoneNormalized: { contains: '0101' } }]),
        }),
      }),
    );
    expect(result.items[0]).toEqual(
      expect.objectContaining({ subscriptionState: 'NONE', subscriptionEndDate: null }),
    );
    expect(result.pagination.totalItems).toBe(1);
  });

  it('returns an empty current-state result for filters requiring financial tables', async () => {
    const { prisma, service } = setup();
    prisma.member.findMany.mockResolvedValue([{ ...member, subscriptions: [], payments: [] }]);
    await expect(
      service.list({ page: 1, limit: 20, archived: false, hasDebt: true }),
    ).resolves.toEqual({
      items: [],
      pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 },
    });
    expect(prisma.member.findMany).toHaveBeenCalled();
  });

  it('derives active subscription, plan, end date, and debt for member summaries', async () => {
    const { prisma, service } = setup();
    prisma.member.findMany.mockResolvedValue([
      {
        ...member,
        subscriptions: [
          {
            startDate: new Date('2026-08-01Z'),
            endDate: new Date('2026-09-30Z'),
            planNameSnapshot: 'الخطة الذهبية',
            agreedPriceMinor: 10000n,
          },
        ],
        payments: [{ amountMinor: 4000n }],
      },
    ]);
    const result = await service.list({
      page: 1,
      limit: 20,
      archived: false,
      subscriptionState: SubscriptionStateFilter.ACTIVE,
      hasDebt: true,
    });
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        subscriptionState: 'ACTIVE',
        subscriptionPlanName: 'الخطة الذهبية',
        subscriptionEndDate: '2026-09-30',
        outstandingBalanceMinor: 6000,
      }),
    );
  });

  it('does not create a meaningless audit row for an empty patch', async () => {
    const { prisma, audit, service } = setup();
    prisma.member.findUnique.mockResolvedValue(member);
    await expect(service.update(member.id, {}, 'owner-id')).resolves.toEqual(
      expect.objectContaining({ id: member.id }),
    );
    expect(prisma.member.update).not.toHaveBeenCalled();
    expect(audit.append).not.toHaveBeenCalled();
  });

  it('rejects duplicate archive and missing history members with stable codes', async () => {
    const { prisma, service } = setup();
    prisma.member.findUnique.mockResolvedValueOnce({ ...member, isArchived: true });
    await expect(service.archive(member.id, 'owner-id')).rejects.toMatchObject({
      response: { code: 'MEMBER_ALREADY_ARCHIVED' },
    });
    prisma.member.findUnique.mockResolvedValueOnce(null);
    await expect(service.emptyHistory(member.id, { page: 1, limit: 20 })).rejects.toMatchObject({
      response: { code: 'MEMBER_NOT_FOUND' },
    });
  });

  it('rejects undecodable photo content', async () => {
    const { prisma, service } = setup();
    prisma.member.findUnique.mockResolvedValue(member);
    await expect(
      service.uploadPhoto(
        member.id,
        { buffer: Buffer.from('not-image'), size: 9 } as never,
        'owner-id',
      ),
    ).rejects.toMatchObject({ response: { code: 'INVALID_MEMBER_PHOTO' } });
  });
});
