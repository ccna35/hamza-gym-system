import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { AuditAction, AuditEntityType, Member, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { MemberQueryDto, PaginationDto, SubscriptionStateFilter } from './dto/member-query.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import {
  dateOnly,
  normalizeEgyptianPhone,
  normalizePhoneSearch,
  parseDateOnly,
} from './member.utils';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);
  private readonly photoDirectory = resolve(
    process.env.MEMBER_PHOTO_DIR ?? 'storage/member-photos',
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: MemberQueryDto) {
    if (query.subscriptionState && query.subscriptionState !== SubscriptionStateFilter.NONE)
      return this.emptyPage(query);
    if (query.hasDebt === true) return this.emptyPage(query);
    const where: Prisma.MemberWhereInput = { isArchived: query.archived };
    if (query.search) {
      const normalized = normalizePhoneSearch(query.search);
      where.OR = [{ name: { contains: query.search, mode: 'insensitive' } }];
      if (normalized) where.OR.push({ phoneNormalized: { contains: normalized } });
    }
    const [members, totalItems] = await this.prisma.$transaction([
      this.prisma.member.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.member.count({ where }),
    ]);
    return {
      items: members.map((member) => ({
        id: member.id,
        name: member.name,
        phone: member.phoneDisplay,
        photoUrl: this.photoUrl(member),
        isArchived: member.isArchived,
        subscriptionState: 'NONE',
        subscriptionEndDate: null,
        outstandingBalanceMinor: 0,
      })),
      pagination: this.pagination(query.page, query.limit, totalItems),
    };
  }

  async create(input: CreateMemberDto, actorOwnerId: string, requestId?: string) {
    const phone = this.validPhone(input.phone);
    this.validateBirthDate(input.dateOfBirth);
    try {
      const member = await this.prisma.$transaction(async (tx) => {
        const created = await tx.member.create({
          data: {
            name: input.name,
            phoneDisplay: phone,
            phoneNormalized: phone,
            gender: input.gender,
            dateOfBirth: parseDateOnly(input.dateOfBirth),
            joinDate: parseDateOnly(input.joinDate),
            ...(input.heightCm !== undefined ? { heightCm: input.heightCm } : {}),
            ...(input.weightKg !== undefined ? { weightKg: input.weightKg } : {}),
          },
        });
        await this.audit.append(
          {
            actorOwnerId,
            entityType: AuditEntityType.MEMBER,
            entityId: created.id,
            action: AuditAction.MEMBER_CREATED,
            after: this.auditSnapshot(created),
            ...this.requestIdData(requestId),
          },
          tx,
        );
        return created;
      });
      return this.detail(member);
    } catch (error) {
      this.rethrowUniquePhone(error);
    }
  }

  async get(memberId: string) {
    return this.detail(await this.requireMember(memberId));
  }

  async update(memberId: string, input: UpdateMemberDto, actorOwnerId: string, requestId?: string) {
    const before = await this.requireMember(memberId);
    if (input.dateOfBirth) this.validateBirthDate(input.dateOfBirth);
    const data: Prisma.MemberUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.phone !== undefined) {
      const phone = this.validPhone(input.phone);
      data.phoneDisplay = phone;
      data.phoneNormalized = phone;
    }
    if (input.gender !== undefined) data.gender = input.gender;
    if (input.dateOfBirth !== undefined) data.dateOfBirth = parseDateOnly(input.dateOfBirth);
    if (input.heightCm !== undefined) data.heightCm = input.heightCm;
    if (input.weightKg !== undefined) data.weightKg = input.weightKg;
    if (input.joinDate !== undefined) data.joinDate = parseDateOnly(input.joinDate);
    if (Object.keys(data).length === 0) return this.detail(before);
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const result = await tx.member.update({ where: { id: memberId }, data });
        await this.audit.append(
          {
            actorOwnerId,
            entityType: AuditEntityType.MEMBER,
            entityId: memberId,
            action: AuditAction.MEMBER_UPDATED,
            before: this.auditSnapshot(before),
            after: this.auditSnapshot(result),
            ...this.requestIdData(requestId),
          },
          tx,
        );
        return result;
      });
      return this.detail(updated);
    } catch (error) {
      this.rethrowUniquePhone(error);
    }
  }

  archive(memberId: string, actorOwnerId: string, requestId?: string) {
    return this.setArchived(memberId, true, actorOwnerId, requestId);
  }
  restore(memberId: string, actorOwnerId: string, requestId?: string) {
    return this.setArchived(memberId, false, actorOwnerId, requestId);
  }

  async uploadPhoto(
    memberId: string,
    file: Express.Multer.File | undefined,
    actorOwnerId: string,
    requestId?: string,
  ) {
    const member = await this.requireMember(memberId);
    if (!file)
      throw new BadRequestException({ code: 'INVALID_MEMBER_PHOTO', message: 'ملف الصورة مطلوب' });
    if (file.size > MAX_PHOTO_BYTES)
      throw new PayloadTooLargeException({
        code: 'PHOTO_TOO_LARGE',
        message: 'حجم الصورة يتجاوز 5 ميجابايت',
      });
    let bytes: Buffer;
    try {
      const metadata = await sharp(file.buffer, { failOn: 'error' }).metadata();
      if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format))
        throw new Error('unsupported image');
      bytes = await sharp(file.buffer, { failOn: 'error' })
        .rotate()
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch (error) {
      this.logger.warn(
        `Member photo decode failed: mime=${file.mimetype || 'unknown'} size=${file.size} buffer=${file.buffer?.length ?? 0} signature=${file.buffer?.subarray(0, 12).toString('hex') ?? 'missing'} error=${error instanceof Error ? error.message : 'unknown'}`,
      );
      throw new BadRequestException({
        code: 'INVALID_MEMBER_PHOTO',
        message: 'ملف الصورة غير صالح',
      });
    }
    await mkdir(this.photoDirectory, { recursive: true });
    const photoKey = `${randomBytes(24).toString('base64url')}.webp`;
    const path = resolve(this.photoDirectory, photoKey);
    await writeFile(path, bytes, { flag: 'wx' });
    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const result = await tx.member.update({ where: { id: memberId }, data: { photoKey } });
        await this.audit.append(
          {
            actorOwnerId,
            entityType: AuditEntityType.MEMBER,
            entityId: memberId,
            action: AuditAction.MEMBER_UPDATED,
            before: { hasPhoto: Boolean(member.photoKey) },
            after: { hasPhoto: true },
            metadata: { changedField: 'photo' },
            ...this.requestIdData(requestId),
          },
          tx,
        );
        return result;
      });
      if (member.photoKey) await unlink(this.photoPath(member.photoKey)).catch(() => undefined);
      return { photoUrl: this.photoUrl(updated)! };
    } catch (error) {
      await unlink(path).catch(() => undefined);
      throw error;
    }
  }

  async getPhoto(memberId: string) {
    const member = await this.requireMember(memberId);
    if (!member.photoKey)
      throw new NotFoundException({
        code: 'MEMBER_PHOTO_NOT_FOUND',
        message: 'لا توجد صورة للعضو',
      });
    try {
      return await readFile(this.photoPath(member.photoKey));
    } catch {
      throw new NotFoundException({
        code: 'MEMBER_PHOTO_NOT_FOUND',
        message: 'صورة العضو غير موجودة',
      });
    }
  }

  async emptyHistory(memberId: string, query: PaginationDto) {
    await this.requireMember(memberId);
    return { items: [], pagination: this.pagination(query.page, query.limit, 0) };
  }

  private async setArchived(
    memberId: string,
    archived: boolean,
    actorOwnerId: string,
    requestId?: string,
  ) {
    const before = await this.requireMember(memberId);
    if (before.isArchived === archived)
      throw new ConflictException({
        code: archived ? 'MEMBER_ALREADY_ARCHIVED' : 'MEMBER_NOT_ARCHIVED',
        message: archived ? 'العضو مؤرشف بالفعل' : 'العضو غير مؤرشف',
      });
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.member.update({
        where: { id: memberId },
        data: { isArchived: archived, archivedAt: archived ? new Date() : null },
      });
      await this.audit.append(
        {
          actorOwnerId,
          entityType: AuditEntityType.MEMBER,
          entityId: memberId,
          action: archived ? AuditAction.MEMBER_ARCHIVED : AuditAction.MEMBER_RESTORED,
          before: this.auditSnapshot(before),
          after: this.auditSnapshot(result),
          ...this.requestIdData(requestId),
        },
        tx,
      );
      return result;
    });
    return this.detail(updated);
  }

  private async requireMember(id: string) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member)
      throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'العضو غير موجود' });
    return member;
  }
  private validPhone(value: string) {
    const phone = normalizeEgyptianPhone(value);
    if (!phone)
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'رقم الهاتف المصري غير صالح',
      });
    return phone;
  }
  private validateBirthDate(value: string) {
    if (value > new Date().toISOString().slice(0, 10))
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'تاريخ الميلاد لا يمكن أن يكون في المستقبل',
      });
  }
  private rethrowUniquePhone(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      throw new ConflictException({
        code: 'MEMBER_PHONE_ALREADY_EXISTS',
        message: 'رقم الهاتف مسجل لعضو آخر',
      });
    throw error;
  }
  private pagination(page: number, limit: number, totalItems: number) {
    return { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) };
  }
  private requestIdData(requestId?: string) {
    return requestId ? { requestId } : {};
  }
  private photoPath(photoKey: string) {
    if (!/^[A-Za-z0-9_-]{32}\.webp$/.test(photoKey)) {
      throw new NotFoundException({
        code: 'MEMBER_PHOTO_NOT_FOUND',
        message: 'صورة العضو غير موجودة',
      });
    }
    return resolve(this.photoDirectory, photoKey);
  }
  private emptyPage(query: PaginationDto) {
    return { items: [], pagination: this.pagination(query.page, query.limit, 0) };
  }
  private detail(member: Member) {
    return {
      id: member.id,
      name: member.name,
      phone: member.phoneDisplay,
      gender: member.gender,
      dateOfBirth: dateOnly(member.dateOfBirth),
      photoUrl: this.photoUrl(member),
      heightCm: member.heightCm === null ? null : Number(member.heightCm),
      weightKg: member.weightKg === null ? null : Number(member.weightKg),
      joinDate: dateOnly(member.joinDate),
      isArchived: member.isArchived,
      archivedAt: member.archivedAt?.toISOString() ?? null,
      currentSubscription: null,
      nextSubscription: null,
      outstandingBalanceMinor: 0,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    };
  }
  private auditSnapshot(member: Member): Prisma.InputJsonObject {
    return {
      name: member.name,
      phone: member.phoneDisplay,
      gender: member.gender,
      dateOfBirth: dateOnly(member.dateOfBirth),
      heightCm: member.heightCm === null ? null : Number(member.heightCm),
      weightKg: member.weightKg === null ? null : Number(member.weightKg),
      joinDate: dateOnly(member.joinDate),
      isArchived: member.isArchived,
      archivedAt: member.archivedAt?.toISOString() ?? null,
    };
  }
  private photoUrl(member: Pick<Member, 'id' | 'photoKey' | 'updatedAt'>) {
    return member.photoKey
      ? `/api/v1/members/${member.id}/photo?v=${member.updatedAt.getTime()}`
      : null;
  }
}
