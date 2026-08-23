import { AuditAction, AuditEntityType, Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { AuditService } from './audit.service';

function prismaMock() {
  const auditLog = {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  };
  return {
    auditLog,
    member: { findUnique: vi.fn() },
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  };
}

describe('AuditService', () => {
  it('appends an event through the supplied transaction writer', async () => {
    const prisma = prismaMock();
    const writer = { auditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-id' }) } };
    const service = new AuditService(prisma as never);

    await service.append(
      {
        actorOwnerId: 'owner-id',
        entityType: AuditEntityType.MEMBER,
        entityId: 'member-id',
        action: AuditAction.MEMBER_CREATED,
        after: { name: 'Hamza' },
      },
      writer as never,
    );

    expect(writer.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorOwnerId: 'owner-id',
        entityType: 'MEMBER',
        entityId: 'member-id',
        action: 'MEMBER_CREATED',
        beforeJson: Prisma.JsonNull,
        afterJson: { name: 'Hamza' },
        metadataJson: Prisma.JsonNull,
      }),
    });
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('filters and maps a paginated global audit response', async () => {
    const prisma = prismaMock();
    prisma.auditLog.findMany.mockResolvedValue([
      {
        id: 'audit-id',
        actorOwnerId: 'owner-id',
        entityType: 'PAYMENT',
        entityId: 'payment-id',
        action: 'PAYMENT_VOIDED',
        beforeJson: { voidedAt: null },
        afterJson: { voidedAt: 'now' },
        metadataJson: { reason: 'mistake' },
        createdAt: new Date('2026-08-23T10:00:00Z'),
      },
    ]);
    prisma.auditLog.count.mockResolvedValue(21);
    const service = new AuditService(prisma as never);

    const result = await service.list({
      page: 2,
      limit: 20,
      entityType: AuditEntityType.PAYMENT,
      action: AuditAction.PAYMENT_VOIDED,
      from: '2026-08-23',
      to: '2026-08-23',
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    );
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: new Date('2026-08-22T21:00:00.000Z'),
            lt: new Date('2026-08-23T21:00:00.000Z'),
          },
        }),
      }),
    );
    expect(result.pagination).toEqual({ page: 2, limit: 20, totalItems: 21, totalPages: 2 });
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: 'audit-id',
        before: { voidedAt: null },
        after: { voidedAt: 'now' },
        createdAt: '2026-08-23T10:00:00.000Z',
      }),
    );
  });

  it('rejects an inverted date range', async () => {
    const service = new AuditService(prismaMock() as never);
    await expect(
      service.list({ page: 1, limit: 20, from: '2026-08-24', to: '2026-08-23' }),
    ).rejects.toMatchObject({ response: { code: 'INVALID_DATE_RANGE' } });
  });

  it('requires the member to exist before returning its timeline', async () => {
    const prisma = prismaMock();
    prisma.member.findUnique.mockResolvedValue(null);
    const service = new AuditService(prisma as never);
    await expect(service.listForMember('member-id', { page: 1, limit: 20 })).rejects.toMatchObject({
      response: { code: 'MEMBER_NOT_FOUND' },
    });
  });
});
