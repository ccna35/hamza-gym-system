import { MemberGender, PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuditService } from '../audit/audit.service';
import { MembersService } from './members.service';

const databaseUrl = process.env.DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;

integration('members PostgreSQL integration', () => {
  const prisma = new PrismaClient();
  const ownerId = randomUUID();
  const createdMemberIds: string[] = [];
  let photoDirectory: string;
  let service: MembersService;

  beforeAll(async () => {
    photoDirectory = await mkdtemp(join(tmpdir(), 'gym-member-photos-'));
    process.env.MEMBER_PHOTO_DIR = photoDirectory;
    await prisma.$connect();
    await prisma.owner.create({
      data: {
        id: ownerId,
        username: `members-test-${ownerId}`,
        passwordHash: 'not-used',
        mustChangePassword: false,
      },
    });
    service = new MembersService(prisma as never, new AuditService(prisma as never));
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { actorOwnerId: ownerId } });
    await prisma.member.deleteMany({ where: { id: { in: createdMemberIds } } });
    await prisma.owner.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
    await rm(photoDirectory, { recursive: true, force: true });
  });

  it('persists the complete member lifecycle, audit trail, and normalized photo', async () => {
    const phone = `010${String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0')}`;
    const created = await service.create(
      {
        name: 'عضو اختبار التكامل',
        phone,
        gender: MemberGender.MALE,
        dateOfBirth: '1995-06-12',
        heightCm: 178,
        weightKg: 82.5,
        joinDate: '2026-08-20',
      },
      ownerId,
      'members-integration',
    );
    createdMemberIds.push(created.id);

    const updated = await service.update(created.id, { name: 'عضو محدث' }, ownerId);
    expect(updated.name).toBe('عضو محدث');
    await expect(service.archive(created.id, ownerId)).resolves.toEqual(
      expect.objectContaining({ isArchived: true }),
    );
    await expect(service.restore(created.id, ownerId)).resolves.toEqual(
      expect.objectContaining({ isArchived: false }),
    );

    const source = await sharp({
      create: { width: 4, height: 4, channels: 3, background: '#315c45' },
    })
      .jpeg()
      .toBuffer();
    await expect(
      service.uploadPhoto(created.id, { buffer: source, size: source.length } as never, ownerId),
    ).resolves.toEqual({
      photoUrl: expect.stringMatching(new RegExp(`/api/v1/members/${created.id}/photo\\?v=\\d+`)),
    });
    const storedPhoto = await service.getPhoto(created.id);
    await expect(sharp(storedPhoto).metadata()).resolves.toEqual(
      expect.objectContaining({ format: 'webp', width: 4, height: 4 }),
    );

    await expect(
      service.list({ page: 1, limit: 20, archived: false, search: phone.slice(0, 6) }),
    ).resolves.toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([expect.objectContaining({ id: created.id })]),
      }),
    );
    await expect(
      prisma.auditLog.count({ where: { entityType: 'MEMBER', entityId: created.id } }),
    ).resolves.toBe(5);
  });
});
