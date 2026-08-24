import { randomBytes } from 'node:crypto';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';
import { AuditAction, AuditEntityType, Payment, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import { dateOnly, parseDateOnly } from '../members/member.utils';
import { CreatePaymentDto, PaymentQueryDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(memberId: string, query: PaymentQueryDto) {
    await this.requireMember(memberId);
    const where = { memberId };
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.payment.count({ where }),
    ]);
    return {
      items: items.map((item) => this.response(item)),
      pagination: {
        page: query.page,
        limit: query.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / query.limit),
      },
    };
  }

  async create(
    memberId: string,
    input: CreatePaymentDto,
    actorOwnerId: string,
    requestId?: string,
  ) {
    this.validateDate(input.paymentDate);
    return this.prisma.$transaction(async (tx) => {
      await this.lockMember(tx, memberId);
      return this.createInTransaction(tx, memberId, input, actorOwnerId, requestId);
    });
  }

  async createInTransaction(
    tx: Prisma.TransactionClient,
    memberId: string,
    input: CreatePaymentDto,
    actorOwnerId: string,
    requestId?: string,
    subscriptionId?: string,
  ) {
    this.validateDate(input.paymentDate);
    const balance = await this.balance(tx, memberId);
    if (balance <= 0)
      throw new UnprocessableEntityException({
        code: 'MEMBER_HAS_NO_OUTSTANDING_BALANCE',
        message: 'لا يوجد رصيد مستحق على العضو',
      });
    if (input.amountMinor > balance)
      throw new UnprocessableEntityException({
        code: 'PAYMENT_EXCEEDS_BALANCE',
        message: 'قيمة الدفعة أكبر من الرصيد المستحق',
      });
    const receiptNumber = await this.allocateReceiptNumber(tx);
    const created = await tx.payment.create({
      data: {
        memberId,
        amountMinor: BigInt(input.amountMinor),
        balanceAfterPaymentMinor: BigInt(balance - input.amountMinor),
        paymentDate: parseDateOnly(input.paymentDate),
        receiptNumber,
        verificationToken: randomBytes(24).toString('base64url'),
      },
    });
    await this.audit.append(
      {
        actorOwnerId,
        entityType: AuditEntityType.PAYMENT,
        entityId: created.id,
        action: AuditAction.PAYMENT_CREATED,
        after: this.snapshot(created),
        ...(subscriptionId ? { metadata: { subscriptionId } } : {}),
        ...(requestId ? { requestId } : {}),
      },
      tx,
    );
    return this.response(created);
  }

  async get(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { member: true },
    });
    if (!payment)
      throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'الدفعة غير موجودة' });
    return {
      payment: this.response(payment),
      member: {
        id: payment.member.id,
        name: payment.member.name,
        phone: payment.member.phoneDisplay,
      },
    };
  }

  async void(paymentId: string, reason: string, actorOwnerId: string, requestId?: string) {
    const before = await this.requirePayment(paymentId);
    if (before.voidedAt)
      throw new ConflictException({
        code: 'PAYMENT_ALREADY_VOIDED',
        message: 'الدفعة ملغاة بالفعل',
      });
    return this.prisma.$transaction(async (tx) => {
      await this.lockMember(tx, before.memberId);
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: { voidedAt: new Date(), voidReason: reason },
      });
      await this.audit.append(
        {
          actorOwnerId,
          entityType: AuditEntityType.PAYMENT,
          entityId: paymentId,
          action: AuditAction.PAYMENT_VOIDED,
          before: this.snapshot(before),
          after: this.snapshot(updated),
          metadata: { reason },
          ...(requestId ? { requestId } : {}),
        },
        tx,
      );
      return this.response(updated);
    });
  }

  async balance(tx: Prisma.TransactionClient, memberId: string) {
    const [charges, payments] = await Promise.all([
      tx.subscription.aggregate({
        where: { memberId, voidedAt: null },
        _sum: { agreedPriceMinor: true },
      }),
      tx.payment.aggregate({ where: { memberId, voidedAt: null }, _sum: { amountMinor: true } }),
    ]);
    return Number((charges._sum.agreedPriceMinor ?? 0n) - (payments._sum.amountMinor ?? 0n));
  }

  async lockMember(tx: Prisma.TransactionClient, memberId: string) {
    const rows = await tx.$queryRaw<
      Array<{ id: string }>
    >`SELECT id FROM "Member" WHERE id = ${memberId}::uuid FOR UPDATE`;
    if (!rows.length)
      throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'العضو غير موجود' });
  }

  private async allocateReceiptNumber(tx: Prisma.TransactionClient) {
    const year = new Date().getUTCFullYear();
    const key = `receipt:${year}`;
    await tx.systemCounter.upsert({ where: { key }, create: { key, nextValue: 1n }, update: {} });
    const rows = await tx.$queryRaw<
      Array<{ nextValue: bigint }>
    >`SELECT "nextValue" FROM "SystemCounter" WHERE "key" = ${key} FOR UPDATE`;
    const value = rows[0]!.nextValue;
    await tx.systemCounter.update({ where: { key }, data: { nextValue: value + 1n } });
    return `REC-${year}-${value.toString().padStart(6, '0')}`;
  }
  private validateDate(value: string) {
    if (value > new Date().toISOString().slice(0, 10))
      throw new UnprocessableEntityException({
        code: 'PAYMENT_DATE_IN_FUTURE',
        message: 'تاريخ الدفع لا يمكن أن يكون في المستقبل',
      });
  }
  private async requireMember(id: string) {
    const item = await this.prisma.member.findUnique({ where: { id } });
    if (!item)
      throw new NotFoundException({ code: 'MEMBER_NOT_FOUND', message: 'العضو غير موجود' });
    return item;
  }
  private async requirePayment(id: string) {
    const item = await this.prisma.payment.findUnique({ where: { id } });
    if (!item)
      throw new NotFoundException({ code: 'PAYMENT_NOT_FOUND', message: 'الدفعة غير موجودة' });
    return item;
  }
  response(item: Payment) {
    return {
      id: item.id,
      memberId: item.memberId,
      amountMinor: Number(item.amountMinor),
      paymentDate: dateOnly(item.paymentDate),
      paymentMethod: item.paymentMethod,
      receiptNumber: item.receiptNumber,
      balanceAfterPaymentMinor: Number(item.balanceAfterPaymentMinor),
      status: item.voidedAt ? 'VOIDED' : 'VALID',
      voidedAt: item.voidedAt?.toISOString() ?? null,
      voidReason: item.voidReason,
      createdAt: item.createdAt.toISOString(),
    };
  }
  private snapshot(item: Payment): Prisma.InputJsonObject {
    return this.response(item);
  }
}
