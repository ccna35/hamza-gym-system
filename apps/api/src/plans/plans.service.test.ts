import { describe, expect, it, vi } from 'vitest';
import { PlansService } from './plans.service';

const plan = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'العادي',
  isEnabled: true,
  createdAt: new Date('2026-08-23T10:00:00Z'),
  updatedAt: new Date('2026-08-23T10:00:00Z'),
  prices: [
    {
      id: '1',
      planId: 'p',
      durationMonths: 12,
      priceMinor: 280000n,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      planId: 'p',
      durationMonths: 1,
      priceMinor: 30000n,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      planId: 'p',
      durationMonths: 6,
      priceMinor: 150000n,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      planId: 'p',
      durationMonths: 3,
      priceMinor: 80000n,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};
const prices = plan.prices.map(({ durationMonths, priceMinor }) => ({
  durationMonths,
  priceMinor: Number(priceMinor),
}));

function setup() {
  const prisma = {
    plan: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    planPrice: { deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(async (value: unknown) =>
      typeof value === 'function'
        ? (value as (tx: unknown) => unknown)(prisma)
        : Promise.all(value as Promise<unknown>[]),
    ),
  };
  const audit = { append: vi.fn().mockResolvedValue({}) };
  return { prisma, audit, service: new PlansService(prisma as never, audit as never) };
}

describe('PlansService', () => {
  it('creates a plan and returns prices sorted by duration', async () => {
    const { prisma, audit, service } = setup();
    prisma.plan.create.mockResolvedValue(plan);
    const result = await service.create({ name: plan.name, prices }, 'owner-id');
    expect(result.prices.map((price) => price.durationMonths)).toEqual([1, 3, 6, 12]);
    expect(audit.append).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PLAN_CREATED' }),
      prisma,
    );
  });

  it('rejects duplicate or missing supported durations', async () => {
    const { service } = setup();
    await expect(
      service.create(
        { name: plan.name, prices: [prices[0]!, prices[0]!, prices[2]!, prices[3]!] },
        'owner-id',
      ),
    ).rejects.toMatchObject({ response: { code: 'VALIDATION_ERROR' } });
  });

  it('returns stable state conflict and not-found errors', async () => {
    const { prisma, service } = setup();
    prisma.plan.findUnique.mockResolvedValueOnce(plan);
    await expect(service.enable(plan.id, 'owner-id')).rejects.toMatchObject({
      response: { code: 'PLAN_ALREADY_ENABLED' },
    });
    prisma.plan.findUnique.mockResolvedValueOnce(null);
    await expect(service.get(plan.id)).rejects.toMatchObject({
      response: { code: 'PLAN_NOT_FOUND' },
    });
  });
});
