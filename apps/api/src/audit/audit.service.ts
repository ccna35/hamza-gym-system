import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AuditLogQueryDto, PaginationQueryDto } from './audit.dto';

type AuditWriter = Pick<Prisma.TransactionClient, 'auditLog'>;

export type AppendAuditEvent = {
  actorOwnerId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  before?: Prisma.InputJsonValue | null;
  after?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue | null;
  requestId?: string | null;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  append(event: AppendAuditEvent, writer: AuditWriter = this.prisma) {
    return writer.auditLog.create({
      data: {
        actorOwnerId: event.actorOwnerId,
        entityType: event.entityType,
        entityId: event.entityId,
        action: event.action,
        beforeJson: event.before ?? Prisma.JsonNull,
        afterJson: event.after ?? Prisma.JsonNull,
        metadataJson: event.metadata ?? Prisma.JsonNull,
        requestId: event.requestId ?? null,
      },
    });
  }

  async list(query: AuditLogQueryDto) {
    const createdAt = this.dateRange(query.from, query.to);
    const where: Prisma.AuditLogWhereInput = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.action) where.action = query.action;
    if (query.entityId) where.entityId = query.entityId;
    if (createdAt) where.createdAt = createdAt;
    return this.findPage(where, query.page, query.limit);
  }

  async listForMember(memberId: string, query: PaginationQueryDto) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });
    if (!member) {
      throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'العضو غير موجود' });
    }
    return this.findPage(
      { entityType: AuditEntityType.MEMBER, entityId: memberId },
      query.page,
      query.limit,
    );
  }

  private async findPage(where: Prisma.AuditLogWhereInput, page: number, limit: number) {
    const [records, totalItems] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      items: records.map((record) => ({
        id: record.id,
        actorOwnerId: record.actorOwnerId,
        entityType: record.entityType,
        entityId: record.entityId,
        action: record.action,
        before: record.beforeJson,
        after: record.afterJson,
        metadata: record.metadataJson,
        createdAt: record.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  private dateRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
    if (from && to && from > to) {
      throw new BadRequestException({
        code: 'INVALID_DATE_RANGE',
        message: 'تاريخ البداية يجب ألا يكون بعد تاريخ النهاية',
      });
    }
    if (!from && !to) return undefined;
    const range: Prisma.DateTimeFilter = {};
    if (from) range.gte = this.cairoStartOfDay(from);
    if (to) range.lt = this.cairoStartOfDay(this.nextDate(to));
    return range;
  }

  private cairoStartOfDay(value: string) {
    const [year, month, day] = value.split('-').map(Number) as [number, number, number];
    const noonUtc = new Date(Date.UTC(year, month - 1, day, 12));
    const offset = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      timeZoneName: 'longOffset',
    })
      .formatToParts(noonUtc)
      .find((part) => part.type === 'timeZoneName')?.value;
    const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(offset ?? 'GMT+00:00');
    const minutes = match
      ? (match[1] === '+' ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3]))
      : 0;
    return new Date(Date.UTC(year, month - 1, day) - minutes * 60_000);
  }

  private nextDate(value: string) {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  }
}
