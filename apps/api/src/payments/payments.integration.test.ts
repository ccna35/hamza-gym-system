import { MemberGender, PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuditService } from '../audit/audit.service';
import { PaymentsService } from './payments.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

const integration = process.env.DATABASE_URL ? describe : describe.skip;

integration('payments PostgreSQL integration', () => {
  const prisma = new PrismaClient();
  const ownerId = randomUUID();
  const memberId = randomUUID();
  const planId = randomUUID();
  let payments: PaymentsService;
  let subscriptions: SubscriptionsService;

  beforeAll(async () => {
    await prisma.$connect();
    const audit = new AuditService(prisma as never);
    payments = new PaymentsService(prisma as never, audit);
    subscriptions = new SubscriptionsService(prisma as never, audit, payments);
    await prisma.owner.create({
      data: {
        id: ownerId,
        username: `payments-test-${ownerId}`,
        passwordHash: 'unused',
        mustChangePassword: false,
      },
    });
    await prisma.member.create({
      data: {
        id: memberId,
        name: 'عضو مدفوعات',
        phoneDisplay: `010${String(Date.now()).slice(-8)}`,
        phoneNormalized: `010${String(Date.now()).slice(-8)}`,
        gender: MemberGender.MALE,
        dateOfBirth: new Date('1990-01-01Z'),
        joinDate: new Date('2026-08-20Z'),
      },
    });
    await prisma.plan.create({
      data: {
        id: planId,
        name: `خطة مدفوعات ${planId}`,
        prices: {
          create: [1, 3, 6, 12].map((durationMonths) => ({
            durationMonths,
            priceMinor: BigInt(durationMonths * 10000),
          })),
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { actorOwnerId: ownerId } });
    await prisma.payment.deleteMany({ where: { memberId } });
    await prisma.subscription.deleteMany({ where: { memberId } });
    await prisma.planPrice.deleteMany({ where: { planId } });
    await prisma.plan.deleteMany({ where: { id: planId } });
    await prisma.member.deleteMany({ where: { id: memberId } });
    await prisma.owner.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  });

  it('atomically records initial and debt-only payments, prevents overpayment, and restores debt on void', async () => {
    const created = await subscriptions.create(
      memberId,
      {
        planId,
        durationMonths: 1,
        startDate: '2026-08-24',
        agreedPriceMinor: 10000,
        initialPayment: { amountMinor: 4000, paymentDate: '2026-08-24' },
      },
      ownerId,
    );
    expect(created.outstandingBalanceMinor).toBe(6000);
    expect(created.initialPayment).toEqual(
      expect.objectContaining({
        balanceAfterPaymentMinor: 6000,
        receiptNumber: expect.stringMatching(/^REC-\d{4}-\d{6}$/),
      }),
    );
    await expect(
      payments.create(memberId, { amountMinor: 6001, paymentDate: '2026-08-24' }, ownerId),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'PAYMENT_EXCEEDS_BALANCE' }),
    });
    const final = await payments.create(
      memberId,
      { amountMinor: 6000, paymentDate: '2026-08-24' },
      ownerId,
    );
    expect(final.balanceAfterPaymentMinor).toBe(0);
    await expect(
      payments.create(memberId, { amountMinor: 1, paymentDate: '2026-08-24' }, ownerId),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'MEMBER_HAS_NO_OUTSTANDING_BALANCE' }),
    });
    await payments.void(final.id, 'إلغاء دفعة اختبارية', ownerId);
    await expect(prisma.payment.findUnique({ where: { id: final.id } })).resolves.toEqual(
      expect.objectContaining({ voidedAt: expect.any(Date) }),
    );
    await expect(
      subscriptions.void(created.subscription.id, 'إلغاء اشتراك اختباري', ownerId),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'SUBSCRIPTION_HAS_PAYMENTS' }),
    });
  });
});
