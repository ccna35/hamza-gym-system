import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuditService } from '../audit/audit.service';
import { PlansService } from './plans.service';

const integration = process.env.DATABASE_URL ? describe : describe.skip;
const prices = [
  { durationMonths: 1, priceMinor: 30000 },
  { durationMonths: 3, priceMinor: 80000 },
  { durationMonths: 6, priceMinor: 150000 },
  { durationMonths: 12, priceMinor: 280000 },
];

integration('plans PostgreSQL integration', () => {
  const prisma = new PrismaClient();
  const ownerId = randomUUID();
  const planIds: string[] = [];
  let service: PlansService;
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.owner.create({
      data: {
        id: ownerId,
        username: `plans-test-${ownerId}`,
        passwordHash: 'unused',
        mustChangePassword: false,
      },
    });
    service = new PlansService(prisma as never, new AuditService(prisma as never));
  });
  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { actorOwnerId: ownerId } });
    await prisma.planPrice.deleteMany({ where: { planId: { in: planIds } } });
    await prisma.plan.deleteMany({ where: { id: { in: planIds } } });
    await prisma.owner.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  });

  it('persists create, price update, disable, enable, filtering, and audit', async () => {
    const created = await service.create(
      { name: `خطة اختبار ${ownerId}`, prices },
      ownerId,
      'plans-integration',
    );
    planIds.push(created.id);
    expect(created.prices).toEqual(prices);
    const updatedPrices = prices.map((price) => ({
      ...price,
      priceMinor: price.priceMinor + 5000,
    }));
    await expect(
      service.update(created.id, { name: `${created.name} محدثة`, prices: updatedPrices }, ownerId),
    ).resolves.toEqual(expect.objectContaining({ prices: updatedPrices }));
    await expect(service.disable(created.id, ownerId)).resolves.toEqual(
      expect.objectContaining({ isEnabled: false }),
    );
    await expect(service.list({ enabled: true, page: 1, limit: 100 })).resolves.toEqual(
      expect.objectContaining({
        items: expect.not.arrayContaining([expect.objectContaining({ id: created.id })]),
      }),
    );
    await expect(service.enable(created.id, ownerId)).resolves.toEqual(
      expect.objectContaining({ isEnabled: true }),
    );
    await expect(
      prisma.auditLog.count({ where: { entityType: 'PLAN', entityId: created.id } }),
    ).resolves.toBe(4);
  });
});
